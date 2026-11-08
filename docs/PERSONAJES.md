# Personajes de Towigo (2D)

Desde la versión 0.5 los personajes son **2D**: más ligeros, sin fallos de 3D y con el mismo
aspecto en web, iPhone y Android.

## Owi (erizo, la mascota)
- **Hoja de diseño oficial**: `docs/owi/hoja-diseno-owi.webp` (vistas, poses, paleta, proporciones 1:1 y rasgos faciales).
  - Paleta: crema `#FEDDB9` (cara, barriga, manos y pies), marrón medio `#D0783B` (púas en forma de hoja),
    marrón oscuro `#753315` (cejas, nariz y detalles), blanco (brillos) y negro (pupilas).
  - Púas estilizadas en forma de hoja, ordenadas, que forman una melena alrededor de la cara.
  - Ojos grandes marrones con dos brillos, cejas gruesas, cinta deportiva naranja solo en deporte.
- **Solo 2D y solo con la plantilla**: las poses y los rasgos se recortan directamente de la hoja de diseño (sin 3D).
- **Animaciones** (12 emociones, bucles tipo GIF a 20 fps): `tools/owi/anim2d` las genera con transformaciones de dibujo
  animado y efectos, y la app las reproduce con `src/components/OwiSprite.tsx`.
  - Contento (frente, boca abierta, bota) · Atento (vista 3/4) · Cariñoso (ojos felices y corazón) · Preocupado (cejas
    preocupadas, tiembla, gota) · Celebra (expresión cómica, saltos) · Duerme (ojos cerrados, respira, "z") · Confundido
    (ojos sorprendidos, "?") · Avisa (pose neutra, "!") · Deporte (pose con cinta, corre) · Te echa de menos (cejas tristes).
- **Ilustraciones fijas** (`assets/owi/<emoción>.png`, 256 px) para el chat, los widgets y las miniaturas: primer
  fotograma de cada animación.
- Evoluciona con el vínculo: crece un poco con el nivel.

## Avatar del usuario
- Busto ilustrado en SVG (`src/components/AvatarFace.tsx`): tono de piel, forma de cara,
  color de ojos, cejas, gafas, peinado (incluye sin pelo), color de pelo (incluye canas),
  barba, bigote o perilla, complexión y prenda (sudadera, camiseta, camisa) con color.
- Expresiones: sonrisa, gran sonrisa, tranquilo y dormido. Nunca muestra preocupación por
  los datos (no juzga); eso lo acompaña Owi con cariño.
