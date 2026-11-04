# Towigo

*Juntos, todo pesa menos.*

App de acompañamiento en diabetes y obesidad (GLP-1). Este repositorio contiene el
**prototipo navegable 0.2** para pacientes con **diabetes tipo 1**, con datos simulados.

## Qué incluye

- **Onboarding conversacional**: Owi se presenta, pregunta el nombre, deja renombrarlo,
  personalizar su aspecto, pide los consentimientos RGPD, conecta el sensor (simulado) y
  presenta al equipo humano.
- **Hoy**: Owi en 3D con sus tres estados (sonríe, preocupación cariñosa con corazón y
  celebración con confeti), glucosa actual con tendencia, gráfica de 24 h, tiempo en rango,
  aviso claro si falla la sincronización y hábitos del día.
- **Registrar**: insulina, comida con foto y cómo me siento, en menos de 10 segundos.
- **Equipo**: chat con texto y mensajes de audio (simulados) con endocrina,
  entrenador-nutricionista y psicóloga. Owi hace de puente.
- **Logros**: racha de hábitos (nunca de glucosa), protector de racha, niveles y accesorios
  de Owi que se desbloquean.
- **Yo**: editar a Owi, tamaño de letra, privacidad y datos.
- **Escenarios de demostración** en la pantalla Hoy: en rango, glucosa alta, glucosa baja,
  objetivo cumplido y fallo del sensor.

## Novedades 0.2

- **Nuevo Owi**: humano en 3D esculpido (`assets/owi/owi.glb`, generado con `tools/owi/build_owi.py`),
  con cara expresiva, brazos articulados y **11 estados**: feliz, atento, cariñoso/preocupado con
  glucosa alta, cariñoso/preocupado con glucosa baja, celebra, duerme, confundido (sin datos),
  avisa y deporte.
- **Avisos en el bocadillo** según *Mi plan*: insulina a su hora, deporte, cambio de sensor,
  comidas y agua. Nunca se calculan a partir de la glucosa; con glucosa baja no se avisa de insulina.
- **Dexcom (API oficial)**: funciones de servidor en `supabase/functions` y botón en *Yo*.
- **iPhone**: versión web instalable (pantalla de inicio) publicada con GitHub Pages.
- Pasos de activación: [`docs/PUESTA_EN_MARCHA.md`](docs/PUESTA_EN_MARCHA.md).
  Encargo para el diseñador 3D: [`docs/OWI_MODELO.md`](docs/OWI_MODELO.md).

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
