"""
Base de la marioneta = la imagen de frente del usuario (owi-frente.webp) tal cual, sin cara, brazos ni pies,
para que en reposo Owi sea idéntico al dibujo de referencia.

- Cara (cejas, ojos, nariz, boca): se rellena con la piel del cuerpo base (owi-base.webp) deformada fila a fila
  para que su "huevo" coincida con el de la imagen de frente, y con el tono corregido a la piel de alrededor.
- Brazos y pies: dentro del huevo, la misma piel; fuera, púas de la propia imagen de frente giradas alrededor del
  centro (las púas son radiales), para que al levantar un brazo se vean púas detrás.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

from parts import load

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache_base.png')


def _cream(a):
    r, g, b, al = [a[..., i].astype(int) for i in range(4)]
    return ((r - b) < 112) & (g > 135) & (al > 200)


def _extents(mask, rows):
    L, R = {}, {}
    for y in rows:
        xs = np.where(mask[y])[0]
        if len(xs) > 20:
            L[y], R[y] = xs.min(), xs.max()
    return L, R


def _curve(points, y0, y1):
    ys = np.array(sorted(points))
    xs = np.array([points[y] for y in ys], dtype=np.float32)
    out = np.interp(np.arange(y0, y1 + 1), ys, xs)
    return ndimage.gaussian_filter1d(out, 6)


def harmonic(F, mask, levels=5, iters=60):
    """Rellena la zona de la máscara con la piel de alrededor, suave (ecuación de Laplace, multiescala)."""
    rgb = F[..., :3].copy()
    known = ~mask
    pyr = [(rgb, known)]
    for _ in range(levels):
        r, k = pyr[-1]
        h, w = k.shape
        h2, w2 = h // 2, w // 2
        kk = k[:h2 * 2, :w2 * 2].reshape(h2, 2, w2, 2).astype(np.float32)
        rr = (r[:h2 * 2, :w2 * 2] * k[:h2 * 2, :w2 * 2, None]).reshape(h2, 2, w2, 2, 3)
        cnt = kk.sum((1, 3))
        pyr.append((rr.sum((1, 3)) / np.maximum(cnt, 1)[..., None], cnt > 0))
    est = None
    for r, k in reversed(pyr):
        if est is None:
            est = r.copy()
        else:
            up = np.repeat(np.repeat(est, 2, 0), 2, 1)
            pad = np.zeros_like(r); pad[:up.shape[0], :up.shape[1]] = up[:r.shape[0], :r.shape[1]]
            est = np.where(k[..., None], r, pad)
        for _ in range(iters):
            avg = (np.roll(est, 1, 0) + np.roll(est, -1, 0) + np.roll(est, 1, 1) + np.roll(est, -1, 1)) / 4
            est = np.where(k[..., None], r, avg)
    out = F.copy()
    out[..., :3] = est
    out[..., 3] = 255
    return out


def build():
    P = load()
    F = np.asarray(P['front']).astype(np.float32)
    B = np.asarray(P['body']).astype(np.float32)
    H = F.shape[0]

    # --- huevo del cuerpo base (sin cara): extremos por fila
    bm = _cream(B.astype(np.uint8))
    bm = ndimage.binary_opening(bm, iterations=3)
    lab, _ = ndimage.label(bm)
    bm = lab == (np.argmax(ndimage.sum(bm, lab, range(1, lab.max() + 1))) + 1)
    bm = ndimage.binary_fill_holes(bm)
    BT, BB = 330, 1170
    bl, br = _extents(bm, range(BT, BB + 1, 4))
    BL, BR = _curve(bl, BT, BB), _curve(br, BT, BB)

    # --- huevo de la imagen de frente: medido arriba, trazado a mano donde lo tapan brazos y pies
    fm = _cream(F.astype(np.uint8))
    fm = ndimage.binary_opening(fm, iterations=3)
    lab, _ = ndimage.label(fm)
    fm = lab == (np.argmax(ndimage.sum(fm, lab, range(1, lab.max() + 1))) + 1)
    fl, fr = _extents(fm, range(360, 721, 6))
    FT, FB = 320, 1092
    fl.update({FT: 470, 340: 400, 800: 318, 900: 336, 950: 356, 1000: 400, 1050: 478, 1075: 545, 1092: 622})
    fr.update({FT: 775, 340: 845, 800: 930, 900: 908, 950: 894, 1000: 850, 1050: 790, 1075: 700, 1092: 622})
    FL, FR = _curve(fl, FT, FB), _curve(fr, FT, FB)

    # --- piel del base deformada al huevo de la imagen de frente
    E = np.zeros_like(F)
    egg = np.zeros((H, H), bool)
    xs = np.arange(H, dtype=np.float32)
    for y in range(FT, FB + 1):
        xl, xr = FL[y - FT], FR[y - FT]
        if xr - xl < 4:
            continue
        yb = BT + (y - FT) * (BB - BT) / (FB - FT)
        yi = int(min(BB - 1, max(BT, yb)))
        Xl, Xr = BL[yi - BT], BR[yi - BT]
        u = (xs - xl) / (xr - xl)
        inside = (u >= 0) & (u <= 1)
        egg[y, inside] = True
        sx = np.clip(Xl + u * (Xr - Xl), 0, H - 1)
        x0 = np.floor(sx).astype(int)
        t = (sx - x0)[:, None]
        row = B[yi]
        E[y] = row[x0] * (1 - t) + row[np.minimum(x0 + 1, H - 1)] * t
    E[..., 3] = 255

    # --- máscaras de lo que hay que quitar
    rgb = F[..., :3]
    lum = rgb.mean(-1)
    yy, xx = np.mgrid[0:H, 0:H]
    inner = ndimage.binary_erosion(egg, iterations=12)
    dist = np.abs(F[..., :3] - E[..., :3]).sum(-1)
    feat = inner & (yy >= 340) & (yy < 740) & (xx > 355) & (xx < 905) & ((dist > 42) | (lum < 205))
    feat = ndimage.binary_opening(feat, iterations=1)
    feat |= ((xx - 624) / 80) ** 2 + ((yy - 640) / 66) ** 2 <= 1      # nariz con su sombra
    feat = ndimage.binary_dilation(feat, iterations=30)

    def ell(cx, cy, rx, ry):
        return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
    def piece(name, cx, cy, w, h, grow=7):
        im = P[name].resize((round(w), round(h)), Image.LANCZOS)
        m = np.zeros((H, H), bool)
        al = np.asarray(im.getchannel('A')) > 20
        x0, y0 = round(cx - w / 2), round(cy - h / 2)
        m[y0:y0 + al.shape[0], x0:x0 + al.shape[1]] = al
        return ndimage.binary_dilation(m, iterations=grow)
    # misma colocación que rig.py (ARM_C, ARM_SIZE, FOOT, FOOT_SIZE)
    arms = piece('arm', 262, 836, 136, 214) | piece('arm2', 971, 836, 136, 214)
    feet = piece('foot', 450, 1113, 242, 130) | piece('foot2', 772, 1113, 242, 130)
    # lo que no tapa la pieza pero era del brazo/pie en el dibujo (bordes y sombras): crema fuera del huevo, cerca
    near = ndimage.binary_dilation(arms | feet, iterations=10)
    cr = _cream(F.astype(np.uint8))
    arms |= near & cr & ~egg & (yy < 1000)
    feet |= near & cr & ~egg & (yy >= 1000)

    # --- corrección de tono de la piel nueva (campo suave a partir de la piel de alrededor)
    patch = feat | arms | feet
    ring = egg & ~patch & ndimage.binary_dilation(patch, iterations=24) & _cream(F.astype(np.uint8))
    diff = np.zeros_like(F[..., :3])
    for c in range(3):
        num = ndimage.gaussian_filter((F[..., c] - E[..., c]) * ring, 22)
        den = ndimage.gaussian_filter(ring.astype(np.float32), 22) + 1e-4
        diff[..., c] = num / den
    E[..., :3] = np.clip(E[..., :3] + diff, 0, 255)

    # --- púas para detrás de brazos y pies: la propia imagen de frente girada alrededor del centro
    # Púas detrás de brazos y pies: las del cuerpo base donde el base no tiene huevo (coinciden con las de la imagen
    # de frente); el resto, pegado al huevo, se rellena suave con el marrón de alrededor (queda como la sombra de las púas).
    okb = ~ndimage.binary_dilation(bm, iterations=6) & (B[..., 3] > 0)
    K = F.copy()
    K[okb] = B[okb]
    hole = (arms | feet) & ~egg & ~okb & (yy < 1062)
    K[..., :3] = np.where(ndimage.binary_dilation(egg, iterations=3)[..., None] & hole[..., None], K[..., :3], K[..., :3])
    bnd = (arms | feet) & ~okb
    S = harmonic(np.where(egg[..., None], np.array([150, 70, 25, 255], np.float32), K), bnd & ~egg)
    S[..., :3] *= 0.92
    S[..., 3] = 255
    S_feet = np.zeros_like(F)  # bajo el huevo, entre los pies, no hay nada

    out = F.copy()
    soft = lambda m: ndimage.gaussian_filter(m.astype(np.float32), 2.5)[..., None]
    eggf = soft(egg)
    fill_arm = E * eggf + S * (1 - eggf)
    # púas detrás de los pies solo por encima de 1060; debajo, transparente
    low = (np.arange(H) > 1062)[:, None, None]
    fill_feet = E * eggf + np.where(low, S_feet, S) * (1 - eggf)
    H_face = harmonic(F, feat)
    for m, fill in ((feat, H_face), (arms, fill_arm), (feet, fill_feet)):
        k = soft(m)
        # mezcla en espacio premultiplicado
        a0, a1 = out[..., 3:] / 255, fill[..., 3:] / 255
        a = a0 * (1 - k) + a1 * k
        col = (out[..., :3] * a0 * (1 - k) + fill[..., :3] * a1 * k) / np.maximum(a, 1e-4)
        out = np.concatenate([col, a * 255], -1)
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')
    return img


def get():
    if os.path.exists(CACHE):
        return Image.open(CACHE).convert('RGBA')
    img = build()
    img.save(CACHE)
    return img


if __name__ == '__main__':
    import sys
    build().save(sys.argv[1])
