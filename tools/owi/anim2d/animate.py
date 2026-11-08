"""
Anima a Owi en 2D a partir de las piezas de la hoja de diseño (sin 3D).
Movimiento con transformaciones de "dibujo animado" (estirar y encoger, balanceo, saltos, inclinación, respiración)
con pivote en los pies + efectos (chispas de la propia hoja, corazones, Z, ?, !, gota).
Salida: hojas de sprites WebP (8 columnas, 20 fps) + meta.json, el formato que usa OwiSprite.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

VAR = sys.argv[1]
OUT = sys.argv[2]
FS = 320          # tamaño del fotograma final
SS = 2            # supermuestreo
C = FS * SS
FPS = 20
COLS = 8
FONT = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf', 64 * SS)
SHEET = Image.open(os.path.join(os.path.dirname(__file__), '..', 'sheet.png')).convert('RGB') if False else None

def load(n):
    return Image.open(f'{VAR}/{n}.png').convert('RGBA')

# chispas amarillas de la hoja (panel "Expresión cómica")
from cut import cut
_sheet = Image.open('/home/user/towigo/docs/owi/hoja-diseno-owi.webp').convert('RGB')
SPARK = cut(_sheet.crop((900, 458, 968, 536)))
SPARK = SPARK.crop(SPARK.getbbox())

BASE_H = 0.80 * C   # altura del personaje
GROUND = 0.955 * C  # línea de los pies

def place(img, sx=1, sy=1, rot=0, shear=0, dx=0, dy=0, scale=1.0):
    """Coloca la figura con pivote en los pies y aplica la deformación."""
    k = BASE_H / img.size[1] * scale
    w, h = img.size
    big = img.resize((round(w * k), round(h * k)), Image.LANCZOS)
    W, H = big.size
    canvas = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    # matriz directa: punto relativo al pivote (pies) -> escala -> cizalla -> rotación -> traslado
    px, py = W / 2, H  # pivote en la imagen
    cx, cy = C / 2 + dx * SS, GROUND + dy * SS
    a = math.radians(rot)
    ca, sa = math.cos(a), math.sin(a)
    # M = R * Sh * S
    m00, m01 = sx, shear * sy
    m10, m11 = 0, sy
    r00, r01 = ca * m00 - sa * m10, ca * m01 - sa * m11
    r10, r11 = sa * m00 + ca * m10, sa * m01 + ca * m11
    det = r00 * r11 - r01 * r10
    i00, i01, i10, i11 = r11 / det, -r01 / det, -r10 / det, r00 / det
    # salida(x,y) -> imagen(u,v): (u-px, v-py) = inv * (x-cx, y-cy)
    coeffs = (i00, i01, px - i00 * cx - i01 * cy, i10, i11, py - i10 * cx - i11 * cy)
    canvas = big.transform((C, C), Image.AFFINE, coeffs, resample=Image.BICUBIC)
    return canvas

def heart(d, cx, cy, r, color=(240, 104, 98, 255), alpha=1.0):
    pts = []
    for i in range(80):
        t = i / 80 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * r / 16, cy + y * r / 16))
    col = color[:3] + (int(255 * alpha),)
    d.polygon(pts, fill=col)
    d.ellipse((cx - r * 0.55, cy - r * 0.55, cx - r * 0.2, cy - r * 0.25), fill=(255, 255, 255, int(150 * alpha)))

def text(canvas, s, cx, cy, size, color, alpha=1.0, rot=0):
    f = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf', int(size))
    tmp = Image.new('RGBA', (int(size * 1.6), int(size * 1.6)), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text((size * 0.8, size * 0.8), s, font=f, fill=color[:3] + (int(255 * alpha),), anchor='mm', stroke_width=max(2, int(size * 0.06)), stroke_fill=(255, 255, 255, int(230 * alpha)))
    if rot: tmp = tmp.rotate(rot, resample=Image.BICUBIC)
    canvas.alpha_composite(tmp, (int(cx - tmp.size[0] / 2), int(cy - tmp.size[1] / 2)))

def drop(d, cx, cy, r, alpha=1.0):
    col = (110, 190, 242, int(255 * alpha))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    d.polygon([(cx - r * 0.85, cy - r * 0.45), (cx + r * 0.85, cy - r * 0.45), (cx, cy - r * 2.1)], fill=col)
    d.ellipse((cx - r * 0.45, cy - r * 0.2, cx - r * 0.1, cy + r * 0.25), fill=(255, 255, 255, int(170 * alpha)))

def sparks(canvas, cx, cy, s, flip=False, alpha=1.0):
    sp = SPARK.resize((int(SPARK.size[0] * s), int(SPARK.size[1] * s)), Image.LANCZOS)
    if flip: sp = sp.transpose(Image.FLIP_LEFT_RIGHT)
    if alpha < 1:
        a = sp.getchannel('A').point(lambda v: int(v * alpha)); sp.putalpha(a)
    canvas.alpha_composite(sp, (int(cx - sp.size[0] / 2), int(cy - sp.size[1] / 2)))

def hop(p, n, h):  # n saltos por bucle, altura h (px)
    return -abs(math.sin(p * math.pi * n)) * h

def land(p, n):  # 1 al tocar el suelo
    return 1 - abs(math.sin(p * math.pi * n))

U = C / 320  # unidades de diseño (px del fotograma final)

def frame(mood, p, imgs):
    tau = 2 * math.pi * p
    fx = []  # efectos a dibujar después
    if mood == 'happy':
        l = land(p, 2) ** 6
        img = place(imgs['happy'], sx=1 + 0.05 * l, sy=1 - 0.06 * l, rot=3 * math.sin(tau), dy=hop(p, 2, 16))
        fx.append(('sparks', 0.17, 0.2, 1.0 + 0.12 * math.sin(tau * 4), True))
    elif mood == 'attentive':
        img = place(imgs['threeq'], rot=2.5 * math.sin(tau), shear=0.06 * math.sin(tau), sy=1 + 0.012 * math.sin(tau * 2))
    elif mood in ('caringHigh', 'caringLow'):
        img = place(imgs['caring'], rot=3.5 * math.sin(tau), sy=1 + 0.02 * math.sin(tau * 2), sx=1 - 0.01 * math.sin(tau * 2))
        big = mood == 'caringHigh'
        fx.append(('hug', 1.0 + 0.08 * math.sin(tau * 2), big))
        for k in range(2 if big else 1):
            q = (p + k * 0.5) % 1
            fx.append(('heart', 0.74 + 0.04 * math.sin(q * 6), 0.32 - q * 0.22, (16 if big else 12) * (0.7 + 0.3 * q), 1 - q ** 3))
    elif mood in ('worriedHigh', 'worriedLow'):
        a = 2.4 if mood == 'worriedHigh' else 1.4
        img = place(imgs['worried'], dx=a * math.sin(tau * 8), sy=1 + 0.012 * math.sin(tau * 2))
        fx.append(('drop', 0.76, 0.22 + 0.02 * math.sin(tau * 2), 9))
    elif mood == 'celebrate':
        l = land(p, 3) ** 8
        img = place(imgs['comic'], sx=1 + 0.08 * l, sy=1 - 0.1 * l + 0.04 * (1 - l), rot=4 * math.sin(tau * 3), dy=hop(p, 3, 34))
    elif mood == 'sleep':
        img = place(imgs['sleep'], sy=0.99 + 0.025 * math.sin(tau), sx=1.0 - 0.01 * math.sin(tau), rot=2.5 * math.sin(tau))
        for k in range(3):
            q = (p + k / 3) % 1
            fx.append(('text', 'z', 0.68 + q * 0.14, 0.34 - q * 0.26, 30 + 16 * q, (139, 111, 232), min(1, 4 * q) * (1 - q ** 2), -12))
    elif mood == 'confused':
        img = place(imgs['confused'], rot=6 * math.sin(tau), shear=0.03 * math.sin(tau))
        fx.append(('text', '?', 0.8, 0.18 + 0.02 * math.sin(tau * 2), 60, (139, 111, 232), 1, 10 * math.sin(tau)))
    elif mood == 'remind':
        l = land(p, 2) ** 6
        img = place(imgs['neutral'], sx=1 + 0.04 * l, sy=1 - 0.05 * l, dy=hop(p, 2, 10), rot=2 * math.sin(tau))
        fx.append(('text', '!', 0.82, 0.16, 62 * (1 + 0.1 * math.sin(tau * 4)), (245, 180, 0), 1, 8))
        fx.append(('sparks', 0.9, 0.3, 0.8, False))
    elif mood == 'sport':
        l = land(p, 2) ** 4
        img = place(imgs['sport'], sx=1 + 0.04 * l, sy=1 - 0.06 * l + 0.03 * (1 - l), rot=-3 + 2 * math.sin(tau), dy=hop(p, 2, 14), dx=3 * math.sin(tau))
    elif mood == 'missYou':
        img = place(imgs['missYou'], rot=4 * math.sin(tau), sy=1 + 0.015 * math.sin(tau * 2))
        q = p
        fx.append(('heart', 0.78 + 0.03 * math.sin(tau * 3), 0.3 - q * 0.18, 13, 1 - q ** 3))
    d = ImageDraw.Draw(img)
    for e in fx:
        if e[0] == 'sparks': sparks(img, e[1] * C, e[2] * C, e[3] * 0.9 * SS, e[4])
        elif e[0] == 'heart': heart(d, e[1] * C, e[2] * C, e[3] * U, alpha=max(0, e[4]))
        elif e[0] == 'hug':
            r = (30 if e[2] else 20) * U * e[1]
            heart(d, 0.5 * C, 0.75 * C, r)
        elif e[0] == 'drop': drop(d, e[1] * C, e[2] * C, e[3] * U)
        elif e[0] == 'text': text(img, e[1], e[2] * C, e[3] * C, e[4] * U, e[5], max(0, e[6]), e[7])
    return img.resize((FS, FS), Image.LANCZOS)

LOOP = {'happy': 2.4, 'attentive': 3.2, 'caringHigh': 3.2, 'worriedHigh': 1.6, 'caringLow': 3.2, 'worriedLow': 1.6,
        'celebrate': 2.4, 'sleep': 4.0, 'confused': 3.2, 'remind': 2.4, 'sport': 0.8, 'missYou': 3.2}

if __name__ == '__main__':
    imgs = {n: load(n) for n in ['happy', 'threeq', 'caring', 'worried', 'comic', 'sleep', 'confused', 'neutral', 'sport', 'missYou']}
    only = sys.argv[3:] or list(LOOP)
    meta_p = f'{OUT}/meta.json'
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for m in only:
        n = round(LOOP[m] * FPS)
        rows = math.ceil(n / COLS)
        sheet = Image.new('RGBA', (FS * COLS, FS * rows), (0, 0, 0, 0))
        for i in range(n):
            sheet.alpha_composite(frame(m, i / n, imgs), ((i % COLS) * FS, (i // COLS) * FS))
        sheet.save(f'{OUT}/{m}.webp', 'WEBP', quality=72, method=4)
        meta[m] = {'frames': n, 'cols': COLS, 'fps': FPS}
        print(m, n, os.path.getsize(f'{OUT}/{m}.webp') // 1024, 'KB', flush=True)
    json.dump(meta, open(meta_p, 'w'), indent=1)
