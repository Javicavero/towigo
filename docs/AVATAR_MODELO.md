# Encargo de diseño 3D: avatar del usuario y Owi (erizo)

Towigo tiene dos personajes:

1. **Tu avatar**: un humano que se parece al usuario (complexión, altura, cara, ojos, cejas,
   pelo, barba, gafas, ropa). No juzga: solo sonríe, celebra, hace deporte o duerme.
2. **Owi**: la mascota, un **erizo** compañero, común a todos los perfiles (tipo 1, tipo 2,
   GLP-1). Es quien avisa y quien tiene emociones; evoluciona con el vínculo del usuario.

El avatar es **provisional** y se genera por código (`tools/avatar/build_avatar.py` →
`assets/avatar/avatar.glb`).

**Owi ya tiene diseño propio**: modelo 3D `assets/owi/source/erizo_owi_3d.glb` y 12
ilustraciones de referencia (`assets/owi/<emoción>.png`, usadas también como pegatinas 2D en
el chat y el bocadillo). `tools/owi/prepare_owi.py` lo prepara para la app (`assets/owi/owi.glb`):
recupera la mitad izquierda que el archivo original tenía sin enlazar, lo orienta (Y arriba,
mirando a +Z) y separa los brazos para animarlos. Ojos, cejas y boca los dibuja la app según la
emoción, copiando las ilustraciones.
Un diseñador 3D puede sustituirlos sin tocar la lógica si respeta lo siguiente.

## Avatar humano (glTF binario `.glb`)
- Y hacia arriba, ~3,4 unidades de alto, pies en y = 0, mirando a +Z. < 4 MB.
- Sin texturas de color: la app colorea por nombre de malla.

| Nodo / malla | Qué es |
|---|---|
| `skin_head` | cabeza y cuello (piel) |
| `hair_corto`, `hair_rapado`, `hair_melena`, `hair_rizos`, `hair_mono` | peinados |
| `beard_corta`, `beard_barba`, `beard_bigote`, `beard_perilla` | vello facial |
| `top_hoodie` (+`top_hoodie_detail`), `top_tshirt`, `top_shirt` (+`top_shirt_detail`) | parte de arriba |
| `bottom_pants`, `bottom_shorts`, `bottom_skirt`, `legs_skin` | parte de abajo y piernas |
| `shoes`, `soles` | zapatillas |
| `arm_upper_L/R` (vacío, en el hombro) → `sleeve_long_upper_*`, `sleeve_short_*`, `skin_upper_*` | brazo |
| `arm_fore_L/R` (vacío, en el codo) → `sleeve_long_fore_*`, `skin_fore_*`, `hand_*` | antebrazo y mano |

Ojos, párpados, cejas, boca y gafas los dibuja la app (expresiones). Complexión, altura y
forma de cara se aplican escalando.

## Owi (erizo)
- Para una nueva versión del modelo: mismos nombres de piezas (quill_*, face_body, belly, ear, nose, foot, toe, left_arm, right_arm), nombres únicos por lado y sin ojos ni boca fijos.
- Personaje original, blandito y expresivo. Púas marrones suaves, cara y barriga crema,
  ojos grandes, hocico con nariz negra, orejas pequeñas, bracitos y pies.
- 12 emociones: feliz, atento, cariñoso/preocupado (glucosa alta y baja), celebra, duerme
  (gorro de dormir), confundido, avisa (señala con "!"), deporte (cinta), te echaba de menos.
- 4 niveles: Pequeño, Explorador (pañuelo), Compañero (gorro de lana), Leyenda (medalla).
- Nunca regaña. No debe parecerse a mascotas de otras marcas.
