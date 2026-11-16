"""
Owi como marioneta 2D hecha SOLO con las piezas del usuario (docs/owi/piezas):
cuerpo base, brazos, pies, ojos, iris y nariz. Cada pieza se mueve por separado:
- ojos: parpadeo con el propio párpado de piel del cuerpo, mirada (el iris se mueve dentro del ojo),
  ojos felices (^ ^) y dormidos, pupilas grandes ("ojos de cachorro");
- cejas y boca dibujadas en el marrón del personaje (sonrisa, risa con lengua, "o", triste, temblorosa);
- brazos con pivote en el hombro (saludar, abrazar, levantar, rascarse la cabeza, correr);
- pies que pisan; todo el cuerpo se estira y encoge, salta y se balancea con pivote en los pies.
Salida: hojas de sprites WebP (8 columnas, 20 fps) + meta.json (formato de OwiSprite), y pegatinas PNG.

    python3 rig.py ../../../assets/owi            # todas las emociones
    python3 rig.py ../../../assets/owi happy      # solo una
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

from parts import load

FS = 320            # fotograma final
SS = 2              # supermuestreo
C = FS * SS
FPS = 20
COLS = 8
FOOT_Y = 1177       # línea de los pies en coordenadas del modelo (= owi-frente.webp, 1254 px)
TOP_Y = 49
K = 0.80 * C / (FOOT_Y - TOP_Y)   # modelo -> lienzo
GROUND = 0.955 * C
U = C / 320
DK = (72, 34, 18, 255)              # marrón de rasgos (boca, pestañas): el de la imagen de frente
FONT = '/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'

# --- Colocación de las piezas: medida sobre owi-frente.webp (centro x, y; ancho, alto) ---
EYE = {'L': (482, 536), 'R': (772, 537)}
EYE_SIZE = {'L': (210, 216), 'R': (206, 219)}
IRIS_SIZE = (134, 150)
IRIS_REST = {'L': (42, 14), 'R': (-48, 13)}     # mirada en reposo, como en el dibujo (hacia la nariz)
NOSE = (624, 628, 109)
MOUTH = (628, 694)
BROW_BOX = {'L': (424, 342, 588, 432), 'R': (668, 342, 826, 433)}
MOUTH_BOX = (532, 660, 724, 728)
ARM_C = {'L': (262, 836), 'R': (971, 836)}
ARM_SIZE = (136, 214)
ARM_PIVOT = 0.13                                # el hombro, en fracción de la altura del brazo
ARM_REST = {'L': 0, 'R': 0}                     # grados; positivo = la mano va hacia la derecha de la pantalla
FOOT = {'L': (450, 1113), 'R': (772, 1113)}
FOOT_SIZE = (242, 130)
CHEEK = {'L': (400, 668), 'R': (852, 668)}
SHOULDER = {s: (ARM_C[s][0], ARM_C[s][1] - ARM_SIZE[1] * (0.5 - ARM_PIVOT)) for s in 'LR'}

P = load()


def sc(im, w, h=None):
    h = h if h is not None else w * im.size[1] / im.size[0]
    return im.resize((max(1, round(w * K)), max(1, round(h * K))), Image.LANCZOS)


def M(x, y):
    """Modelo -> lienzo de la figura (C x C, pies en GROUND, centrado)."""
    return (C / 2 + (x - 627) * K, GROUND + (y - FOOT_Y) * K)


def feature(box):
    """Recorta un rasgo oscuro (ceja, boca) de la imagen de frente con su transparencia."""
    a = np.asarray(P['front'].crop(box).convert('RGB')).astype(np.float32)
    lum = a.mean(-1)
    alpha = np.clip((175 - lum) / 75, 0, 1)
    from scipy import ndimage
    lab, n = ndimage.label(alpha > 0.3)
    if n > 1:  # solo la pieza principal (fuera restos de orejas u ojos)
        keep = lab == (np.argmax(ndimage.sum(alpha > 0.3, lab, range(1, n + 1))) + 1)
        alpha = alpha * ndimage.binary_dilation(keep, iterations=3)
    col = np.zeros(a.shape[:2] + (4,), np.uint8)
    col[..., :3] = np.median(a[alpha > 0.85], axis=0)
    col[..., 3] = (alpha * 255).astype(np.uint8)
    im = Image.fromarray(col, 'RGBA')
    return im.resize((max(1, round(im.size[0] * K)), max(1, round(im.size[1] * K))), Image.LANCZOS)


# Piezas preescaladas
from base import get as base_get  # noqa: E402
BODY = base_get().resize((round(1254 * K), round(1254 * K)), Image.LANCZOS)
BODY_POS = (round(C / 2 - 627 * K), round(GROUND - FOOT_Y * K))
EYES = {s: sc(P['eye' + s], *EYE_SIZE[s]) for s in 'LR'}
IRIS = {'L': sc(P['iris'], *IRIS_SIZE), 'R': sc(P['iris'].transpose(Image.FLIP_LEFT_RIGHT), *IRIS_SIZE)}  # brillo hacia la nariz, como en el dibujo
NOSE_IM = sc(P['nose'], NOSE[2])
ARMS = {'L': sc(P['arm'], *ARM_SIZE), 'R': sc(P['arm2'], *ARM_SIZE)}
FEET = {'L': sc(P['foot'], *FOOT_SIZE), 'R': sc(P['foot2'], *FOOT_SIZE)}
BROWS = {s: feature(BROW_BOX[s]) for s in 'LR'}
SMILE = feature(MOUTH_BOX)


def eye_masks(im):
    a = np.asarray(im.getchannel('A')).astype(np.float32) / 255
    rgb = np.asarray(im.convert('RGB')).astype(np.float32)
    lum = rgb.mean(-1)
    outline = np.clip((175 - lum) / 60, 0, 1) * a          # contorno/párpado oscuro de la pieza
    inner = np.clip(a - outline, 0, 1)
    return a, outline, inner


EYE_M = {s: eye_masks(EYES[s]) for s in 'LR'}
# Capa de rubor (precalculada)
_bl = Image.new('RGBA', (C, C), (0, 0, 0, 0))
_bd = ImageDraw.Draw(_bl)
for s in 'LR':
    x, y = M(*CHEEK[s])
    r = 46 * K
    _bd.ellipse((x - r * 1.2, y - r * 0.75, x + r * 1.2, y + r * 0.75), fill=(255, 120, 130, 120))
BLUSH = _bl.filter(ImageFilter.GaussianBlur(14 * K))


def paste_center(canvas, im, x, y):
    canvas.alpha_composite(im, (round(x - im.size[0] / 2), round(y - im.size[1] / 2)))


def stroke(d, pts, w, col=DK):
    """Trazo grueso con extremos redondeados."""
    d.line(pts, fill=col, width=round(w), joint='curve')
    for x, y in (pts[0], pts[-1]):
        d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=col)


def quad(a, b, c, n=24):
    return [((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]) for t in (i / n for i in range(n + 1))]


# ---------------------------------------------------------------- ojos
def draw_eye(fig, s, lid=0.0, gaze=(0, 0), iris_k=1.0, closed=None, sparkle=False):
    """lid 0=abierto, 1=cerrado. closed: 'happy' (^) o 'sleep' (‿) dibuja el ojo cerrado."""
    ex, ey = M(*EYE[s])
    im = EYES[s]
    a, outline, inner = EYE_M[s]
    w, h = im.size
    x0, y0 = round(ex - w / 2), round(ey - h / 2)
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if closed is None:
        layer.alpha_composite(im)
        # iris recortado dentro del blanco
        ir = IRIS[s] if iris_k == 1 else IRIS[s].resize((round(IRIS[s].size[0] * iris_k), round(IRIS[s].size[1] * iris_k)), Image.LANCZOS)
        rx, ry = IRIS_REST[s]
        gx, gy = (rx + gaze[0]) * K, (ry + gaze[1]) * K
        il = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        paste_center(il, ir, w / 2 + gx, h / 2 + gy)
        if sparkle:  # brillos extra (ojos de cachorro)
            dd = ImageDraw.Draw(il)
            cx, cy = w / 2 + gx, h / 2 + gy
            r = 13 * K * iris_k
            dd.ellipse((cx - 34 * K - r, cy + 22 * K - r, cx - 34 * K + r, cy + 22 * K + r), fill=(255, 255, 255, 235))
        ia = np.asarray(il.getchannel('A')).astype(np.float32) / 255 * inner
        il.putalpha(Image.fromarray((ia * 255).astype(np.uint8)))
        layer.alpha_composite(il)
        # el contorno oscuro vuelve a quedar por encima del iris
        ol = im.copy()
        ol.putalpha(Image.fromarray((outline * 255).astype(np.uint8)))
        layer.alpha_composite(ol)
    # párpado: piel del propio cuerpo bajando desde arriba
    lid_amt = 1.0 if closed else min(1.0, lid)
    if lid_amt > 0.01:
        skin = BODY.crop((x0 - BODY_POS[0], y0 - BODY_POS[1], x0 - BODY_POS[0] + w, y0 - BODY_POS[1] + h))
        ys = np.arange(h)[:, None]
        xs = np.arange(w)[None, :]
        u = (xs - w / 2) / (w / 2)
        edge = (h * 0.04) + lid_amt * h * 0.98 + (1 - u ** 2) * h * 0.10 * lid_amt
        lm = np.clip((edge - ys) / 2.5, 0, 1)
        am = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
        m = lm * am
        sk = skin.copy()
        sk.putalpha(Image.fromarray((m * 255).astype(np.uint8)))
        layer.alpha_composite(sk)
        if not closed and lid_amt < 0.97:
            # pestaña en el borde del párpado
            dl = ImageDraw.Draw(layer)
            pts = []
            for i in range(41):
                uu = -0.92 + 1.84 * i / 40
                xx = w / 2 + uu * w / 2
                yy = (h * 0.04) + lid_amt * h * 0.98 + (1 - uu ** 2) * h * 0.10 * lid_amt
                ci = min(w - 1, max(0, int(xx)))
                col = a[:, ci]
                if yy < h and col[min(h - 1, int(yy))] > 0.4:
                    pts.append((xx, yy))
            if len(pts) > 2:
                stroke(dl, pts, 13 * K)
    fig.alpha_composite(layer, (x0, y0))
    if not closed and lid_amt >= 0.97:
        closed = 'blink'
    if closed:
        d = ImageDraw.Draw(fig)
        hw = w * 0.36
        if closed == 'happy':
            pts = quad((ex - hw, ey + h * 0.10), (ex, ey - h * 0.42), (ex + hw, ey + h * 0.10))
        elif closed == 'blink':
            pts = quad((ex - hw, ey + h * 0.12), (ex, ey + h * 0.26), (ex + hw, ey + h * 0.12))
        else:
            pts = quad((ex - hw, ey + h * 0.02), (ex, ey + h * 0.30), (ex + hw, ey + h * 0.02))
        stroke(d, pts, 15 * K)


# ---------------------------------------------------------------- cejas
def draw_brows(fig, raise_=0.0, inner=0.0, arch=1.0, asym=0.0, w=None):
    """Cejas de la imagen de frente. raise_: sube (+) / baja (-) en px de modelo.
    inner: + sube la punta interior (preocupado), - la baja (decidido). arch < 1 las aplana. asym: sube la derecha."""
    for s in 'LR':
        im = BROWS[s]
        if arch != 1.0:
            im = im.resize((im.size[0], max(1, round(im.size[1] * (0.55 + 0.45 * arch)))), Image.LANCZOS)
        ang = math.degrees(math.atan2(inner, 80)) * (1 if s == 'L' else -1)
        if ang:
            im = im.rotate(ang, expand=True, resample=Image.BICUBIC)
        x0, y0, x1, y1 = BROW_BOX[s]
        dy = -raise_ - (asym if s == 'R' else -asym * 0.3)
        paste_center(fig, im, *M((x0 + x1) / 2, (y0 + y1) / 2 + dy))


# ---------------------------------------------------------------- boca
def draw_mouth(fig, kind='smile', open_=0.0, wide=1.0, dy=0.0):
    d = ImageDraw.Draw(fig)
    mx, my = MOUTH
    my += dy
    hw = 80 * wide
    if kind == 'smile':   # la sonrisa de la imagen de frente
        im = SMILE if wide == 1 else SMILE.resize((max(1, round(SMILE.size[0] * wide)), SMILE.size[1]), Image.LANCZOS)
        x0, y0, x1, y1 = MOUTH_BOX
        paste_center(fig, im, *M((x0 + x1) / 2, (y0 + y1) / 2 + dy))
    elif kind == 'grin':   # boca abierta con lengua
        o = 0.55 + 0.45 * open_
        top = [(mx - hw, my - 14), (mx, my + 4), (mx + hw, my - 14)]
        poly = [M(*p) for p in quad(*top)] + [M(*p) for p in quad((mx + hw, my - 14), (mx, my + 110 * o), (mx - hw, my - 14))]
        d.polygon(poly, fill=(104, 36, 24, 255))
        # lengua
        tl = Image.new('RGBA', fig.size, (0, 0, 0, 0))
        td = ImageDraw.Draw(tl)
        cx, cy = M(mx, my + 52 * o)
        r = 36 * K
        td.ellipse((cx - r * 1.25, cy - r * 0.55, cx + r * 1.25, cy + r * 1.1), fill=(238, 110, 112, 255))
        mask = Image.new('L', fig.size, 0)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        tl.putalpha(ImageChops.multiply(tl.getchannel('A'), mask))
        fig.alpha_composite(tl)
        stroke(d, poly + [poly[0]], 9 * K)
    elif kind == 'o':
        rx, ry = 22 * wide * (1 + 0.3 * open_), 26 * (1 + 0.5 * open_)
        x0, y0 = M(mx - rx, my + 4 - ry)
        x1, y1 = M(mx + rx, my + 4 + ry)
        d.ellipse((x0, y0, x1, y1), fill=(104, 36, 24, 255), outline=DK, width=round(8 * K))
    elif kind == 'sad':
        pts = [M(*p) for p in quad((mx - hw * 0.7, my + 22), (mx, my - 8), (mx + hw * 0.7, my + 22))]
        stroke(d, pts, 15 * K)
    elif kind == 'wavy':
        pts = []
        for i in range(31):
            t = i / 30
            pts.append(M(mx - hw * 0.75 + t * hw * 1.5, my + 8 + 8 * math.sin(t * math.pi * 3 + open_ * 6)))
        stroke(d, pts, 12 * K)
    elif kind == 'side':   # media sonrisa torcida
        pts = [M(*p) for p in quad((mx - hw * 0.6, my + 8), (mx + 4, my + 18), (mx + hw * 0.6, my - 6))]
        stroke(d, pts, 12 * K)
    elif kind == 'sleep':
        rx, ry = 14 * (1 + 0.3 * open_), 12 * (1 + 0.6 * open_)
        x0, y0 = M(mx - rx, my + 8 - ry)
        x1, y1 = M(mx + rx, my + 8 + ry)
        d.ellipse((x0, y0, x1, y1), fill=(104, 36, 24, 255))


# ---------------------------------------------------------------- brazos y pies
def draw_arm(fig, s, ang, dx=0, dy=0):
    """ang en grados desde la posición colgando (0 = vertical). Positivo = gira en sentido antihorario en pantalla."""
    im = ARMS[s]
    w, h = im.size
    pad = h
    big = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    big.alpha_composite(im, (pad, pad))
    # pivote: parte alta del brazo (hombro), un poco por debajo del borde
    px, py = pad + w / 2, pad + h * ARM_PIVOT
    r = big.rotate(ang, center=(px, py), resample=Image.BICUBIC)
    sx, sy = M(SHOULDER[s][0] + dx, SHOULDER[s][1] + dy)
    fig.alpha_composite(r, (round(sx - px), round(sy - py)))


def draw_foot(fig, s, lift=0.0, ang=0.0, dx=0.0):
    im = FEET[s]
    if ang:
        im = im.rotate(ang, expand=True, resample=Image.BICUBIC)
    x, y = M(FOOT[s][0] + dx, FOOT[s][1] - lift)
    paste_center(fig, im, x, y)


# ---------------------------------------------------------------- figura completa
def figure(pose):
    g = pose.get
    fig = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    # brazos por detrás cuando abrazan no; siempre delante del cuerpo salvo 'arms_behind'
    fl, fr = g('feet', ((0, 0), (0, 0)))
    if g('arms_behind'):
        draw_arm(fig, 'L', g('armL', ARM_REST['L'])); draw_arm(fig, 'R', g('armR', ARM_REST['R']))
    fig.alpha_composite(BODY, BODY_POS)
    if g('blush', 0) > 0:
        b = BLUSH.copy()
        b.putalpha(b.getchannel('A').point(lambda v: int(v * g('blush'))))
        fig.alpha_composite(b)
    for s in 'LR':
        lid = g('lid', 0.0)
        if isinstance(lid, tuple): lid = lid[0 if s == 'L' else 1]
        draw_eye(fig, s, lid=lid, gaze=g('gaze', (0, 0)), iris_k=g('iris', 1.0), closed=g('closed'), sparkle=g('sparkle', False))
    br = g('brows', {})
    draw_brows(fig, **br)
    paste_center(fig, NOSE_IM, *M(NOSE[0], NOSE[1] + g('nose_dy', 0)))
    draw_mouth(fig, **g('mouth', {'kind': 'smile'}))
    draw_foot(fig, 'L', lift=fl[0], ang=fl[1]); draw_foot(fig, 'R', lift=fr[0], ang=fr[1])
    if not g('arms_behind'):
        draw_arm(fig, 'L', g('armL', ARM_REST['L'])); draw_arm(fig, 'R', g('armR', ARM_REST['R']))
    return fig


def place(fig, sx=1, sy=1, rot=0, shear=0, dx=0, dy=0):
    """Deformación de todo el cuerpo con pivote en los pies (estirar/encoger, balanceo, salto)."""
    cx, cy = C / 2 + dx * SS, GROUND + dy * SS
    a = math.radians(rot)
    ca, sa = math.cos(a), math.sin(a)
    m00, m01, m10, m11 = sx, shear * sy, 0, sy
    r00, r01 = ca * m00 - sa * m10, ca * m01 - sa * m11
    r10, r11 = sa * m00 + ca * m10, sa * m01 + ca * m11
    det = r00 * r11 - r01 * r10
    i00, i01, i10, i11 = r11 / det, -r01 / det, -r10 / det, r00 / det
    px, py = C / 2, GROUND
    coeffs = (i00, i01, px - i00 * cx - i01 * cy, i10, i11, py - i10 * cx - i11 * cy)
    return fig.transform((C, C), Image.AFFINE, coeffs, resample=Image.BICUBIC)


# ---------------------------------------------------------------- efectos (los mismos de antes)
_sheet = Image.open('/home/user/towigo/docs/owi/hoja-diseno-owi.webp').convert('RGB')
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'anim2d'))
from cut import cut  # noqa: E402
SPARK = cut(_sheet.crop((900, 458, 968, 536)))
SPARK = SPARK.crop(SPARK.getbbox())


def heart(d, cx, cy, r, color=(240, 104, 98), alpha=1.0):
    pts = []
    for i in range(80):
        t = i / 80 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * r / 16, cy + y * r / 16))
    d.polygon(pts, fill=color + (int(255 * alpha),))
    d.ellipse((cx - r * 0.55, cy - r * 0.55, cx - r * 0.2, cy - r * 0.25), fill=(255, 255, 255, int(150 * alpha)))


def text(canvas, s, cx, cy, size, color, alpha=1.0, rot=0):
    f = ImageFont.truetype(FONT, int(size))
    tmp = Image.new('RGBA', (int(size * 1.6), int(size * 1.6)), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((size * 0.8, size * 0.8), s, font=f, fill=color + (int(255 * alpha),), anchor='mm', stroke_width=max(2, int(size * 0.06)), stroke_fill=(255, 255, 255, int(230 * alpha)))
    if rot: tmp = tmp.rotate(rot, resample=Image.BICUBIC)
    canvas.alpha_composite(tmp, (int(cx - tmp.size[0] / 2), int(cy - tmp.size[1] / 2)))


def drop(d, cx, cy, r, alpha=1.0):
    col = (110, 190, 242, int(255 * alpha))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    d.polygon([(cx - r * 0.85, cy - r * 0.45), (cx + r * 0.85, cy - r * 0.45), (cx, cy - r * 2.1)], fill=col)
    d.ellipse((cx - r * 0.45, cy - r * 0.2, cx - r * 0.1, cy + r * 0.25), fill=(255, 255, 255, int(170 * alpha)))


def sparks(canvas, cx, cy, s, flip=False, alpha=1.0):
    sp = SPARK.resize((max(1, int(SPARK.size[0] * s)), max(1, int(SPARK.size[1] * s))), Image.LANCZOS)
    if flip: sp = sp.transpose(Image.FLIP_LEFT_RIGHT)
    if alpha < 1: sp.putalpha(sp.getchannel('A').point(lambda v: int(v * alpha)))
    canvas.alpha_composite(sp, (int(cx - sp.size[0] / 2), int(cy - sp.size[1] / 2)))


def confetti(d, p, n=14, seed=3):
    rng = np.random.default_rng(seed)
    cols = [(255, 209, 102), (61, 224, 200), (124, 108, 255), (255, 122, 182), (92, 200, 255)]
    for i in range(n):
        x0, sp, ph, rot = rng.uniform(0.1, 0.9), rng.uniform(0.7, 1.2), rng.uniform(0, 1), rng.uniform(0, 6)
        q = (p * sp + ph) % 1
        x = (x0 + 0.04 * math.sin(q * 9 + i)) * C
        y = (0.02 + q * 0.6) * C
        r = 7 * U
        a = rot + q * 12
        pts = [(x + math.cos(a + k * math.pi / 2) * r * (1 if k % 2 else 0.45), y + math.sin(a + k * math.pi / 2) * r * (1 if k % 2 else 0.45)) for k in range(4)]
        d.polygon(pts, fill=cols[i % len(cols)] + (int(255 * min(1, (1 - q) * 3)),))


# ---------------------------------------------------------------- coreografías
def hop(p, n, h):
    return -abs(math.sin(p * math.pi * n)) * h


def land(p, n):
    return 1 - abs(math.sin(p * math.pi * n))


def blink(p, at, dur=0.06):
    """Parpadeo rápido centrado en 'at' (fracción del bucle)."""
    q = abs(((p - at + 0.5) % 1) - 0.5) / dur
    return max(0.0, 1 - q) ** 0.7


def ease(x):
    return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, x)))


def frame(mood, p):
    tau = 2 * math.pi * p
    fx = []
    body = {}
    if mood == 'happy':
        l = land(p, 2) ** 6
        wave = math.sin(tau * 4)
        pose = dict(lid=max(blink(p, 0.72), 0), gaze=(0, -4), brows=dict(raise_=6 + 4 * l), mouth=dict(kind='grin', open_=0.6 + 0.4 * math.sin(tau * 2)),
                    blush=0.7, armR=138 + 22 * wave, armL=ARM_REST['L'] + 6 * math.sin(tau * 2))
        body = dict(sx=1 + 0.05 * l, sy=1 - 0.06 * l, rot=2.5 * math.sin(tau), dy=hop(p, 2, 14))
        fx.append(('sparks', 0.16, 0.22, 1.0 + 0.12 * math.sin(tau * 4), True))
    elif mood == 'attentive':
        # mira a un lado, al otro y a ti; inclina la cabeza con curiosidad
        g = math.sin(tau)
        gx = 26 * g if p < 0.75 else 26 * g * (1 - ease((p - 0.75) / 0.25))
        pose = dict(lid=blink(p, 0.5), gaze=(gx, -6), brows=dict(raise_=12 + 6 * abs(g), arch=1.2), mouth=dict(kind='smile', wide=0.75),
                    armR=ARM_REST['R'] - 4 * g, armL=ARM_REST['L'] - 4 * g)
        body = dict(rot=3 * g, shear=0.04 * g, sy=1 + 0.012 * math.sin(tau * 2))
    elif mood in ('caringHigh', 'caringLow'):
        big = mood == 'caringHigh'
        hug = 0.5 + 0.5 * math.sin(tau * 2)
        pose = dict(lid=0.28 + 0.6 * blink(p, 0.3), gaze=(0, 6), brows=dict(raise_=6, inner=10), mouth=dict(kind='smile', wide=0.8), blush=0.9,
                    armL=62 + 8 * hug, armR=-62 - 8 * hug)
        body = dict(rot=3 * math.sin(tau), sy=1 + 0.02 * math.sin(tau * 2), sx=1 - 0.01 * math.sin(tau * 2))
        fx.append(('hug', 1.0 + 0.08 * hug, big))
        for k in range(2 if big else 1):
            q = (p + k * 0.5) % 1
            fx.append(('heart', 0.76 + 0.04 * math.sin(q * 6), 0.30 - q * 0.22, (16 if big else 12) * (0.7 + 0.3 * q), 1 - q ** 3))
    elif mood in ('worriedHigh', 'worriedLow'):
        a = 2.2 if mood == 'worriedHigh' else 1.3
        dart = 18 * math.copysign(1, math.sin(tau * 2)) if (p * 4) % 1 > 0.2 else 0
        pose = dict(lid=blink(p, 0.6, 0.05), gaze=(dart, 4), iris=0.92, brows=dict(raise_=10, inner=26, arch=0.5), mouth=dict(kind='wavy', open_=p),
                    armL=40 + 3 * math.sin(tau * 8), armR=-40 - 3 * math.sin(tau * 8))
        body = dict(dx=a * math.sin(tau * 8), sy=1 + 0.012 * math.sin(tau * 2))
        fx.append(('drop', 0.76, 0.22 + 0.02 * math.sin(tau * 2), 9))
    elif mood == 'celebrate':
        l = land(p, 3) ** 8
        up = 1 - l
        pose = dict(closed='happy', brows=dict(raise_=14 + 10 * up), mouth=dict(kind='grin', open_=0.5 + 0.5 * up, wide=1.08), blush=0.9,
                    armL=-148 - 18 * math.sin(tau * 3), armR=148 + 18 * math.sin(tau * 3), feet=((10 * up, 8 * up), (10 * up, -8 * up)))
        body = dict(sx=1 + 0.08 * l, sy=1 - 0.1 * l + 0.04 * up, rot=4 * math.sin(tau * 3), dy=hop(p, 3, 34))
        fx.append(('confetti',))
        fx.append(('sparks', 0.15, 0.2, 1.0 + 0.15 * math.sin(tau * 6), True))
        fx.append(('sparks', 0.86, 0.24, 0.9 + 0.15 * math.cos(tau * 6), False))
    elif mood == 'sleep':
        br = math.sin(tau)
        pose = dict(closed='sleep', brows=dict(raise_=-4, arch=0.6), mouth=dict(kind='sleep', open_=0.5 + 0.5 * br), blush=0.5, nose_dy=2 * br,
                    armL=ARM_REST['L'] + 10, armR=ARM_REST['R'] - 10)
        body = dict(sy=0.99 + 0.025 * br, sx=1.0 - 0.01 * br, rot=3 + 2 * br)
        for k in range(3):
            q = (p + k / 3) % 1
            fx.append(('text', 'z', 0.68 + q * 0.14, 0.34 - q * 0.26, 30 + 16 * q, (139, 111, 232), min(1, 4 * q) * (1 - q ** 2), -12))
    elif mood == 'confused':
        s = math.sin(tau)
        pose = dict(lid=(0.0, 0.22 + 0.5 * blink(p, 0.35)), gaze=(16, -16), brows=dict(raise_=6, asym=22, arch=0.8), mouth=dict(kind='side'),
                    armR=168 + 8 * math.sin(tau * 6), armL=ARM_REST['L'])
        body = dict(rot=5 * s, shear=0.03 * s)
        fx.append(('text', '?', 0.82, 0.16 + 0.02 * math.sin(tau * 2), 60, (139, 111, 232), 1, 10 * s))
    elif mood == 'remind':
        l = land(p, 2) ** 6
        pose = dict(lid=blink(p, 0.8), gaze=(0, -8), brows=dict(raise_=16, arch=1.2), mouth=dict(kind='o', open_=0.3 + 0.3 * math.sin(tau * 2)),
                    armR=152 + 8 * math.sin(tau * 4), armL=ARM_REST['L'])
        body = dict(sx=1 + 0.04 * l, sy=1 - 0.05 * l, dy=hop(p, 2, 10), rot=2 * math.sin(tau))
        fx.append(('text', '!', 0.84, 0.15, 62 * (1 + 0.1 * math.sin(tau * 4)), (245, 180, 0), 1, 8))
        fx.append(('sparks', 0.9, 0.32, 0.8, False))
    elif mood == 'sport':
        s = math.sin(tau)  # una zancada por bucle (0,8 s)
        l = land(p, 2) ** 4
        pose = dict(gaze=(10, -2), brows=dict(raise_=-2, inner=-12, arch=0.6), mouth=dict(kind='grin', open_=0.4, wide=0.9),
                    armL=ARM_REST['L'] + 50 * s, armR=ARM_REST['R'] + 50 * s, feet=((max(0, s) * 26, 10 * max(0, s)), (max(0, -s) * 26, -10 * max(0, -s))))
        body = dict(sx=1 + 0.04 * l, sy=1 - 0.06 * l + 0.03 * (1 - l), rot=-3 + 2 * s, dy=hop(p, 2, 12), dx=3 * s)
        fx.append(('drop', 0.24, 0.24 - 0.06 * ((p * 2) % 1), 7, 1 - ((p * 2) % 1)))
    elif mood == 'missYou':
        wv = math.sin(tau * 2)
        pose = dict(lid=0.08 + 0.8 * blink(p, 0.55), gaze=(0, -8), iris=1.12, sparkle=True, brows=dict(raise_=12, inner=22, arch=0.7), mouth=dict(kind='smile', wide=0.65),
                    blush=0.8, armR=128 + 25 * wv, armL=ARM_REST['L'])
        body = dict(rot=4 * math.sin(tau), sy=1 + 0.015 * math.sin(tau * 2))
        fx.append(('heart', 0.80 + 0.03 * math.sin(tau * 3), 0.30 - p * 0.18, 13, 1 - p ** 3))
    img = place(figure(pose), **body)
    d = ImageDraw.Draw(img)
    for e in fx:
        if e[0] == 'sparks': sparks(img, e[1] * C, e[2] * C, e[3] * 0.9 * SS, e[4])
        elif e[0] == 'heart': heart(d, e[1] * C, e[2] * C, e[3] * U, alpha=max(0, e[4]))
        elif e[0] == 'hug':
            r = (26 if e[2] else 18) * U * e[1]
            heart(d, 0.5 * C, 0.765 * C, r)
        elif e[0] == 'drop': drop(d, e[1] * C, e[2] * C, e[3] * U, alpha=e[4] if len(e) > 4 else 1)
        elif e[0] == 'text': text(img, e[1], e[2] * C, e[3] * C, e[4] * U, e[5], max(0, e[6]), e[7])
        elif e[0] == 'confetti': confetti(d, p)
    return img.resize((FS, FS), Image.LANCZOS)


LOOP = {'happy': 2.4, 'attentive': 3.2, 'caringHigh': 3.2, 'worriedHigh': 1.6, 'caringLow': 3.2, 'worriedLow': 1.6,
        'celebrate': 2.4, 'sleep': 4.0, 'confused': 3.2, 'remind': 2.4, 'sport': 0.8, 'missYou': 3.2}
# fotograma "de catálogo" para la pegatina estática (ojos abiertos, pose clara)
STILL = {'happy': 0.1, 'attentive': 0.95, 'caringHigh': 0.12, 'caringLow': 0.12, 'worriedHigh': 0.1, 'worriedLow': 0.1,
         'celebrate': 0.16, 'sleep': 0.0, 'confused': 0.1, 'remind': 0.25, 'sport': 0.25, 'missYou': 0.3}

if __name__ == '__main__':
    OUT = sys.argv[1]
    only = sys.argv[2:] or list(LOOP)
    os.makedirs(f'{OUT}/anim', exist_ok=True)
    meta_p = f'{OUT}/anim/meta.json'
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    for m in only:
        n = round(LOOP[m] * FPS)
        rows = math.ceil(n / COLS)
        sheet = Image.new('RGBA', (FS * COLS, FS * rows), (0, 0, 0, 0))
        for i in range(n):
            sheet.alpha_composite(frame(m, i / n), ((i % COLS) * FS, (i // COLS) * FS))
        sheet.save(f'{OUT}/anim/{m}.webp', 'WEBP', quality=72, method=4)
        meta[m] = {'frames': n, 'cols': COLS, 'fps': FPS}
        frame(m, STILL[m]).resize((256, 256), Image.LANCZOS).save(f'{OUT}/{m}.png', optimize=True)
        print(m, n, os.path.getsize(f'{OUT}/anim/{m}.webp') // 1024, 'KB', flush=True)
    json.dump(meta, open(meta_p, 'w'), indent=1)
