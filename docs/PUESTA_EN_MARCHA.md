# Towigo · Puesta en marcha (iPhone + Dexcom)

Guía paso a paso, sin necesidad de programar. Orden recomendado: 1 → 2 → 3 → 4.

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

> Más adelante, para la app nativa en el iPhone (TestFlight) hace falta una cuenta de
> desarrollador de Apple (99 €/año) y una cuenta gratuita de Expo. El proyecto ya lleva
> `eas.json` preparado.

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
   - `APP_URLS` = `https://javicavero.github.io/towigo/`
5. Abre Towigo en el iPhone → **Yo → Conectar mi Dexcom**. En la pantalla de Dexcom (modo
   prueba) elige un usuario de ejemplo; volverás a Towigo con sus datos.

### Para ver TUS datos reales

- Dexcom solo da acceso a datos reales de usuarios cuando **aprueba la app** para producción
  (se solicita desde el portal de desarrolladores). Cuando la aprueben, cambia
  `DEXCOM_BASE_URL` a `https://api.dexcom.eu` (cuentas de Europa).
- La API oficial **no es en tiempo real**: los datos pueden llegar con cierto retraso. Lo
  confirmaremos al probarla. Para las alarmas, el sensor y su app oficial siguen mandando.
- Clarity no tiene conexión propia: lo que ves en Clarity sale de la misma nube de Dexcom.

## 5. Activar la IA de Owi (chat y foto de comida)

1. Crea una clave en https://console.anthropic.com (API Keys).
2. En Supabase → Edge Functions → Secrets, añade `ANTHROPIC_API_KEY` con esa clave.
3. Despliega las funciones `owi-chat` y `food-estimate` (igual que las de Dexcom).
4. Sin la clave, Owi sigue funcionando con su "cerebro" local (registros, resúmenes y preguntas), y la foto de comida usa una estimación de demostración.

Reglas fijas de la IA (Fase 1): nunca da dosis ni interpreta síntomas, ante urgencias remite al 112 y solo recibe datos agregados (sin nombre ni identificadores).

## Seguridad y RGPD

- La contraseña de Dexcom nunca pasa por Towigo: el permiso se da en la web de Dexcom.
- Los tokens de Dexcom solo los lee el servidor (tablas protegidas, sin acceso desde la app).
- Cada conexión, lectura y desconexión queda en `audit_log`.
- Desde **Yo → Desconectar Dexcom** se borran los tokens del servidor.
