# Encargo: modelo 3D definitivo de Owi

El Owi actual (`assets/owi/owi.glb`) es **provisional**: está esculpido por código
(`tools/owi/build_owi.py`) para poder probar la app. El definitivo lo hará un diseñador 3D.
Si respeta este formato, se sustituye el archivo y la app funciona sin tocar código.

## Estilo
- Humano, estilo animación (cercano, cálido, nada infantil). Público: 18-80 años.
- Sudadera con capucha, pantalón y zapatillas. Marca: verde #2BB58A, coral #FF7A59, amarillo #FFD166.
- Debe leerse bien a 250 px de alto en un móvil: cabeza y manos algo grandes, expresiones claras.

## Formato técnico
- glTF binario (`.glb`), Y hacia arriba, mide unas 3,4 unidades, pies en y = 0, mira hacia +Z.
- Menos de 2 MB y 40.000 triángulos en total. Sin texturas de color (los colores se cambian en la app).
- **Nodos con estos nombres exactos** (la app los busca así):

| Nodo | Qué es | Material en la app |
|---|---|---|
| `skin_head` | cabeza y cuello | piel (6 tonos) |
| `hair_corto`, `hair_melena`, `hair_rizos`, `hair_mono`, `hair_rapado` | peinados (uno visible) | pelo (6 colores) |
| `hoodie`, `hoodie_detail` | sudadera, cordones | sudadera (6 colores), blanco |
| `pants` | pantalón | gris oscuro |
| `shoes`, `soles` | zapatillas, suela | zapatillas (5 colores), blanco |
| `arm_upper_L/R` | brazo, con origen en el hombro | sudadera |
| `arm_fore_L/R` | antebrazo, hijo del brazo, origen en el codo | sudadera |
| `hand_L/R` | mano, hija del antebrazo | piel |

- Ojos, cejas y boca los dibuja la app (para las 11 expresiones). Opcionalmente, el diseñador
  puede entregar *blend shapes* faciales y los conectamos.

## Expresiones y posturas que debe soportar
Feliz · atento (mano en la barbilla) · cariñoso con glucosa alta (mano al pecho) ·
preocupado con glucosa muy alta (dos manos al pecho) · cariñoso con glucosa baja (saluda) ·
preocupado con glucosa muy baja · celebra (salta, brazos arriba) · duerme · confundido
(se rasca la cabeza) · avisa (señala su bocadillo) · deporte (corre en el sitio).
