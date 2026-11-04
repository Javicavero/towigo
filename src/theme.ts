/**
 * Paleta de marca (especificación §7) más variantes accesibles.
 * Verde Owi y Coral no llegan a 4,5:1 con texto encima, así que para
 * texto y botones usamos las variantes "Text" (contraste ≥ 5:1).
 */
export const colors = {
  owiGreen: '#2BB58A', // fondos, ilustración
  deepGreen: '#1F8F6C', // ilustración
  greenText: '#17785A', // texto/botones (5,15:1 sobre crema; 5,43:1 con blanco)
  coral: '#FF7A59', // ilustración
  coralDark: '#D9542F', // texto grande
  coralText: '#B8432A', // texto normal y botones (5,4:1 con blanco)
  achievement: '#FFD166',
  ink: '#1E2A32',
  cream: '#FFF8F1',
  secondary: '#4A5A63',
  white: '#FFFFFF',
  line: '#EADFD3',
  softGreen: '#E3F5EE',
  softCoral: '#FFE9E2',
  softYellow: '#FFF3D1',
  low: '#B3261E', // glucosa baja (6,5:1 sobre blanco)
};

export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  black: 'Nunito_800ExtraBold',
};

export const radius = { s: 10, m: 16, l: 24, xl: 32 };

/** Tamaño mínimo de zona táctil (accesibilidad, mayores de 60). */
export const MIN_TOUCH = 52;
