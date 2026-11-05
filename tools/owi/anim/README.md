# Estudio de animación de Owi

Genera las animaciones de Owi tipo GIF (12 emociones, bucles perfectos a 20 fps) a partir del modelo 3D del diseño.
La app no usa 3D en tiempo real: reproduce estas hojas de sprites en 2D (`src/components/OwiSprite.tsx`).

1. `npm install` y `npm run build`.
2. `npm run serve` (en otra terminal).
3. `npm run render`: renderiza con Chromium sin pantalla (Playwright) y escribe `assets/owi/anim/*.webp` y `meta.json`.

La coreografía de cada emoción (saltos, giro de 360°, carrera, respiración, temblor, saludo…) está en `src/Hedgehog.tsx` (`LOOP` y `useFrame`).
