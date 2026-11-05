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
