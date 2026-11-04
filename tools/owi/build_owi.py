"""
Genera el modelo 3D provisional de Owi (assets/owi/owi.glb).

Owi se "esculpe" con funciones de distancia con signo (SDF) y uniones suaves, lo que da
formas orgánicas tipo animación sin depender de modelos de terceros (sin problemas de
licencia). Cada parte es una malla con nombre para poder colorearla y personalizarla
en la app: piel, sudadera, pantalón, zapatillas, peinados...

Los brazos se exportan en dos segmentos (brazo y antebrazo) con el origen en la
articulación, para poder animarlos (saludar, celebrar, señalar el reloj...).

El Owi definitivo lo hará un diseñador 3D en glTF respetando estos mismos nombres
de nodos (ver docs/OWI_MODELO.md).

Uso:  python tools/owi/build_owi.py  (requiere numpy, scikit-image, trimesh)
"""
from __future__ import annotations

import os
import numpy as np
import trimesh
from skimage import measure

H = 0.011  # resolución de la rejilla (unidades de escena; Owi mide ~3,4)


# ---------- primitivas SDF ----------
def ellipsoid(p, c, r):
    q = (p - np.array(c)) / np.array(r)
    k0 = np.linalg.norm(q, axis=-1)
    return (k0 - 1.0) * min(r)


def sphere(p, c, r):
    return np.linalg.norm(p - np.array(c), axis=-1) - r


def round_cone(p, a, b, ra, rb):
    a, b = np.array(a, float), np.array(b, float)
    ba = b - a
    pa = p - a
    t = np.clip((pa @ ba) / (ba @ ba), 0, 1)[..., None]
    r = ra + (rb - ra) * t[..., 0]
    return np.linalg.norm(pa - ba * t, axis=-1) - r


def torus_y(p, c, R, r):
    q = p - np.array(c)
    xz = np.sqrt(q[..., 0] ** 2 + q[..., 2] ** 2) - R
    return np.sqrt(xz**2 + q[..., 1] ** 2) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def union(*ds, k=0.0):
    out = ds[0]
    for d in ds[1:]:
        out = smin(out, d, k) if k > 0 else np.minimum(out, d)
    return out


def inter(a, b):
    return np.maximum(a, b)


def sub(a, b):
    return np.maximum(a, -b)


# ---------- anatomía ----------
HEAD_C = (0.0, 2.95, 0.0)
SHOULDER = 0.44
SHOULDER_Y = 2.33


def head_sdf(p):
    cranium = ellipsoid(p, HEAD_C, (0.33, 0.37, 0.355))
    jaw = ellipsoid(p, (0, 2.78, 0.05), (0.265, 0.24, 0.28))
    chin = ellipsoid(p, (0, 2.66, 0.13), (0.13, 0.09, 0.13))
    cheeks = union(ellipsoid(p, (0.15, 2.84, 0.2), (0.12, 0.1, 0.12)), ellipsoid(p, (-0.15, 2.84, 0.2), (0.12, 0.1, 0.12)))
    d = union(cranium, jaw, chin, cheeks, k=0.08)
    nose = ellipsoid(p, (0, 2.87, 0.345), (0.045, 0.07, 0.055))
    d = smin(d, nose, 0.035)
    ears = union(ellipsoid(p, (0.33, 2.9, -0.01), (0.045, 0.085, 0.06)), ellipsoid(p, (-0.33, 2.9, -0.01), (0.045, 0.085, 0.06)))
    d = smin(d, ears, 0.03)
    # cuencas oculares suaves
    for sx in (-1, 1):
        d = -smin(-d, ellipsoid(p, (0.12 * sx, 2.975, 0.355), (0.075, 0.055, 0.05)), 0.03)
    return d


def neck_sdf(p):
    return round_cone(p, (0, 2.45, -0.03), (0, 2.75, -0.02), 0.115, 0.11)


def skin_body_sdf(p):
    return smin(head_sdf(p), neck_sdf(p), 0.06)


def hoodie_sdf(p):
    chest = ellipsoid(p, (0, 2.1, 0.0), (0.42, 0.38, 0.27))
    belly = ellipsoid(p, (0, 1.78, 0.02), (0.39, 0.34, 0.26))
    shoulders = round_cone(p, (-0.36, 2.3, -0.01), (0.36, 2.3, -0.01), 0.15, 0.15)
    d = union(chest, belly, shoulders, k=0.12)
    # bajo de la sudadera recto y redondeado
    d = inter(d, -(p[..., 1] - 1.5) - 0.0)
    # cuello de la capucha y capucha recogida detrás
    collar = torus_y(p, (0, 2.47, -0.04), 0.17, 0.075)
    hood = ellipsoid(p, (0, 2.55, -0.21), (0.25, 0.19, 0.13))
    d = union(d, collar, hood, k=0.06)
    # bolsillo canguro (relieve)
    pocket = ellipsoid(p, (0, 1.7, 0.24), (0.24, 0.13, 0.05))
    d = smin(d, pocket, 0.02)
    return d


def hoodie_detail_sdf(p):
    # cordones de la capucha
    a = round_cone(p, (0.07, 2.42, 0.2), (0.075, 2.18, 0.27), 0.013, 0.013)
    b = round_cone(p, (-0.07, 2.42, 0.2), (-0.075, 2.18, 0.27), 0.013, 0.013)
    tips = union(sphere(p, (0.075, 2.17, 0.27), 0.022), sphere(p, (-0.075, 2.17, 0.27), 0.022))
    return union(a, b, tips)


def pants_sdf(p):
    hips = ellipsoid(p, (0, 1.5, 0.0), (0.36, 0.2, 0.24))
    legs = []
    for sx in (-1, 1):
        x = 0.165 * sx
        legs.append(round_cone(p, (x, 1.45, 0.0), (x, 0.88, 0.02), 0.155, 0.125))
        legs.append(round_cone(p, (x, 0.88, 0.02), (x, 0.24, 0.0), 0.125, 0.105))
    d = union(hips, *legs, k=0.07)
    return inter(d, p[..., 1] - 1.6)  # solo por debajo de la cintura


def shoes_sdf(p):
    out = []
    for sx in (-1, 1):
        x = 0.17 * sx
        upper = ellipsoid(p, (x, 0.13, 0.07), (0.125, 0.12, 0.22))
        ankle = round_cone(p, (x, 0.12, -0.02), (x, 0.3, -0.01), 0.12, 0.115)
        out.append(union(upper, ankle, k=0.05))
    d = union(*out)
    return inter(d, -(p[..., 1] - 0.07))  # por encima de la suela


def soles_sdf(p):
    out = []
    for sx in (-1, 1):
        x = 0.17 * sx
        out.append(ellipsoid(p, (x, 0.07, 0.07), (0.13, 0.07, 0.23)))
    d = union(*out)
    return inter(inter(d, p[..., 1] - 0.09), -p[..., 1])


# ---------- brazos (coordenadas locales: origen en la articulación, cuelgan hacia -y) ----------
def upper_arm_sdf(p):
    return round_cone(p, (0, 0, 0), (0, -0.5, 0.0), 0.125, 0.1)


def forearm_sdf(p):
    sleeve = round_cone(p, (0, 0.02, 0), (0, -0.4, 0.02), 0.1, 0.088)
    cuff = round_cone(p, (0, -0.37, 0.02), (0, -0.44, 0.02), 0.095, 0.092)
    return smin(sleeve, cuff, 0.02)


def hand_sdf(p):
    palm = ellipsoid(p, (0, -0.53, 0.02), (0.07, 0.085, 0.038))
    wrist = round_cone(p, (0, -0.42, 0.02), (0, -0.5, 0.02), 0.05, 0.055)
    fingers = []
    for i, x in enumerate((-0.042, -0.014, 0.014, 0.042)):
        length = (0.1, 0.115, 0.11, 0.09)[i]
        fingers.append(round_cone(p, (x, -0.6, 0.025), (x * 1.1, -0.6 - length, 0.04), 0.019, 0.016))
    thumb = round_cone(p, (0.05, -0.5, 0.04), (0.085, -0.6, 0.075), 0.022, 0.018)
    return union(palm, wrist, *fingers, thumb, k=0.025)


# ---------- peinados ----------
def hair_region(p, front=3.1, back=2.95, side_drop=0.1):
    y, z, x = p[..., 1], p[..., 2], p[..., 0]
    line = 3.02 + (front - 3.02) * np.clip(z / 0.35, 0, 1) + (back - 3.02) * np.clip(-z / 0.35, 0, 1)
    line = line - side_drop * np.clip(np.abs(x) / 0.33, 0, 1) ** 2 * (z < 0.15)
    return line - y  # <0 por encima de la línea del pelo


def hair_corto(p):
    strands = 0.008 * np.sin(p[..., 0] * 60) * np.sin(p[..., 2] * 40)
    shell = smin(head_sdf(p) - 0.05 - strands, ellipsoid(p, (0.07, 3.2, 0.2), (0.24, 0.085, 0.17)), 0.05)
    return inter(shell, hair_region(p, front=3.13, back=2.86))


def hair_rapado(p):
    return inter(head_sdf(p) - 0.014, hair_region(p, front=3.15, back=2.82))


def hair_melena(p):
    cap = inter(head_sdf(p) - 0.055, hair_region(p, front=3.14, back=2.9, side_drop=0.0))
    back = ellipsoid(p, (0, 2.78, -0.13), (0.37, 0.42, 0.28))
    back = inter(back, p[..., 2] - 0.1 + 0.6 * np.clip(2.95 - p[..., 1], 0, 1))
    back = inter(back, -(p[..., 1] - 2.45))
    return smin(cap, back, 0.08)


def hair_rizos(p):
    noise = np.sin(p[..., 0] * 32) * np.sin(p[..., 1] * 32) * np.sin(p[..., 2] * 32)
    shell = smin(head_sdf(p) - 0.075, ellipsoid(p, (0, 3.17, -0.02), (0.36, 0.26, 0.37)), 0.06) - 0.035 * noise
    return inter(shell, hair_region(p, front=3.12, back=2.84))


def hair_mono(p):
    cap = inter(head_sdf(p) - 0.022, hair_region(p, front=3.13, back=2.86))
    bun = sphere(p, (0, 3.26, -0.27), 0.15)
    return smin(cap, bun, 0.05)


# ---------- mallado ----------
def mesh_from_sdf(fn, lo, hi, smooth=3):
    lo, hi = np.array(lo, float), np.array(hi, float)
    n = np.ceil((hi - lo) / H).astype(int) + 1
    xs = [np.linspace(lo[i], lo[i] + (n[i] - 1) * H, n[i]) for i in range(3)]
    g = np.stack(np.meshgrid(*xs, indexing="ij"), axis=-1)
    vol = fn(g)
    verts, faces, _, _ = measure.marching_cubes(vol, level=0.0, spacing=(H, H, H))
    verts += lo
    m = trimesh.Trimesh(verts, faces[:, ::-1], process=True)
    # Quitamos fragmentos sueltos (restos del corte del pelo, etc.).
    parts = [c for c in m.split(only_watertight=False) if len(c.faces) > 300]
    m = trimesh.util.concatenate(parts) if len(parts) > 1 else parts[0]
    if smooth:
        trimesh.smoothing.filter_taubin(m, iterations=smooth * 4)
    # Reducimos polígonos para que cargue rápido en el móvil.
    target = max(400, int(len(m.faces) * 0.3))
    return m.simplify_quadric_decimation(face_count=target)


def main():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out = os.path.join(root, "assets", "owi", "owi.glb")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    scene = trimesh.Scene()

    def add(name, fn, lo, hi, translate=(0, 0, 0), parent=None):
        m = mesh_from_sdf(fn, lo, hi)
        m.visual = trimesh.visual.ColorVisuals(m)
        T = np.eye(4)
        T[:3, 3] = translate
        scene.add_geometry(m, node_name=name, geom_name=name, transform=T, parent_node_name=parent)
        print(f"{name}: {len(m.vertices)} vértices")

    add("skin_head", skin_body_sdf, (-0.42, 2.4, -0.42), (0.42, 3.4, 0.45))
    add("hoodie", hoodie_sdf, (-0.55, 1.4, -0.4), (0.55, 2.65, 0.35))
    add("hoodie_detail", hoodie_detail_sdf, (-0.12, 2.12, 0.15), (0.12, 2.46, 0.32))
    add("pants", pants_sdf, (-0.36, 0.18, -0.28), (0.36, 1.62, 0.28))
    add("shoes", shoes_sdf, (-0.33, 0.05, -0.2), (0.33, 0.4, 0.32))
    add("soles", soles_sdf, (-0.33, -0.02, -0.2), (0.33, 0.12, 0.32))
    for name, fn in [
        ("hair_corto", hair_corto),
        ("hair_rapado", hair_rapado),
        ("hair_melena", hair_melena),
        ("hair_rizos", hair_rizos),
        ("hair_mono", hair_mono),
    ]:
        add(name, fn, (-0.48, 2.25, -0.5), (0.48, 3.45, 0.45))
    # Brazos: el nodo se coloca en la articulación (hombro / codo) para poder rotarlo.
    for side, sx in (("L", -1), ("R", 1)):
        add(f"arm_upper_{side}", upper_arm_sdf, (-0.15, -0.65, -0.15), (0.15, 0.15, 0.15), translate=(SHOULDER * sx, SHOULDER_Y, 0))
        add(f"arm_fore_{side}", forearm_sdf, (-0.13, -0.5, -0.12), (0.13, 0.14, 0.15), translate=(0, -0.5, 0), parent=f"arm_upper_{side}")
        add(f"hand_{side}", hand_sdf, (-0.12, -0.74, -0.06), (0.13, -0.38, 0.13), parent=f"arm_fore_{side}")
    scene.export(out)
    print("Guardado en", out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
