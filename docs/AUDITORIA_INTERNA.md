# Auditoría interna de Towigo

_14 de noviembre de 2026 · versión 1.3 del prototipo (estilos Aurora y Holo)_

Esta auditoría se ha hecho leyendo el código del repositorio y probando la versión web. Cada hallazgo indica dónde está. Lo que no se ha podido comprobar aquí (la app instalada en un móvil, el servidor real) se marca como "sin verificar".

## 1. Resumen

Towigo es hoy una **demostración muy completa**, no un producto que pueda usar un paciente real. Enseña bien la idea: cuatro perfiles, Owi, el panel profesional y el informe. Pero casi todo funciona con datos simulados y hay piezas básicas que faltan.

Los cinco problemas más graves:

1. **La racha y los hábitos no cambian de día.** No hay ningún código que cierre un día y abra el siguiente: la racha no sube ni se rompe nunca de verdad.
2. **En el móvil instalado no se guarda nada.** Los datos solo se guardan en el navegador; en iPhone y Android se perderían al cerrar la app.
3. **No hay avisos reales.** Los recordatorios solo se ven con la app abierta. Sin notificaciones, la función central (no olvidar la inyección) no existe.
4. **No hay cuentas ni servidor en uso.** Paciente y profesional no están conectados; el panel trabaja con 12 pacientes inventados.
5. **El panel profesional puede ser producto sanitario.** Ordena pacientes por prioridad clínica; eso hay que revisarlo con un experto regulatorio antes de usarlo con pacientes.

Lo que está bien y conviene conservar: la separación entre datos y pantallas, los textos centralizados y sin regaños, los límites de la Fase 1 respetados en el chat, el informe PDF y el nuevo sistema de colores.

## 2. Qué es real y qué es simulado

| Área | Estado | Detalle |
|---|---|---|
| Registro (inyección, peso, glucosa, insulina, comida, efectos, fuerza) | Funciona | Se guarda solo en el navegador |
| Racha, hábitos y niveles de Owi | Simulado | La racha parte de un número fijo y no avanza entre días |
| Pasos | Simulado | Siempre 6.240; no lee el móvil |
| Recordatorios | Parcial | Solo dentro de la app; no hay notificaciones |
| Chat con Owi | Parcial | Reglas escritas a mano; la IA está preparada pero sin activar |
| Foto de comida | Simulado | Sin servidor, la estimación sale de la descripción escrita |
| Sensor Dexcom | Preparado | Código escrito, nunca probado contra Dexcom |
| FreeStyle Libre | No existe | Solo aparece como opción en la bienvenida |
| Equipo (mensajes y audios) | Simulado | Nadie recibe los mensajes; los audios no suenan |
| Tu gente (familia) | Simulado | Las invitaciones no llegan a nadie |
| Panel profesional | Simulado | 12 pacientes inventados; los cambios se pierden al recargar |
| Informe PDF | Funciona | En web; en móvil sin verificar |
| Widgets, Dynamic Island, Apple Watch | Preparado | Código escrito; nunca compilado |
| Exportar mis datos (RGPD) | No existe | El botón solo muestra un mensaje |

## 3. Hallazgos críticos (bloquean un piloto con pacientes)

### C1. Los días no avanzan
- **Dónde:** `src/state/store.tsx`. `habitsToday`, `logsToday` y `streakBefore` no se reinician ni se actualizan al cambiar de día.
- **Efecto:** si registras hoy, mañana la app sigue creyendo que ya has cumplido. La racha, los anillos y el nivel de Owi son decorativos.
- **Arreglo:** guardar el historial de hábitos por fecha y calcular la racha a partir de él, con cierre de día y protectores de racha reales.

### C2. Fechas calculadas en hora universal
- **Dónde:** `dayKey` en `store.tsx` y cinco usos más de `toISOString().slice(0, 10)`.
- **Efecto:** en España, entre las 00:00 y la 01:00 o las 02:00 la app cree que sigue siendo el día anterior. Una medicación tomada a las 00:30 se apunta en el día equivocado.
- **Arreglo:** usar siempre la fecha local del usuario.

### C3. Sin guardado en el móvil
- **Dónde:** `src/state/storage.ts` solo usa el almacenamiento del navegador. La librería para móvil está instalada pero no se usa para los datos.
- **Efecto:** en la app instalada, todo se pierde al cerrarla. Sin verificar en un dispositivo, pero el código no deja duda.
- **Arreglo:** guardado en el dispositivo, cifrado, y sincronización con el servidor.

### C4. Sin notificaciones
- **Dónde:** no está instalada ninguna librería de notificaciones; `src/data/reminders.ts` solo calcula avisos con la app abierta.
- **Arreglo:** notificaciones locales programadas (inyección, insulina lenta, medicación, pesaje) y, después, avisos desde el servidor.

### C5. Sin cuentas, sin servidor en uso
- **Dónde:** `src/services/backend.ts` usa una sesión anónima; el servidor solo tiene tablas para Dexcom (`supabase/migrations/0001_dexcom.sql`).
- **Efecto:** no hay registro, ni recuperación de cuenta, ni copia de los datos, ni relación paciente-profesional.
- **Arreglo:** registro con correo o teléfono, tablas para todos los datos con permisos por paciente y por centro, y registro de accesos.

### C6. Riesgo regulatorio del panel profesional
- **Dónde:** `src/pro/cohort.ts` asigna una puntuación de prioridad con señales clínicas (hipoglucemias, tiempo en rango, inyección no registrada) y calcula GMI y variabilidad.
- **Efecto:** un programa que prioriza pacientes con criterios clínicos puede considerarse producto sanitario en Europa, aunque la app del paciente no lo sea. No soy asesor legal: hay que consultarlo.
- **También a revisar:** las frases de Owi ante glucosa muy baja ("si no mejora, llama al 112") y el aviso de cambio de fase de la pauta.

### C7. Datos de salud y privacidad
- Los datos de salud se guardan **sin cifrar** en el navegador.
- El chat y la foto de comida enviarían datos a un proveedor de IA externo: hace falta contrato de encargo, base legal y consentimiento específico.
- "Descargar mis datos" no hace nada; el consentimiento no se registra en ningún servidor.
- "Tu gente" comparte información de salud con terceros sin un consentimiento propio.
- Falta la evaluación de impacto de protección de datos, obligatoria con datos de salud a gran escala.

## 4. Hallazgos altos (calidad y fiabilidad)

| # | Hallazgo | Dónde | Arreglo |
|---|---|---|---|
| A1 | No hay ninguna prueba automática | Todo el repositorio | Pruebas del cálculo de datos (`derive`), del chat y de los avisos; pruebas de pantalla de los flujos principales |
| A2 | No hay revisión automática de estilo de código | Falta la configuración | Añadirla y ejecutarla en cada subida |
| A3 | Las animaciones de Owi pesan 9,4 MB | `assets/owi/anim` | Bajar a 12 fotogramas por segundo y 256 px, o pasar a vídeo o animación vectorial |
| A4 | Cada animación ocupa mucha memoria al abrirse | Hojas de hasta 2.560 × 3.200 px (unos 33 MB en memoria cada una) | Trocear en hojas pequeñas; riesgo de cierres en móviles modestos |
| A5 | Owi redibuja la pantalla 20 veces por segundo | `OwiSprite.tsx` | Animar sin pasar por el estado de la pantalla; pausar cuando Owi no se ve |
| A6 | La navegación es propia y limitada | `src/nav.tsx`, `src/App.tsx` | Usar el sistema de navegación estándar: botón atrás de Android, enlaces a cada pantalla, historial |
| A7 | El archivo de datos mezcla todo | `store.tsx`, 707 líneas | Separar por dominios: tratamiento, glucosa, hábitos, mensajes |
| A8 | El modelo de datos no tiene versiones | `StoreProvider` | Migraciones: hoy un cambio de formato puede romper los datos guardados |
| A9 | 246 colores escritos a mano fuera del tema | `OwiStage`, `WidgetPreview`, `ProApp`, iconos | Llevarlos al tema; los iconos de colores no siguen la paleta nueva |
| A10 | Cambiar de modo claro a oscuro recarga la página | `src/theme.ts` | Tema en vivo, también para la app instalada |
| A11 | El chat entiende por patrones fijos | `src/owi/brain.ts` | Fácil de confundir ("no me he puesto 4 u" se apuntaría). Necesita IA con confirmación y pruebas de seguridad |
| A12 | Owi sale recortado de una imagen de 1.448 px | `tools/owi/anim2d` | Pedir al diseñador las poses en alta resolución o en vectorial; hoy se ve blando en pantallas grandes |

## 5. Experiencia de uso

- **Hoy está muy cargada debajo de Owi.** Tarjeta de ánimos, tipo 1, mantenimiento, check-in, lista y resumen compiten. Falta una jerarquía: una sola cosa importante cada vez.
- **Registrar pide demasiados toques para valores grandes.** Subir la glucosa de 120 a 185 son muchos pulsos; falta teclado numérico.
- **No se puede corregir ni borrar un registro.** Un error al apuntar se queda para siempre, también en el informe.
- **No se puede apuntar en una fecha pasada**, salvo "hace 15, 30 o 60 minutos" en insulina y comida.
- **Progreso mezcla informe, pauta y gráficas.** El informe para la consulta merece un sitio propio.
- **El avatar del usuario** quedó de una etapa anterior y no encaja con el estilo nuevo.
- **La bienvenida no pide la pauta ni los objetivos reales**; todo arranca con datos de ejemplo que parecen del usuario.
- **Accesibilidad:** hay etiquetas para lector de pantalla en casi todos los controles (65 etiquetas), pero no se ha probado con VoiceOver ni TalkBack. Las cifras del modo Holo se han ajustado para cumplir contraste; el aguamarina solo se usa en gráficos.
- **Idiomas:** todos los textos están centralizados (1.074 líneas), pero solo en español. Las fechas y los decimales están fijados a España.

## 6. Owi

- **Lo bueno:** es reconocible, tiene 12 emociones y reacciona a los datos sin regañar.
- **Lo flojo:**
  - Las emociones que no vienen en la hoja de diseño son montajes; se nota el retoque en la cara.
  - Solo hay una pose de cuerpo para siete emociones. Falta gesto: saludar, abrazar, dormir tumbado.
  - Sus frases son fijas. Repite lo mismo cada día y eso cansa pronto.
  - Su evolución (niveles) casi no se ve: solo cambia un poco de tamaño.
- **Qué necesita para ser "muy pro":** un juego de poses dibujadas por el diseñador en vectorial, frases generadas a partir de los datos de cada día, y una evolución visible.

## 7. Panel profesional

- **Lo bueno:** la lista priorizada con motivos, la ficha por perfil y la edición de la pauta son la base correcta.
- **Lo que falta para usarlo:**
  - Acceso con usuario y permisos por centro.
  - Pacientes reales y cambios que se guarden.
  - Registro de quién ve y cambia qué.
  - Agenda, tareas pendientes y avisos al profesional.
  - Comparar periodos y ver varios días de glucosa.
  - Firma y trazabilidad de los cambios de pauta.
  - Conexión con la historia clínica.
- Hoy es una pantalla dentro de la app del paciente (`#pro`). Debe ser una aplicación web aparte, con su propio dominio.

## 8. Comparación con el mercado

| Capacidad | Towigo hoy | Referencia |
|---|---|---|
| Sensor de glucosa en directo | No | Dexcom, Libre, Gluroo |
| Notificaciones y avisos | No | Todas |
| Sincronización con Apple Salud y Health Connect | No | MeAgain, Oura |
| Compañero con personaje | Sí, mejor que la media | MeAgain (Capy) |
| Tres perfiles más tipo 1 en una app | Sí | Casi nadie |
| Panel para el equipo sanitario | Sí, en demo | Glooko, Oviva |
| Informe para la consulta | Sí | mySugr |
| Equipo humano integrado | Solo simulado | Omada, Oviva |

La ventaja real de Towigo es la combinación de Owi, equipo humano y panel profesional. Hoy esa combinación está dibujada pero no conectada.

## 9. Plan propuesto

**Fase 0 · Cimientos (lo primero)**
1. Días reales: historial de hábitos, racha y cierre de día (C1, C2).
2. Guardado en el móvil con versiones del modelo de datos (C3, A8).
3. Notificaciones locales (C4).
4. Pruebas automáticas y revisión de código en cada subida (A1, A2).
5. Editar, borrar y fechar registros.

**Fase 1 · Producto conectado**
6. Cuentas, servidor y sincronización (C5).
7. Panel profesional como web aparte, con acceso y pacientes reales.
8. Mensajería real entre paciente y equipo.
9. Consulta regulatoria y de protección de datos (C6, C7).

**Fase 2 · Diferenciación**
10. Owi nuevo en vectorial, con frases generadas y evolución visible.
11. Sensor en directo (Dexcom y Libre) y Apple Salud.
12. IA real en el chat y en la foto de comida, con pruebas de seguridad.
13. Rediseño de Hoy y Registrar con los estilos Aurora y Holo en todas las pantallas.

**Fase 3 · Publicación**
14. Compilación para iPhone y Android, widgets y reloj.
15. Piloto con un centro y medición de resultados.

## 10. Decisiones que necesito de ti

1. **¿Qué va primero?** Recomiendo la Fase 0: sin ella, todo lo demás se construye sobre datos falsos.
2. **¿Hay diseñador para Owi?** Sin poses nuevas en vectorial, Owi no puede mejorar mucho más.
3. **¿Cuentas de Apple, Google y Supabase?** Hacen falta para las fases 1 y 3.
4. **¿Asesor regulatorio y de protección de datos?** Imprescindible antes de cualquier piloto.
