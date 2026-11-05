# Widgets de Owi (iPhone y Android)

Owi en la pantalla de inicio y de bloqueo: su emoción, una frase corta, lo siguiente que toca
(inyección, medicación o glucosa) y la racha. Al tocarlo se abre la app en la sección adecuada.

| Plataforma | Tamaños | Código |
|---|---|---|
| iPhone (iOS 17+) | Pequeño, mediano, bloqueo circular y rectangular | `targets/widget/` (SwiftUI, WidgetKit) |
| Android | Redimensionable (4×2 por defecto) | `src/widgets/OwiAndroidWidget.tsx` |

**Importante:** los widgets solo existen en la **app instalada** (TestFlight / App Store o APK /
Google Play). La versión web (Safari, "Añadir a pantalla de inicio") no puede tener widgets.
En la web se ve una **vista previa** en *Yo → Owi en tu pantalla*.

## Cómo funciona
1. La app calcula una instantánea (`src/widgets/snapshot.ts`) cada vez que cambian los datos.
2. La guarda donde el widget puede leerla:
   - iOS: App Group `group.app.towigo`, clave `owiWidget` (`@bacons/apple-targets`).
   - Android: almacenamiento local + `requestWidgetUpdate` (`react-native-android-widget`).
3. El sistema redibuja el widget al momento y, además, cada 30 minutos.
4. Enlaces: `towigo://hoy`, `towigo://registrar/inyeccion`, `towigo://registrar/medicacion`.

## Para compilarlos (una vez tengas las cuentas)
1. Cuenta de desarrollador de Apple (99 €/año) y cuenta gratuita de Expo.
2. Añade tu *Team ID* de Apple en `app.json` → `expo.ios.appleTeamId` (lo encuentras en
   developer.apple.com → Membership).
3. Compila con EAS (Claude puede lanzarlo cuando el entorno tenga acceso a Expo):
   - iPhone: `npx eas-cli@latest build --platform ios --profile preview` → TestFlight.
   - Android: `npx eas-cli@latest build --platform android --profile preview` → APK.
   EAS registra automáticamente el App Group del widget en tu cuenta de Apple.
4. En el móvil: mantén pulsada la pantalla de inicio → **+** (iPhone) o **Widgets** (Android) →
   **Towigo** → elige el tamaño.

## Live Activity, Dynamic Island y Apple Watch

- Código: `targets/widget/OwiLiveActivity.swift` (vista) y `modules/owi-live-activity` (módulo nativo local que la inicia, actualiza y termina).
- Aparece solo en momentos con principio y fin: **el día de la inyección** (hasta que se apunta) y, en **tipo 1**, la **glucosa del sensor** con su tendencia.
- En el **Apple Watch** se ve en el Smart Stack (watchOS 11 o posterior) sin instalar una app de reloj, igual que hace Gluroo.
- Requiere iOS 18 para el widget (por el soporte del reloj) y `NSSupportsLiveActivities` (ya en `app.json`).

## Estado
- Configuración verificada con `expo prebuild`: el proyecto iOS incluye el objetivo `OwiWidget`
  (con las 12 ilustraciones y los colores) y Android registra el widget `Owi`.
- **Pendiente de compilar y probar en un móvil real** (no hay Xcode ni SDK de Android en el
  entorno de desarrollo en la nube).
