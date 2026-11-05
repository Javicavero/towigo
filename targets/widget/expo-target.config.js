/**
 * Widget de iOS (WidgetKit) de Towigo: Owi en la pantalla de inicio y de bloqueo.
 * Lo genera @bacons/apple-targets al hacer `npx expo prebuild` / EAS Build.
 * Lee la instantánea que escribe la app en el App Group compartido.
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
const moods = ['happy', 'attentive', 'caringHigh', 'worriedHigh', 'caringLow', 'worriedLow', 'celebrate', 'sleep', 'confused', 'remind', 'sport', 'missYou'];

module.exports = (config) => ({
  type: 'widget',
  name: 'OwiWidget',
  icon: '../../assets/icon.png',
  // 18.0: Live Activities en Apple Watch (supplementalActivityFamilies).
  deploymentTarget: '18.0',
  frameworks: ['ActivityKit'],
  entitlements: {
    'com.apple.security.application-groups': ['group.app.towigo'],
  },
  colors: {
    owiGreen: '#17785A',
    owiCoral: '#D9542F',
    owiInk: '#1C1C1E',
    owiSecondary: '#5F6670',
    $widgetBackground: '#FFFFFF',
  },
  // Las 12 ilustraciones de Owi como imágenes del widget: owi_happy, owi_sport...
  images: Object.fromEntries(moods.map((m) => [`owi_${m}`, `../../assets/owi/${m}.png`])),
});
