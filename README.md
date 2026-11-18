# Towigo

*Juntos, todo pesa menos.*

App de acompañamiento para **diabetes tipo 2** y **obesidad con tratamiento GLP-1**. Este
repositorio contiene el **prototipo 0.5** (datos simulados) con tres caminos:

| Perfil | Lo principal en "Hoy" |
|---|---|
| Tipo 2 | Glucosa (glucómetro o sensor), HbA1c, medicación del día, hábitos |
| Obesidad con GLP-1 | Inyección semanal con rotación de zona, peso y composición, efectos secundarios, proteína y agua |
| Tipo 2 + GLP-1 | Todo lo anterior; el peso pasa a un segundo plano |

## Qué incluye
- **Owi**, el erizo compañero, en 2D animado con sus 12 emociones; avisa y evoluciona con tu vínculo.
- **Tu avatar 2D** parecido a ti.
- **Registrar**: inyección (mapa del cuerpo y dosis que te has puesto), peso (con grasa y músculo),
  glucosa (con momento del día), medicación, efectos secundarios, proteína y agua.
- **Logros y progreso**: racha de hábitos, semanas seguidas de inyección, evolución del peso y
  de la grasa, HbA1c y evolución de Owi.
- **Equipo**: chat y audios con endocrina, nutricionista-entrenador y psicóloga.
- **Modo demostración** (en Hoy): cambia de perfil y de escenario (día de inyección, inyección
  olvidada, efectos secundarios, meseta, logro, glucosa alta o baja, noche).

## Límites de la Fase 1 (no es producto sanitario)
- La app **no calcula ni sugiere dosis** (ni de GLP-1 ni de otros fármacos): solo recuerda y apunta
  lo que pautó el médico.
- Ante glucosa baja, Owi acompaña y recuerda seguir el plan del equipo; no da instrucciones.
- Los objetivos (glucosa, peso, proteína) los fija el profesional del paciente.

## Estructura
```
src/state/     Modelo de datos (tipos y almacén) para los tres perfiles
src/data/      Datos de demostración, avisos del plan y opciones del avatar
src/components Owi animado, avatar SVG, tarjetas, gráficas, mapa de inyección, UI base
src/screens/   Bienvenida, Hoy, Registrar, Equipo, Logros, Yo
supabase/      Servidor (Dexcom) para cuando se active
docs/          Puesta en marcha y personajes
```

```bash
npm install
npx expo start --web
./scripts/build-web.sh
```

## Historial

### 1.17 (Towigo en el móvil)
- **Instalable desde el navegador** (Safari → Compartir → Añadir a pantalla de inicio; Chrome → Instalar app): se abre a
  pantalla completa y el fondo de arranque, el color del navegador y la barra de estado siguen el tema elegido.
- **App nativa**: el tema oscuro ya funciona también (`userInterfaceStyle: automatic`); la preferencia se guarda en un
  archivo de la app y se aplica al volver a abrirla. Perfil `preview` de EAS con APK instalable en Android.

### 1.16 (importar también desde el móvil)
- La importación de Dexcom Clarity funciona en **iPhone y Android**: selector de documentos del sistema
  (`expo-document-picker`) y lectura con `expo-file-system` (`src/services/pickFile.ts`); en la web, el selector del
  navegador (`pickFile.web.ts`). En iPhone se pueden elegir archivos de iCloud Drive (`ios.usesIcloudStorage`).
- Al ser módulos nativos, hace falta **una compilación nueva** de la app (`npx eas-cli@latest build --profile development`
  o la de producción). En Expo Go ya vienen incluidos.

### 1.15 (tus datos del sensor y tema sin mezclas)
- **Importar mis datos del sensor** (Yo): carga la exportación CSV de Dexcom Clarity (glucosa, insulina y carbohidratos;
  inglés o español, "," o ";", mg/dL o mmol/L). Se guarda **solo en el dispositivo** (últimos 30 días); opción "verlos
  como si fueran de hoy" (adelanta días enteros y conserva las horas). Ignora nombre, fecha de nacimiento y demás datos
  personales. Parser en `src/data/clarityImport.ts`, con pruebas. Web por ahora; en el móvil llegará con el selector de documentos.
- **Tema claro u oscuro sin mezclas**: botón de sol/luna en Hoy (además de Yo → Apariencia). En claro, Rendimiento y la
  barra lateral del panel profesional también son claros.
- Cabecera de Hoy reorganizada (fecha y botones arriba, saludo debajo).
- `.gitignore`: nunca se suben archivos CSV ni informes de Clarity (el repositorio es público).

### 1.14 (Rendimiento, formato app de recuperación)
- Nuevo diseño de Hoy **Rendimiento** (negro en modo oscuro, blanco en claro): tres diales (**Bienestar** de los check-ins, **Índice Towigo** y
  **Actividad** de 0 a 21 con pasos y fuerza), frase del día y **objetivo de actividad** según tu índice.
- Subventanas: **estadísticas clave** frente a tu media de 30 días (peso, proteína, pasos, ánimo, glucosa y tiempo en
  rango), **diario de hoy** (7 hábitos de sí/no), **qué influye en tu índice** (diferencia media entre días con "sí" y
  con "no"; asociaciones, no causas) y **tendencias** (índice 14 días, actividad 7 días). Lógica en `src/state/journal.ts`.
- Calidad: 25 avisos de revisión menos (de 99 a 74) y `npm run check` (lo mismo que comprueba GitHub).

### 1.13 (Tratamiento al estilo de los registros de dosis)
- Diseño **Tratamiento**: semicírculo del ciclo semanal ("Faltan 5 días" / "Hoy toca inyección") con su botón, y cifras
  de inyecciones, última dosis y semanas seguidas.
- Subventana **Resultados**: rango (1 mes · 3 meses · 6 meses · todo), seis cifras (cambio total, peso, %, por semana,
  al objetivo, semanas de tratamiento) y la gráfica de peso **coloreada por la dosis** de cada tramo, con la línea del objetivo.
- Sin "nivel estimado de fármaco": calcularlo convertiría la app en producto sanitario (ver modelo de negocio, paso 6).

### 1.12 (Hoy más limpio: subventanas)
- A la vista, solo lo esencial; el detalle se abre en **subventanas** que suben desde abajo (`src/components/sheet.tsx`).
- Panel: índice + cifra clave, Owi, lo de "ahora" y una lista corta (Tu semana, Para hoy, Anillos del día, Tu glucosa,
  Resumen) que abre cada detalle. El mensaje de ánimo de tu gente también se abre al tocarlo.
- Los otros 6 diseños siguen la misma regla (calendario de dosis, peso por dosis, plan del día, comidas, todo el día,
  más cifras… en subventanas). El cambio de diseño pasa a un botón en la cabecera.

### 1.11 (7 diseños de la pantalla Hoy)
- Hoy tiene un selector arriba con 7 diseños, y Owi está en todos como asistente: **Panel** (por defecto), **Índice**
  (puntuación del día en grande), **Tratamiento** (próxima dosis, calendario de 12 semanas y peso con cada dosis),
  **Programa** (semana del programa, lección de 3 min y lista del día), **Diario** (proteína que te queda y comidas),
  **Línea** (todo el día por horas con tu gente, tu equipo y el resumen de Owi) y **Resumen** (tarjetas fijadas).
  Inspirados en formatos conocidos de apps de salud, con la identidad y los datos de Towigo (`src/screens/home/layouts.tsx`).
- 8 lecciones cortas de educación general (proteína, náuseas, fuerza, meseta, agua, sueño, saciedad, el después).

### 1.10 (Índice Towigo y check-in al entrar)
- **Índice Towigo (0–100)**: una cifra, como la puntuación de sueño, que resume los últimos 7 días combinando
  tratamiento (20), glucosa (20), peso (15), actividad (15), constancia (10), bienestar (10) y nutrición (10); si de un área
  no hay datos, su peso se reparte. Va en el panel de Hoy (al tocarlo, desglose por áreas y evolución de 14 días),
  en Progreso → Datos y en la ficha del panel profesional. No es una valoración clínica. Cálculo en `src/state/score.ts`.
- **"¿Cómo te encuentras hoy?"** sale como ventana al entrar (una vez al día; "Ahora no" la deja para luego) y las caras
  son **Owi de triste a contento** (`tools/owi/rig2d/scale.py`).
- El sensor de ejemplo se pone al día al abrir la app, y los tiempos largos se muestran como "hace 3 h" o "hace 1 d".

### 1.9 (análisis de datos)
- **Tu semana** (Hoy) y **Progreso → Datos**: indicadores de los últimos 7 días frente a los 7 anteriores, con su tendencia
  (▲/▼ en verde si mejora, en rosa si empeora) y mini gráfica: peso, adherencia GLP-1, tiempo en rango, glucosa media,
  variabilidad (CV), días con registro, ánimo y fuerza. Cálculo puro en `src/state/kpis.ts`, con pruebas.
- **Hoy**: mini gráfica en el panel (glucosa de las últimas 24 h con la franja 70–180, o evolución del peso).
- **Progreso** se abre en "Datos"; la pestaña de Owi pasa a llamarse "Asistente". Owi fijo (sin animación) en la tarjeta del asistente.
- **Panel profesional**: los mismos indicadores semanales en la ficha de cada paciente.
- El sensor de ejemplo guarda 14 días para poder comparar semanas.

### 1.8 (más profesional: los datos mandan)
- **Hoy** es un panel de datos: anillos del día y la cifra clave de cada perfil (próxima inyección, glucosa ahora con
  tendencia, tiempo en rango o peso). Owi pasa a segundo plano como **asistente**, en una tarjeta pequeña con su dato del día.
- Cabeceras de Registrar, Progreso, Equipo y Yo sin el Owi grande; su frase va en una línea discreta.
- Modo presentación con portada de producto (sin Owi protagonista); la galería de Owi solo en el recorrido completo.

### 1.7 (modo presentación)
- **Enseñar la demo**: recorrido guiado que mueve la app solo. En cada paso carga el perfil y la situación de ejemplo
  (GLP-1, tipo 1, efectos secundarios, glucosa baja, logro…), abre la pantalla y muestra qué contar.
- Cuatro recorridos: rápida, completa, pacientes y equipo sanitario. Portada, galería con las 12 emociones de Owi,
  panel profesional y cierre con los siguientes pasos.
- Avance manual o automático; con teclado: ← → para moverse, espacio para pausar y H para ocultar el guion.
- Tus datos se guardan al empezar y vuelven al salir; aguanta recargar la página.
- Se abre desde Yo → "Enseñar la demo", desde la bienvenida o con el enlace terminado en `#demo`:
  https://javicavero.github.io/towigo/#demo

### 1.6 (Owi marioneta 2D con sus piezas)
- Owi se monta **solo con las piezas entregadas** (cuerpo base, brazos, pies, ojos, iris y nariz en `docs/owi/piezas/`), sin 3D.
- En reposo es **idéntico a la imagen de frente**: se usa como base, con las piezas colocadas encima en su sitio exacto.
- Se mueve por partes: parpadea, mira a los lados, pone ojos felices, dormidos o "de cachorro"; cejas y boca cambian con cada
  emoción; saluda, abraza, levanta los brazos, se rasca la cabeza, corre y salta. Herramientas en `tools/owi/rig2d`.

### 1.5 (rediseño completo y Owi más vivo)
- Rediseño Aurora/Holo en todas las pantallas, widgets y panel profesional.
- **Voz de Owi** (`src/owi/voice.ts`): cada día un tema distinto con tus datos (racha, peso, inyección, tiempo en rango, ayunas, proteína, fuerza, ánimo, próximo hito, audios del equipo) y varias formas de decirlo. Al tocarlo, cambia de tema. Nunca da dosis.
- **Evolución visible**: nivel bajo Owi con su progreso, chispas que orbitan según el nivel (aro dorado en el 4) y celebración al evolucionar.
- **Reacciones**: Owi celebra al volver de registrar y con confeti al completar los tres anillos del día.

### 1.4 (Fase 0: cimientos)
- Días reales: la racha y los hábitos se calculan a partir de un historial por fecha, con cierre de día. Fechas en hora local.
- Guardado en iPhone y Android (AsyncStorage) y versiones del modelo de datos con migración automática.
- Avisos en el móvil (inyección, insulina lenta, medicación y pesaje), con texto discreto opcional. Yo → Mi plan y avisos.
- Registrar: historial de últimos registros con borrar, apuntar en "Ayer" o "Anteayer" y escribir la cifra con el teclado.
- Calidad: 14 pruebas automáticas (`npm test`), revisión de código (`npx eslint .`) y comprobación de tipos en cada subida.

### 1.3 (estilos Aurora y Holo, auditoría interna)
- Nuevo sistema visual: **Holo** en claro (perla, violeta y aguamarina) y **Aurora** en oscuro (azul noche, turquesa, violeta y rosa). Titulares en Sora.
- **Auditoría interna** del producto y del código, con plan por fases: `docs/AUDITORIA_INTERNA.md`.

### 1.2 (Owi fiel a su hoja de diseño, solo 2D)
- Owi sale **únicamente de la plantilla oficial** (`docs/owi/hoja-diseno-owi.webp`), sin 3D: poses recortadas de la hoja
  (frontal, 3/4, neutra, expresión cómica, deporte) y emociones compuestas con sus "Rasgos faciales".
- Animación 2D de dibujo animado (estirar y encoger, saltos, balanceo, respiración, temblor) y efectos con las chispas de la
  propia hoja. Herramientas en `tools/owi/anim2d`. Vista previa: `docs/owi-animaciones.gif`.

### 1.1 (Owi protagonista y animado)
- **Owi animado tipo GIF**: 12 emociones con movimientos propios, reproducidas con `OwiSprite`. Bucles perfectos a 20 fps; respeta "Reducir movimiento".
- **Hoy**: escenario a pantalla completa con Owi dentro de los anillos del día, fondo que cambia con su emoción, halo que respira, su frase con tus datos y acciones rápidas. Al tocarlo, salta y gira.
- Owi animado en la cabecera de Registrar, Progreso, Equipo y Yo (te habla y celebra cada registro) y protagonista en la bienvenida.

### 1.0 (profesional y premium)
- **Towigo Pro** (`#pro`): panel del equipo sanitario con pacientes priorizados y motivos, ficha clínica (AGP, tiempo en rangos, GMI, CV, adherencia GLP-1, peso y composición, efectos, ánimo), editor de pauta y objetivos que llega a la app del paciente, bandeja de mensajes con plantillas y audios, y notas de consulta. Ver `docs/PANEL_PROFESIONAL.md`.
- **Diseño premium + tech**: paleta nueva, modo oscuro automático (o elegido en Yo → Apariencia), tipografía más fina, anillos del día, Owi como asistente discreto y tono adulto, sin confeti.

### 0.10 (tipo 1, Owi más listo, Gluroo)
- **Tipo 1** como cuarto camino: sensor con tendencia, el día en una sola gráfica (glucosa + insulina + carbohidratos, al estilo Gluroo), tiempo en rango, registro de insulina rápida/lenta y carbohidratos, aviso de la lenta según el plan. Nunca calcula bolos ni dosis.
- **Chat con Owi**: apunta lo que le escribes ("4 u de rápida hace 15 min", "45 g de carbos", "peso 98,5"), resume cómo vas, explica conceptos y prepara preguntas para la consulta (se añaden al informe PDF). Se niega a dar dosis y remite al 112 en urgencias. Con el servidor activo, las preguntas abiertas van a la IA (`supabase/functions/owi-chat`).
- **Check-in emocional diario** con historial; si hay días duros seguidos, Owi ofrece hablar con la psicóloga.
- **Tu gente** (como el GluCrew de Gluroo): familia o cuidadores con permisos (ver resumen, apuntar por ti, recibir "Necesito ayuda"), invitaciones y ánimos que llegan a través de Owi.
- **Foto de comida**: estimación aproximada y editable de raciones, carbohidratos y proteína (IA en `supabase/functions/food-estimate`; sin servidor, estimación de demostración).
- **Modo mantenimiento después del GLP-1**: zona de ±2 kg, fuerza y proteína.
- **Live Activity** de Owi en la pantalla de bloqueo, la Dynamic Island y el Apple Watch (día de inyección y glucosa en directo en tipo 1), con módulo nativo local `modules/owi-live-activity`.

### 0.9 (benchmark de apps de salud)
- Informe para la consulta en PDF (4, 12 o 26 semanas): inyecciones, pauta, peso y composición, glucosa, HbA1c, medicación, efectos secundarios y hábitos. Solo datos apuntados, sin interpretación.
- Pauta de escalado del médico: fases, semana actual y aviso cuando cambia la fase. Towigo no propone ni calcula dosis.
- Programa de constancia: hitos (1, 3, 6 y 12 meses) y tarjeta "Hablar con mi equipo" en momentos difíciles (inyección olvidada, efectos fuertes, meseta, días sin abrir la app).
- Fuerza y proteína: rutinas de 10 minutos sin material, objetivo semanal del equipo y raciones rápidas de proteína.

### 0.4

- **Owi con su diseño definitivo**: modelo 3D del erizo y sus 12 visualizaciones (feliz, atento,
  cariñoso/preocupado con glucosa alta y baja, celebra, duerme, confundido, avisa, deporte y te
  echaba de menos). Las ilustraciones aparecen también en el chat y en el bocadillo.

### 0.3

- **Owi es ahora un erizo**: la mascota compañera (común a todos los perfiles) que avisa, se
  emociona (12 emociones) y **evoluciona** con tu vínculo: Pequeño → Explorador → Compañero → Leyenda.
- **Tu avatar se parece a ti**: complexión, altura, forma de cara, color de ojos, cejas, pelo
  (con canas), barba o bigote, gafas y ropa (sudadera, camiseta, camisa; pantalón, corto, falda).
- **Interfaz enérgica**: botones con relieve, entradas animadas, contadores, anillo de tiempo en
  rango, confeti, vibración al tocar (en el móvil) y transiciones entre pestañas.
- Galería interna de personajes: añade `?galeria=1` o `?galeria=2` a la dirección.
- Encargo para el diseñador 3D: [`docs/AVATAR_MODELO.md`](docs/AVATAR_MODELO.md).

### 0.2

- **Nuevo Owi** (entonces humano; desde la 0.3 es el avatar del usuario), en 3D esculpido,
  con cara expresiva, brazos articulados y **11 estados**: feliz, atento, cariñoso/preocupado con
  glucosa alta, cariñoso/preocupado con glucosa baja, celebra, duerme, confundido (sin datos),
  avisa y deporte.
- **Avisos en el bocadillo** según *Mi plan*: insulina a su hora, deporte, cambio de sensor,
  comidas y agua. Nunca se calculan a partir de la glucosa; con glucosa baja no se avisa de insulina.
- **Dexcom (API oficial)**: funciones de servidor en `supabase/functions` y botón en *Yo*.
- **iPhone**: versión web instalable (pantalla de inicio) publicada con GitHub Pages.
- Pasos de activación: [`docs/PUESTA_EN_MARCHA.md`](docs/PUESTA_EN_MARCHA.md).

## Límites de la Fase 1 (no es producto sanitario)

Ver `src/config.ts`. Las funciones clínicas automáticas (calculadora de dosis, alertas
clínicas, recomendaciones de IA) están **desactivadas** con *feature flags*. Ante una
hipoglucemia, Owi solo muestra el dato y acompaña; no da indicaciones.

## Estructura

```
src/
  App.tsx              Armazón, fuentes y barra de pestañas
  config.ts            APP_NAME, feature flags y rango por defecto
  theme.ts             Paleta de marca y variantes accesibles (contraste ≥ 4,5:1)
  i18n/                Textos (es). Preparado para en, pt, de, fr
  state/               Estado de la app (tipos, almacén, persistencia)
  data/                Datos simulados y opciones del avatar
  components/          Owi 3D, gráfica, editor del avatar, UI base
  screens/             Onboarding, Hoy, Registrar, Equipo, Logros, Yo
scripts/build-web.sh   Genera la versión web en dist/
```

## Cómo ejecutarlo (para desarrolladores)

```bash
npm install
npx expo start --web     # desarrollo en el navegador
./scripts/build-web.sh   # versión web estática en dist/
```

## Próximos pasos

- Backend con Supabase (región UE): autenticación, datos y almacenamiento de audio/fotos.
- Integración real con sensores (Terra o Thryve) y Apple Health / Health Connect.
- Panel web del profesional con bandeja priorizada por triaje.
- Modelo 3D definitivo de Owi (glTF) y versión nativa iOS/Android.
