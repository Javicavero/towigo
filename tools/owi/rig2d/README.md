# Owi como marioneta 2D (piezas del usuario)

Owi se anima **solo con las piezas entregadas** en `docs/owi/piezas/` (sin 3D):
cuerpo base sin cara (`owi-base.webp`), brazos, pies, ojos, iris y nariz (`piezas.webp`).
`owi-frente.webp` y `owi-vistas.webp` son la referencia de proporciones.

- `parts.py`: recorta cada pieza y limpia la neblina del fondo transparente.
- `base.py`: la base es **la propia imagen de frente** (`owi-frente.webp`) sin cara, brazos ni pies, para que en reposo
  Owi sea idéntico al dibujo. La cara se rellena con la piel de alrededor; detrás de brazos y pies, la piel del cuerpo
  base deformada al huevo de la imagen de frente y las púas del cuerpo base.
- `fit.py`: mide dónde está cada pieza en la imagen de frente (las cejas y la sonrisa se recortan de ella).
- `rig.py`: monta a Owi y lo mueve por partes, a 20 fps:
  - ojos: parpadeo con la piel del propio cuerpo, mirada (el iris se mueve dentro del ojo), ojos felices `^ ^`,
    ojos dormidos, "ojos de cachorro" (pupilas grandes y brillo extra);
  - cejas y boca en el marrón del personaje (sonrisa, risa con lengua, "o", triste, temblorosa, torcida);
  - brazos con pivote en el hombro (saludar, abrazar, levantar los dos, rascarse la cabeza, correr);
  - pies que pisan y saltan; todo el cuerpo se estira y encoge, salta y se balancea con pivote en los pies;
  - efectos: chispas de la hoja de diseño, confeti, corazones, "z", "?", "!", gotas.
- `preview.py`: hoja de contacto con un fotograma por emoción. `gif.py`: `docs/owi-animaciones.gif`.

```bash
cd tools/owi/rig2d
python3 rig.py ../../../assets/owi          # 12 emociones: assets/owi/anim/*.webp + meta.json y pegatinas assets/owi/*.png
python3 rig.py ../../../assets/owi happy    # solo una
python3 gif.py ../../../docs/owi-animaciones.gif
```
Necesita Python 3 con Pillow, NumPy (y SciPy solo para medir piezas nuevas).
Para retocar la colocación de una pieza, cambia las constantes del principio de `rig.py` (EYE, EYE_SIZE, IRIS_SIZE, ARM_C, FOOT…) y las mismas en `base.py`.
