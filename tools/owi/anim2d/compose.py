"""Compone las 12 emociones de Owi SOLO con piezas de la hoja de diseño (2D)."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
sys.path.insert(0, sys.path[0])
from cut import cut, BOXES, SHEET

sheet = Image.open(SHEET).convert('RGB')
ImageDraw.Draw(sheet).rectangle((1262, 478, 1312, 512), fill=(251, 239, 231))

def feat(box, pad=4):
    x0, y0, x1, y1 = box
    im = cut(sheet.crop((x0 - pad, y0 - pad, x1 + pad, y1 + pad)))
    return im.crop(im.getbbox())

F = {
    'eyes_normal': feat((908, 830, 1022, 887)),
    'eyes_happy': feat((1045, 833, 1145, 875)),
    'eyes_surprised': feat((1168, 830, 1272, 879)),
    'brow_normal': (feat((910, 913, 960, 950)), feat((960, 913, 1000, 950))),
    'brow_worried': (feat((1125, 913, 1168, 950)), feat((1168, 913, 1210, 950))),
    'brow_sad': (feat((1340, 913, 1376, 950)), feat((1376, 913, 1412, 950))),
    'mouth_smile': feat((913, 990, 972, 1016)),
    'mouth_open': feat((1000, 985, 1057, 1022)),
    'mouth_o': feat((1197, 1000, 1218, 1024)),
}
# los ojos sorprendidos traen una boquita entre ellos: se borra
es = F['eyes_surprised']; d = ImageDraw.Draw(es); w, h = es.size
d.rectangle((int(w * 0.40), int(h * 0.72), int(w * 0.60), h), fill=(0, 0, 0, 0))


def soft_fill(img, ellipses):
    """Rellena las elipses con el color de la cara que las rodea (relleno suave por difusión)."""
    a = np.asarray(img).astype(np.float32)
    mask = Image.new('L', img.size, 0); md = ImageDraw.Draw(mask)
    for e in ellipses: md.ellipse(e, fill=255)
    m = np.asarray(mask) > 0
    out = a.copy()
    known = ~m
    # difusión iterativa: cada píxel desconocido toma la media de sus vecinos conocidos
    cur = out.copy(); k = known.copy()
    for _ in range(60):
        acc = np.zeros_like(cur); cnt = np.zeros(k.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.roll(np.roll(cur * k[..., None], dy, 0), dx, 1); c = np.roll(np.roll(k, dy, 0), dx, 1)
            acc += sh; cnt += c
        newk = (~k) & (cnt > 0)
        cur[newk] = acc[newk] / cnt[newk][:, None]
        k = k | newk
        if k.all(): break
    # suavizado del relleno para que no queden vetas
    blur = np.asarray(Image.fromarray(cur.astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32)
    out[m] = blur[m]
    return Image.fromarray(out.astype(np.uint8))

def paste_center(base, im, cx, cy, width):
    s = width / im.size[0]
    im2 = im.resize((max(1, round(im.size[0] * s)), max(1, round(im.size[1] * s))), Image.LANCZOS)
    base.paste(im2, (round(cx - im2.size[0] / 2), round(cy - im2.size[1] / 2)), im2)

EYE_ELL = [(365, 191, 424, 250), (440, 191, 500, 250)]
BROW_ELL = [(374, 165, 425, 199), (439, 165, 491, 199)]
MOUTH_ELL = [(398, 248, 462, 274)]
NOSE = (417, 229, 448, 256)

def front_variant(eyes=None, brows=None, mouth=None, flip_eyes=False):
    s = sheet.copy()
    region = (330, 150, 540, 300)
    face = s.crop(region)
    ell = []
    if eyes: ell += EYE_ELL
    if brows: ell += BROW_ELL
    if mouth: ell += MOUTH_ELL
    off = lambda e: (e[0] - region[0], e[1] - region[1], e[2] - region[0], e[3] - region[1])
    face = soft_fill(face, [off(e) for e in ell])
    # recupera la nariz original
    nose_mask = Image.new('L', face.size, 0); ImageDraw.Draw(nose_mask).ellipse(off(NOSE), fill=255)
    face.paste(sheet.crop(region), (0, 0), nose_mask.filter(ImageFilter.GaussianBlur(1)))
    s.paste(face, region[:2])
    rgba = s.convert('RGBA')
    if eyes:
        e = F[eyes]
        if flip_eyes: e = ImageOps.flip(e)
        paste_center(rgba, e, 432.5, 221 if eyes != 'eyes_happy' else 222, 132 if eyes != 'eyes_happy' else 118)
    if brows:
        l, r = F[brows]
        paste_center(rgba, l, 399, 182, 40)
        paste_center(rgba, r, 465, 182, 40)
    if mouth:
        paste_center(rgba, F[mouth], 430, 262, {'mouth_smile': 50, 'mouth_open': 44, 'mouth_o': 14, 'mouth_sad': 34}[mouth])
    out = cut(rgba.convert('RGB').crop(BOXES['front']))
    return out.crop(out.getbbox())

def pose(name):
    im = cut(sheet.crop(BOXES[name]))
    if name == 'sport':
        a = np.asarray(im).copy(); a[int(a.shape[0] * 0.92):, :, 3] = 0; im = Image.fromarray(a)
    return im.crop(im.getbbox())

if __name__ == '__main__':
    out = sys.argv[1]
    sad = ImageOps.flip(F['mouth_smile'])
    F['mouth_sad'] = sad
    V = {
        'happy': front_variant(mouth='mouth_open'),
        'caring': front_variant(eyes='eyes_happy', mouth='mouth_smile'),
        'sleep': front_variant(eyes='eyes_happy', flip_eyes=True, mouth='mouth_o', brows='brow_normal'),
        'confused': front_variant(eyes='eyes_surprised', mouth='mouth_o'),
        'worried': front_variant(brows='brow_worried', mouth='mouth_o'),
        'missYou': front_variant(brows='brow_sad', mouth='mouth_sad'),
        'blink': front_variant(eyes='eyes_happy', flip_eyes=True),
        'front': pose('front'),
        'threeq': pose('threeq'),
        'neutral': pose('neutral'),
        'comic': pose('comic'),
        'sport': pose('sport'),
    }
    for k, v in V.items():
        v.save(f'{out}/{k}.png')
    print('ok')
