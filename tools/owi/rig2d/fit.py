"""Mide dónde está cada pieza en owi-frente.webp (escala, giro y posición) por comparación de píxeles."""
import json, sys
import numpy as np
from PIL import Image
from parts import load
P = load()
D = 2
F = np.asarray(P['front'].resize((1254 // D, 1254 // D), Image.BOX)).astype(np.float32)

def fit(name, cx0, cy0, w0, rng=0.2, rots=(0,), win=20, flip=False, maskfn=None):
    im = P[name].transpose(Image.FLIP_LEFT_RIGHT) if flip else P[name]
    best = None
    for rot in rots:
        for s in np.linspace(w0 * (1 - rng), w0 * (1 + rng), 15):
            k = s / im.size[0] / D
            sm = im.resize((max(2, round(im.size[0] * k)), max(2, round(im.size[1] * k))), Image.LANCZOS)
            if rot: sm = sm.rotate(rot, expand=True, resample=Image.BICUBIC)
            a = np.asarray(sm).astype(np.float32); al = a[..., 3:] / 255
            if maskfn is not None: al = al * maskfn(a)[..., None]
            al = (al > 0.6) * al
            h, w = a.shape[:2]
            for dy in range(-win, win + 1, 2):
                for dx in range(-win, win + 1, 2):
                    x = round(cx0 / D - w / 2) + dx; y = round(cy0 / D - h / 2) + dy
                    reg = F[y:y + h, x:x + w]
                    if reg.shape[:2] != (h, w): continue
                    e = (((reg[..., :3] - a[..., :3]) ** 2).sum(-1, keepdims=True) * al).sum() / al.sum()
                    if best is None or e < best[0]: best = (e, s, rot, (x + w / 2) * D, (y + h / 2) * D)
    # refinamiento fino
    e, s, rot, cx, cy = best
    print(name, 'flip' if flip else '', 'err %.0f w %.1f rot %d c (%.0f,%.0f)' % best, flush=True)
    return dict(w=float(s), rot=rot, cx=float(cx), cy=float(cy), flip=flip, err=float(e))

dark = lambda a: (a[..., :3].sum(-1) < 300).astype(np.float32)
out = {}
out['eyeL'] = fit('eyeL', 482, 528, 210, maskfn=dark)
out['eyeR'] = fit('eyeR', 773, 530, 210, maskfn=dark)
out['eyeRf'] = fit('eyeL', 773, 530, 210, maskfn=dark, flip=True)
out['nose'] = fit('nose', 624, 628, 112, rng=0.1, win=8)
out['armL'] = fit('arm', 262, 840, 150, rng=0.3, rots=range(-40, 41, 8))
out['armR'] = fit('arm2', 968, 840, 150, rng=0.3, rots=range(-40, 41, 8))
out['footL'] = fit('foot', 440, 1116, 240, rng=0.3)
out['footR'] = fit('foot2', 775, 1116, 240, rng=0.3)
json.dump(out, open(sys.argv[1], 'w'), indent=1)
