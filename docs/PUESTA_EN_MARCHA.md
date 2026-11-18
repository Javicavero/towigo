# Towigo · Puesta en marcha (iPhone + Apple Salud + Dexcom)

Guía paso a paso, sin necesidad de programar. Orden recomendado: 1 → 2 → 3 → 4, y el 6 para tener la app de verdad
en el iPhone conectada a Apple Salud.

---

## 1. Conectar GitHub con Claude

1. Entra en <https://claude.ai/connect-github> y vincula tu cuenta de GitHub.
2. Instala la app de Claude en el repositorio `javicavero/towigo`.
3. Dile a Claude "listo": subirá el código al repositorio.

## 2. Ver Towigo en el iPhone (como una app, sin App Store)

La web de Towigo se publica sola en **GitHub Pages** cada vez que se sube código.

1. En GitHub, abre el repositorio → **Settings → Pages** → en *Source* elige **GitHub Actions**.
   - GitHub Pages es gratis si el repositorio es **público**. Si es privado, necesitas GitHub Pro
     (o te preparo otra opción gratuita, como Cloudflare Pages).
2. Espera unos minutos (pestaña **Actions**, el proceso "Publicar web" debe salir en verde).
3. En el iPhone, abre **Safari** y entra en `https://javicavero.github.io/towigo/`.
4. Pulsa **Compartir → Añadir a pantalla de inicio**. Se abrirá a pantalla completa, como una app.

> La versión web **no puede leer Apple Salud** (Apple solo lo permite a apps instaladas). Para eso está la app
> nativa del paso 6.

## 3. Crear el servidor (Supabase, en Europa)

1. Crea una cuenta en <https://supabase.com> y un proyecto nuevo.
   - **Región: Central EU (Frankfurt)** o West EU (Ireland). Guarda la contraseña de la base de datos.
2. Menú **SQL Editor** → pega el contenido de `supabase/migrations/0001_dexcom.sql` → **Run**.
3. Menú **Authentication → Sign In / Providers** → activa **Allow anonymous sign-ins**
   (el prototipo usa una cuenta anónima; después añadiremos registro con email).
4. Menú **Edge Functions → Deploy a new function → Via Editor**. Crea estas tres funciones,
   pegando el código de cada carpeta (y el de `supabase/functions/_shared/dexcom.ts` como
   archivo `_shared/dexcom.ts` dentro de cada una):
   - `dexcom-auth-start`
   - `dexcom-callback` → en sus ajustes, **desactiva "Enforce JWT verification"** (Dexcom la llama sin sesión).
   - `dexcom-egvs`
   - (Alternativa más cómoda: cuando el repositorio esté conectado, Claude puede preparar un
     despliegue automático desde GitHub con un token de Supabase.)
5. Menú **Project Settings → API**: copia la **Project URL** y la **anon public key**.
6. En GitHub → repositorio → **Settings → Secrets and variables → Actions → Variables**, crea:
   - `SUPABASE_URL` = la Project URL
   - `SUPABASE_ANON_KEY` = la anon public key

## 4. Conectar tu Dexcom (API oficial)

1. Entra en <https://developer.dexcom.com>, crea una cuenta de desarrollador y una **app**.
2. En **Redirect URI** pon: `https://TU-PROYECTO.supabase.co/functions/v1/dexcom-callback`
   (cambia `TU-PROYECTO` por el identificador de tu proyecto de Supabase).
3. Copia el **Client ID** y el **Client Secret**.
4. En Supabase → **Edge Functions → Secrets**, añade:
   - `DEXCOM_CLIENT_ID` = el Client ID
   - `DEXCOM_CLIENT_SECRET` = el Client Secret
   - `DEXCOM_BASE_URL` = `https://sandbox-api.dexcom.com` para empezar con datos de prueba
   - `APP_URLS` = `https://javicavero.github.io/towigo/,towigo://dexcom`
     (la segunda es para volver a la app nativa del iPhone después de dar permiso).
5. Abre Towigo en el iPhone → **Yo → Conectar mi Dexcom**. En la pantalla de Dexcom (modo
   prueba) elige un usuario de ejemplo; volverás a Towigo con sus datos.

### Para ver TUS datos reales

- Con la app recién creada solo hay **datos de prueba** (sandbox). Para tus datos reales, en el portal de
  desarrolladores de Dexcom → tu app → **Apply for Upgrade → Individual → Limited Access** (hasta 5 usuarios;
  Dexcom tiene que aprobarlo). Cuando lo aprueben, cambia `DEXCOM_BASE_URL` a `https://api.dexcom.eu` (cuentas de
  Europa) y vuelve a conectar desde **Yo → Conectar mi Dexcom**.
- La primera vez Towigo descarga **14 días**; después solo lo nuevo, que se va guardando en el móvil (hasta 30 días).
- La API oficial **no es en tiempo real**: los datos llegan con retraso. Para las alarmas, el sensor y su app
  oficial siguen mandando.
- Clarity no tiene conexión propia: lo que ves en Clarity sale de la misma nube de Dexcom, así que conectar Dexcom
  es conectar Clarity. Para ver meses anteriores, **Yo → Importar mis datos del sensor** con la exportación CSV de
  Clarity.
- Si cambias el código de las funciones (por ejemplo, `dexcom-egvs`), vuelve a desplegarlas.

## 5. Activar la IA de Owi (chat y foto de comida)

1. Crea una clave en https://console.anthropic.com (API Keys).
2. En Supabase → Edge Functions → Secrets, añade `ANTHROPIC_API_KEY` con esa clave.
3. Despliega las funciones `owi-chat` y `food-estimate` (igual que las de Dexcom).
4. Sin la clave, Owi sigue funcionando con su "cerebro" local (registros, resúmenes y preguntas), y la foto de comida usa una estimación de demostración.

Reglas fijas de la IA (Fase 1): nunca da dosis ni interpreta síntomas, ante urgencias remite al 112 y solo recibe datos agregados (sin nombre ni identificadores).

## 6. App nativa en el iPhone (Apple Salud)

Es la app de verdad, instalada en tu iPhone: lee de **Apple Salud** tus pasos, peso (y grasa/masa magra si tu báscula
los guarda), sueño, glucosa, insulina, carbohidratos y proteína. No escribe nada en Salud.

**Qué necesitas**
- Cuenta de **desarrollador de Apple** (99 €/año): <https://developer.apple.com/programs/> (Apple tarda de horas a
  un par de días en activarla).
- Cuenta gratuita de **Expo**: <https://expo.dev/signup>.
- Un ordenador con Node.js (o pídeselo a Claude en una sesión con el repositorio).

**Pasos (una sola vez)**
1. Enlaza el proyecto con tu cuenta de Expo:
   ```bash
   npx eas-cli@latest login
   ```
   ```bash
   npx eas-cli@latest init
   ```
2. En <https://expo.dev> → proyecto Towigo → **Environment variables**, crea para los entornos *preview* y
   *production* (visibilidad "Plain text"; son públicas por diseño):
   - `EXPO_PUBLIC_SUPABASE_URL` = la Project URL de Supabase
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = la anon public key
   (sin ellas la app funciona, pero sin Dexcom ni la IA de Owi).
3. Registra tu iPhone (te da un enlace o QR para abrir en el iPhone e instalar un perfil):
   ```bash
   npx eas-cli@latest device:create
   ```
4. Crea la app (tarda unos 15–25 minutos en la nube de Expo; te pedirá entrar con tu Apple ID y lo configura todo,
   incluido el permiso de HealthKit):
   ```bash
   npx eas-cli@latest build --profile preview --platform ios
   ```
5. Al terminar, abre en el iPhone el enlace o el QR que aparece y pulsa **Instalar**. En el iPhone, activa
   **Ajustes → Privacidad y seguridad → Modo desarrollador** si te lo pide.

> Alternativa: **TestFlight** (sin registrar dispositivos y para compartir con otras personas):
> `npx eas-cli@latest build --profile production --platform ios --auto-submit`.

**Conectar Apple Salud**
1. Abre Towigo → **Yo → Apple Salud → Conectar con Apple Salud**.
2. iOS te pregunta qué datos compartir: activa los que quieras (puedes cambiarlo cuando quieras en
   **Ajustes → Salud → Acceso a datos y dispositivos → Towigo**).
3. Towigo se sincroniza al abrirse y cada vez que vuelves a ella (como mucho cada 5 minutos).

**Glucosa: Apple Salud o Dexcom**
- La app de Dexcom escribe la glucosa en Apple Salud con **3 horas de retraso** (lo decide Dexcom). Towigo lo indica
  en Hoy ("Última glucosa · hace 3 h").
- Si conectas **Dexcom** (paso 4), su glucosa manda sobre la de Salud; los pasos, el peso y el sueño siguen
  llegando de Salud.

**Android**: la conexión con Health Connect llegará más adelante; el perfil `preview` crea un APK instalable
(`npx eas-cli@latest build --profile preview --platform android`) con todo lo demás.

## Seguridad y RGPD

- La contraseña de Dexcom nunca pasa por Towigo: el permiso se da en la web de Dexcom.
- Los tokens de Dexcom solo los lee el servidor (tablas protegidas, sin acceso desde la app).
- Cada conexión, lectura y desconexión queda en `audit_log`.
- Desde **Yo → Desconectar Dexcom** se borran los tokens del servidor.
- Lo que se lee de Apple Salud se queda **en el móvil** (no se sube a ningún servidor). Desde **Yo → Apple Salud →
  Desconectar** Towigo deja de leerlo y vuelve a los datos de ejemplo.
