"""
Genera el modelo 3D provisional del AVATAR humano del usuario (assets/avatar/avatar.glb).
(Owi, la mascota erizo, se dibuja directamente en la app: src/components/three/Hedgehog.tsx.)

Owi se "esculpe" con funciones de distancia con signo (SDF) y uniones suaves, lo que da
formas orgánicas tipo animación sin depender de modelos de terceros (sin problemas de
licencia). Cada parte es una malla con nombre para poder colorearla y personalizarla
en la app: piel, sudadera, pantalón, zapatillas, peinados...

Los brazos se exportan en dos segmentos (brazo y antebrazo) con el origen en la
articulación, para poder animarlos (saludar, celebrar, señalar el reloj...).

El avatar definitivo lo hará un diseñador 3D en glTF respetando estos mismos nombres
de nodos (ver docs/AVATAR_MODELO.md).

Uso:  python tools/avatar/build_avatar.py  (requiere numpy, scikit-image, trimesh)
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


# ---------- ropa alternativa ----------
def torso_base(p, slim=0.0):
    chest = ellipsoid(p, (0, 2.1, 0.0), (0.41 - slim, 0.38, 0.265 - slim))
    belly = ellipsoid(p, (0, 1.78, 0.02), (0.38 - slim, 0.34, 0.255 - slim))
    shoulders = round_cone(p, (-0.36, 2.3, -0.01), (0.36, 2.3, -0.01), 0.145, 0.145)
    return union(chest, belly, shoulders, k=0.12)


def tshirt_sdf(p):
    d = inter(torso_base(p, 0.01), -(p[..., 1] - 1.45))
    neck = torus_y(p, (0, 2.46, -0.02), 0.135, 0.03)
    d = smin(d, neck, 0.03)
    return sub(d, round_cone(p, (0, 2.4, -0.02), (0, 2.7, -0.02), 0.12, 0.12))


def shirt_sdf(p):
    d = inter(torso_base(p, 0.0), -(p[..., 1] - 1.45))
    collar = union(
        ellipsoid(p, (0.1, 2.45, 0.12), (0.1, 0.055, 0.075)),
        ellipsoid(p, (-0.1, 2.45, 0.12), (0.1, 0.055, 0.075)),
        torus_y(p, (0, 2.48, -0.03), 0.14, 0.035),
    )
    d = smin(d, collar, 0.02)
    return sub(d, round_cone(p, (0, 2.42, -0.02), (0, 2.7, -0.02), 0.115, 0.115))


def shirt_detail_sdf(p):
    return union(*[sphere(p, (0, y, 0.272 + 0.012 * np.cos((y - 2.0) * 3)), 0.019) for y in (2.32, 2.16, 2.0, 1.84, 1.68)])


def upper_short_sdf(p):
    return round_cone(p, (0, 0.0, 0), (0, -0.22, 0.0), 0.138, 0.125)


def upper_skin_sdf(p):
    return round_cone(p, (0, 0, 0), (0, -0.5, 0.0), 0.098, 0.082)


def fore_skin_sdf(p):
    return round_cone(p, (0, 0.02, 0), (0, -0.44, 0.02), 0.08, 0.064)


def shorts_sdf(p):
    hips = ellipsoid(p, (0, 1.5, 0.0), (0.36, 0.2, 0.24))
    legs = [round_cone(p, (0.165 * s, 1.45, 0.0), (0.165 * s, 1.02, 0.015), 0.16, 0.148) for s in (-1, 1)]
    d = union(hips, *legs, k=0.07)
    return inter(inter(d, p[..., 1] - 1.6), 1.0 - p[..., 1])


def skirt_sdf(p):
    y = p[..., 1]
    k = np.clip((1.58 - y) / 0.6, 0, 1)
    rx, rz = 0.33 + 0.16 * k, 0.23 + 0.12 * k
    d = (np.sqrt((p[..., 0] / rx) ** 2 + (p[..., 2] / rz) ** 2) - 1.0) * 0.25
    d = inter(d, y - 1.6)
    return inter(d, 0.98 - y)


def legs_skin_sdf(p):
    hips = ellipsoid(p, (0, 1.5, 0.0), (0.33, 0.18, 0.22))
    legs = []
    for s in (-1, 1):
        x = 0.165 * s
        legs.append(round_cone(p, (x, 1.45, 0.0), (x, 0.88, 0.02), 0.135, 0.105))
        legs.append(round_cone(p, (x, 0.88, 0.02), (x, 0.2, 0.0), 0.1, 0.075))
    return union(hips, *legs, k=0.06)


# ---------- vello facial ----------
def _beard_region(p):
    y, z, x = p[..., 1], p[..., 2], p[..., 0]
    below = y - (2.87 + 0.08 * np.clip(np.abs(x) / 0.3, 0, 1))  # <0 por debajo de la línea de la barba
    front = -0.02 - z
    return np.maximum(below, front)


def _mouth_hole(p):
    return ellipsoid(p, (0, 2.79, 0.33), (0.085, 0.038, 0.12))


def beard_full_sdf(p):
    d = inter(head_sdf(p) - 0.055, _beard_region(p))
    d = smin(d, ellipsoid(p, (0, 2.64, 0.17), (0.17, 0.12, 0.17)), 0.06)
    d = inter(d, p[..., 1] - 2.97)  # solo por debajo de los pómulos
    return sub(d, _mouth_hole(p))


def beard_short_sdf(p):
    return sub(inter(head_sdf(p) - 0.016, _beard_region(p)), _mouth_hole(p))


def moustache_sdf(p):
    a = ellipsoid(p, (0.045, 2.83, 0.335), (0.06, 0.022, 0.035))
    b = ellipsoid(p, (-0.045, 2.83, 0.335), (0.06, 0.022, 0.035))
    return union(a, b, k=0.02)


def goatee_sdf(p):
    chin = inter(head_sdf(p) - 0.035, ellipsoid(p, (0, 2.68, 0.25), (0.1, 0.1, 0.15)))
    return union(chin, moustache_sdf(p), k=0.01)


# ---------- mallado ----------
def mesh_from_sdf(fn, lo, hi, smooth=3, min_faces=300):
    lo, hi = np.array(lo, float), np.array(hi, float)
    n = np.ceil((hi - lo) / H).astype(int) + 1
    xs = [np.linspace(lo[i], lo[i] + (n[i] - 1) * H, n[i]) for i in range(3)]
    g = np.stack(np.meshgrid(*xs, indexing="ij"), axis=-1)
    vol = fn(g)
    verts, faces, _, _ = measure.marching_cubes(vol, level=0.0, spacing=(H, H, H))
    verts += lo
    m = trimesh.Trimesh(verts, faces[:, ::-1], process=True)
    # Quitamos fragmentos sueltos (restos del corte del pelo, etc.).
    parts = [c for c in m.split(only_watertight=False) if len(c.faces) > min_faces]
    m = trimesh.util.concatenate(parts) if len(parts) > 1 else parts[0]
    if smooth:
        trimesh.smoothing.filter_taubin(m, iterations=smooth * 4)
    # Reducimos polígonos para que cargue rápido en el móvil.
    target = max(400, int(len(m.faces) * 0.3))
    return m.simplify_quadric_decimation(face_count=target)


def main():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out = os.path.join(root, "assets", "avatar", "avatar.glb")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    scene = trimesh.Scene()
    base = scene.graph.base_frame

    def joint(name, translate, parent=None):
        T = np.eye(4)
        T[:3, 3] = translate
        scene.graph.update(frame_from=parent or base, frame_to=name, matrix=T)

    def add(name, fn, lo, hi, parent=None, min_faces=300):
        m = mesh_from_sdf(fn, lo, hi, min_faces=min_faces)
        m.visual = trimesh.visual.ColorVisuals(m)
        scene.add_geometry(m, node_name=name, geom_name=name, parent_node_name=parent)
        print(f"{name}: {len(m.vertices)} vértices")

    HEAD_BOX = ((-0.42, 2.4, -0.42), (0.42, 3.4, 0.45))
    TORSO_BOX = ((-0.55, 1.38, -0.4), (0.55, 2.65, 0.36))
    add("skin_head", skin_body_sdf, *HEAD_BOX)
    # Parte de arriba: sudadera, camiseta, camisa
    add("top_hoodie", hoodie_sdf, *TORSO_BOX)
    add("top_hoodie_detail", hoodie_detail_sdf, (-0.12, 2.12, 0.15), (0.12, 2.46, 0.32))
    add("top_tshirt", tshirt_sdf, *TORSO_BOX)
    add("top_shirt", shirt_sdf, *TORSO_BOX)
    add("top_shirt_detail", shirt_detail_sdf, (-0.05, 1.62, 0.2), (0.05, 2.38, 0.33), min_faces=10)
    # Parte de abajo: pantalón largo, corto o falda (+ piernas para corto y falda)
    add("bottom_pants", pants_sdf, (-0.36, 0.18, -0.28), (0.36, 1.62, 0.28))
    add("bottom_shorts", shorts_sdf, (-0.38, 0.95, -0.3), (0.38, 1.62, 0.3))
    add("bottom_skirt", skirt_sdf, (-0.52, 0.95, -0.4), (0.52, 1.62, 0.4))
    add("legs_skin", legs_skin_sdf, (-0.33, 0.1, -0.25), (0.33, 1.62, 0.25))
    add("shoes", shoes_sdf, (-0.33, 0.05, -0.2), (0.33, 0.4, 0.32))
    add("soles", soles_sdf, (-0.33, -0.02, -0.2), (0.33, 0.12, 0.32))
    # Pelo y vello facial (comparten el color de pelo)
    for name, fn in [
        ("hair_corto", hair_corto),
        ("hair_rapado", hair_rapado),
        ("hair_melena", hair_melena),
        ("hair_rizos", hair_rizos),
        ("hair_mono", hair_mono),
    ]:
        add(name, fn, (-0.48, 2.25, -0.5), (0.48, 3.45, 0.45))
    for name, fn in [
        ("beard_barba", beard_full_sdf),
        ("beard_corta", beard_short_sdf),
        ("beard_bigote", moustache_sdf),  # pequeño
        ("beard_perilla", goatee_sdf),
    ]:
        add(name, fn, (-0.42, 2.5, -0.2), (0.42, 3.0, 0.45), min_faces=40)
    # Brazos: nodos vacíos en hombro y codo; debajo, las mallas de manga larga/corta y piel.
    for side, sx in (("L", -1), ("R", 1)):
        up, fo = f"arm_upper_{side}", f"arm_fore_{side}"
        joint(up, (SHOULDER * sx, SHOULDER_Y, 0))
        joint(fo, (0, -0.5, 0), parent=up)
        add(f"sleeve_long_upper_{side}", upper_arm_sdf, (-0.15, -0.65, -0.15), (0.15, 0.15, 0.15), parent=up)
        add(f"sleeve_short_{side}", upper_short_sdf, (-0.16, -0.38, -0.16), (0.16, 0.16, 0.16), parent=up)
        add(f"skin_upper_{side}", upper_skin_sdf, (-0.12, -0.6, -0.12), (0.12, 0.12, 0.12), parent=up)
        add(f"sleeve_long_fore_{side}", forearm_sdf, (-0.13, -0.5, -0.12), (0.13, 0.14, 0.15), parent=fo)
        add(f"skin_fore_{side}", fore_skin_sdf, (-0.11, -0.53, -0.1), (0.11, 0.11, 0.13), parent=fo)
        add(f"hand_{side}", hand_sdf, (-0.12, -0.74, -0.06), (0.13, -0.38, 0.13), parent=fo)
    scene.export(out)
    print("Guardado en", out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
