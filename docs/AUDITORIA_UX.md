# Auditoría interna de experiencia (UX) · versión 0.6 → 0.7

Objetivo: que la app sea **más clara y menos agrupada**, con estilo clínico (tipo Apple Salud).

## Hallazgos
1. **"Hoy" sobrecargada**: hasta 9 tarjetas apiladas, todas con el mismo peso visual.
   Cada una tenía gráfica, etiquetas, nota explicativa y botón propio.
2. **Sin jerarquía**: no se distinguía lo que hay que *hacer* hoy de lo que solo se *consulta*.
3. **Información repetida**: vínculo con Owi, hábitos y notas aparecían en varias pantallas.
4. **Demasiado texto de ayuda** bajo cada bloque (fatiga de lectura, sobre todo en mayores de 60).
5. **Controles de demostración mezclados** con los datos del paciente.
6. **"Logros" muy largo**: hábitos, salud y Owi en una sola columna interminable.
7. **"Yo" como formulario gigante**: editor del avatar, plan, letra y privacidad abiertos a la vez.

## Cambios aplicados
| Pantalla | Antes | Ahora |
|---|---|---|
| Hoy | 9 tarjetas con gráficas | Owi + **Para hoy** (lista de tareas con casilla) + **Resumen** (4 datos clave) |
| Progreso (antes Logros) | Una columna larga | Pestañas **Hábitos · Salud · Owi**; las gráficas viven en Salud |
| Yo | Todo abierto | Ajustes **desplegables** agrupados (Personal · Tratamiento · App) |
| Demostración | En la cabecera de Hoy | Sección propia en Yo |
| Textos | Nota bajo cada bloque | Una línea cuando aporta; avisos de seguridad intactos |

## Principios para pantallas futuras
- Una pantalla, una pregunta: "¿qué hago hoy?" (Hoy), "¿cómo voy?" (Progreso), "¿cómo lo configuro?" (Yo).
- Acciones en listas; datos en tiles; detalle y gráficas en Progreso.
- Máximo un botón principal visible por bloque.
- Los avisos de seguridad (dosis, hipoglucemia, 112) nunca se esconden.
