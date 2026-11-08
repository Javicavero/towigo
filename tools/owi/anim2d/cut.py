"""Recorta las figuras de la hoja de diseño y quita el fondo crema (flood fill + alfa suave)."""
import sys, json
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

SHEET = '/home/user/towigo/docs/owi/hoja-diseno-owi.webp'
BOXES = {
    'front': (285, 100, 565, 372),
    'threeq': (598, 100, 852, 372),
    'side': (876, 100, 1142, 372),
    'back': (1150, 100, 1424, 372),
    'neutral': (296, 448, 584, 736),
    'comic': (656, 452, 996, 736),
    'sport': (1040, 452, 1300, 736),
}

def cut(img, lo=10.0, hi=30.0):
    a = np.asarray(img).astype(np.float32)
    h, w, _ = a.shape
    # color de fondo local: media del borde
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(-1))
    # sombras de suelo: tonos claros y poco saturados -> también fondo
    mx = a.max(-1); mn = a.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
    shadowish = (mx > 190) & (sat < 0.17)
    # sombra del suelo (gris rosado, poco amarillo): G-B pequeño, solo en la franja inferior
    band = np.zeros((h, w), bool); band[int(h * 0.78):] = True
    shadowcol = band & ((a[..., 1] - a[..., 2]) < 24) & (a[..., 0] < 248)
    shadowish = shadowish | shadowcol
    cand = (dist < hi) | shadowish
    # flood fill desde los bordes sobre candidatos a fondo
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and cand[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    # fondo "atrapado" entre piernas y púas (no conecta con el borde): en la franja inferior también es fondo
    low = np.zeros((h, w), bool); low[int(h * 0.7):] = True
    seen = seen | (low & ((dist < hi) | shadowish))
    alpha = np.ones((h, w), np.float32)
    ramp = np.clip((dist - lo) / (hi - lo), 0, 1)
    alpha[seen] = np.minimum(alpha[seen], ramp[seen] * (~shadowish[seen]))
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    # descontaminar el color del fondo en bordes semitransparentes
    A = np.asarray(al).astype(np.float32)[..., None] / 255
    rgb = np.where(A > 0.02, np.clip((a - bg * (1 - A)) / np.maximum(A, 0.02), 0, 255), a)
    out = np.dstack([rgb, np.asarray(al)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

if __name__ == '__main__':
    out = sys.argv[1]
    sheet = Image.open(SHEET).convert('RGB')
    # borra la flecha de la etiqueta "Cinta deportiva" (no es parte del personaje)
    from PIL import ImageDraw
    ImageDraw.Draw(sheet).rectangle((1262, 478, 1312, 512), fill=(251, 239, 231))
    for k, b in BOXES.items():
        im = cut(sheet.crop(b))
        im = im.crop(im.getbbox())
        im.save(f'{out}/{k}.png')
        print(k, im.size)
