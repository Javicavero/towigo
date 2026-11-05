"""
Prepara el modelo de Owi (erizo) para la app a partir del original del diseño
(assets/owi/source/erizo_owi_3d.glb) y genera assets/owi/owi.glb.

- El original tiene la mitad izquierda "huérfana" (ojo, oreja, pie... existen como mallas
  pero ningún nodo las usa, por nombres repetidos al exportar). Aquí se recuperan todas.
- Gira de Z-arriba a Y-arriba (la app mira hacia +Z) y deja los pies en y = 0.
- Agrupa: cuerpo, púas (una sola malla), cara, barriga, orejas, nariz, pies y brazos.
- Los ojos, cejas, boca, lengua y rubor del original NO se exportan: la app los dibuja
  según la emoción (12 visualizaciones de docs/owi).
- Los brazos se exportan con el origen en el hombro para poder animarlos.

Uso: python tools/owi/prepare_owi.py   (requiere numpy y trimesh)
"""
import json
import os
import struct

import numpy as np
import trimesh

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "owi", "source", "erizo_owi_3d.glb")
OUT = os.path.join(ROOT, "assets", "owi", "owi.glb")
SCALE = 0.62  # ~1,45 unidades de alto con púas, como el Owi anterior

COMP = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NCOMP = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}


def read_glb(path):
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20 : 20 + jl])
    o = 20 + jl
    bl = struct.unpack("<I", b[o : o + 4])[0]
    return j, b[o + 8 : o + 8 + bl]


def accessor(j, binc, i):
    a = j["accessors"][i]
    bv = j["bufferViews"][a["bufferView"]]
    dt = COMP[a["componentType"]]
    n = NCOMP[a["type"]]
    start = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    arr = np.frombuffer(binc, dtype=dt, count=a["count"] * n, offset=start)
    return arr.reshape(-1, n) if n > 1 else arr


def mesh(j, binc, i):
    p = j["meshes"][i]["primitives"][0]
    v = accessor(j, binc, p["attributes"]["POSITION"]).astype(np.float64)
    f = accessor(j, binc, p["indices"]).reshape(-1, 3)
    # Z-arriba -> Y-arriba, frente (-Y) -> +Z
    v = np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1) * SCALE
    return trimesh.Trimesh(v, f, process=False)


def main():
    j, binc = read_glb(SRC)
    used = {n["mesh"]: n["name"] for n in j["nodes"] if "mesh" in n}

    def bounds_x(i):
        m = mesh(j, binc, i)
        return m.bounds[:, 0].mean()

    groups = {k: [] for k in ["body", "quills", "face", "belly", "ear_L", "ear_R", "earInner_L", "earInner_R", "nose", "foot_L", "foot_R", "arm_L", "arm_R"]}
    for i, m in enumerate(j["meshes"]):
        shape = m.get("extras", {}).get("shape")
        name = used.get(i)
        if i == 0:
            groups["body"].append(i)
        elif i == 1:
            groups["face"].append(i)
        elif i == 2:
            groups["belly"].append(i)
        elif shape == "cone":
            groups["quills"].append(i)
        elif i in (99, 101):
            groups["ear_L" if bounds_x(i) < 0 else "ear_R"].append(i)
        elif i in (100, 102):
            groups["earInner_L" if bounds_x(i) < 0 else "earInner_R"].append(i)
        elif i == 115:
            groups["nose"].append(i)
        elif 118 <= i <= 125:
            groups["foot_L" if bounds_x(i) < 0 else "foot_R"].append(i)
        elif i == 126:
            groups["arm_L"].append(i)
        elif i == 127:
            groups["arm_R"].append(i)
        # 103-114, 116, 117: ojos, cejas, rubor, boca, lengua -> los dibuja la app

    lowest = min(mesh(j, binc, i).bounds[0, 1] for i in groups["foot_L"] + groups["foot_R"] + groups["body"])
    scene = trimesh.Scene()
    for name, ids in groups.items():
        parts = [mesh(j, binc, i) for i in ids]
        m = trimesh.util.concatenate(parts)
        m.apply_translation([0, -lowest, 0])
        T = np.eye(4)
        if name.startswith("arm_"):
            # Origen en el hombro: punto más alto y más interior del brazo.
            b = m.bounds
            sx = -1 if name.endswith("L") else 1
            pivot = np.array([b[0, 0] if sx < 0 else b[1, 0], b[1, 1], (b[0, 2] + b[1, 2]) / 2])
            pivot[0] = pivot[0] * 0.75 + (b[1, 0] if sx < 0 else b[0, 0]) * 0.25
            m.apply_translation(-pivot)
            T[:3, 3] = pivot
        m.visual = trimesh.visual.ColorVisuals(m)
        scene.add_geometry(m, node_name=name, geom_name=name, transform=T)
        print(f"{name}: {len(ids)} piezas, {len(m.faces)} caras")
    scene.export(OUT)
    print("Guardado en", OUT, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
