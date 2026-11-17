"""Escala de ánimo con la cara de Owi (1 = muy mal … 5 = muy bien), para el check-in diario.
    python3 scale.py ../../../assets/owi/scale
"""
import os, sys
from PIL import Image
from PIL import ImageDraw
from rig import EYE, K, figure, M

POSES = {
    1: dict(lid=0.12, gaze=(0, 22), sparkle=True, iris=1.06, brows=dict(raise_=18, inner=90, arch=0.5), mouth=dict(kind='sad', wide=1.2, dy=8)),
    2: dict(lid=0.08, gaze=(0, 12), brows=dict(raise_=10, inner=45, arch=0.6), mouth=dict(kind='sad', wide=0.7)),
    3: dict(lid=0.12, gaze=(0, 4), brows=dict(raise_=0, arch=0.8), mouth=dict(kind='side', wide=0.8)),
    4: dict(gaze=(0, -2), brows=dict(raise_=6), mouth=dict(kind='smile'), blush=0.45),
    5: dict(closed='happy', brows=dict(raise_=14), mouth=dict(kind='grin', open_=0.8, wide=1.05), blush=0.85),
}

if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    x0, y0 = M(262, 262)
    x1, y1 = M(994, 994)
    for v, pose in POSES.items():
        f = figure(pose)
        if v == 1:  # una lágrima bajo el ojo izquierdo
            d = ImageDraw.Draw(f)
            cx, cy = M(EYE['L'][0] - 40, EYE['L'][1] + 120)
            r = 15 * K
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(110, 190, 242, 255))
            d.polygon([(cx - r * 0.86, cy - r * 0.5), (cx + r * 0.86, cy - r * 0.5), (cx, cy - r * 2.3)], fill=(110, 190, 242, 255))
            d.ellipse((cx - r * 0.45, cy - r * 0.2, cx - r * 0.05, cy + r * 0.25), fill=(255, 255, 255, 190))
        f = f.crop((round(x0), round(y0), round(x1), round(y1)))
        f.resize((192, 192), Image.LANCZOS).save(f'{out}/v{v}.png', optimize=True)
        print(v)
