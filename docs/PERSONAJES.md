# Personajes de Towigo (2D)

Desde la versión 0.5 los personajes son **2D**: más ligeros, sin fallos de 3D y con el mismo
aspecto en web, iPhone y Android.

## Owi (erizo, la mascota)
- 12 ilustraciones del diseño en `assets/owi/<emoción>.png` (fondo transparente, 256 px):
  `happy`, `attentive`, `caringHigh`, `worriedHigh`, `caringLow`, `worriedLow`, `celebrate`,
  `sleep`, `confused`, `remind`, `sport`, `missYou`.
- La app las anima (`src/components/OwiAnimated.tsx`): respira, salta, se balancea, tiembla,
  flota dormido o corre según la emoción, y reacciona al tocarlo.
- Evoluciona con el vínculo: crece un poco y gana insignias (pañuelo, gorro, medalla).
- Para mejorar la calidad: entregar las 12 ilustraciones a 512 px con fondo transparente y
  los mismos nombres. Opcional: animaciones Lottie con esos nombres.
- El modelo 3D original del diseño se conserva en `assets/owi/source/` por si se recupera el 3D.

## Avatar del usuario
- Busto ilustrado en SVG (`src/components/AvatarFace.tsx`): tono de piel, forma de cara,
  color de ojos, cejas, gafas, peinado (incluye sin pelo), color de pelo (incluye canas),
  barba, bigote o perilla, complexión y prenda (sudadera, camiseta, camisa) con color.
- Expresiones: sonrisa, gran sonrisa, tranquilo y dormido. Nunca muestra preocupación por
  los datos (no juzga); eso lo acompaña Owi con cariño.
