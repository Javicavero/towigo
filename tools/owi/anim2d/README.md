# Owi en 2D a partir de la hoja de diseño

Todo sale **solo de la plantilla oficial** `docs/owi/hoja-diseno-owi.webp` (sin 3D):

1. `cut.py`: recorta las poses (frontal, 3/4, pose neutra, expresión cómica, deporte…) y quita el fondo y la sombra del suelo.
2. `compose.py`: crea las emociones que no tienen pose propia sustituyendo ojos, cejas y boca por los "Rasgos faciales" de la hoja
   (ojos felices, cerrados, sorprendidos; cejas preocupadas y tristes; boca abierta, "o" y triste).
3. `animate.py`: anima cada emoción en 2D (estirar y encoger, saltos, balanceo, inclinación, respiración, temblor) con pivote en los pies
   y añade efectos: chispas amarillas de la propia hoja, corazones, "z", "?", "!" y gota. Genera `assets/owi/anim/*.webp` + `meta.json`.

```bash
mkdir -p var anim
python3 compose.py var
python3 animate.py var ../../../assets/owi/anim
```
Si se entregan las poses en alta resolución (PNG con fondo transparente), basta con cambiar las rutas de `cut.py`.
