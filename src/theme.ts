/**
 * Sistema visual de Towigo (estilo clínico, tipo Apple Salud).
 * Marca (§7): verde Owi y coral como acentos. Para texto y botones se usan las
 * variantes con contraste ≥ 4,5:1.
 */
export const colors = {
  // Marca
  owiGreen: '#2BB58A', // gráficos e ilustración
  deepGreen: '#1F8F6C',
  greenText: '#17785A', // texto y botones (5,4:1 con blanco)
  greenDark: '#0F5C43',
  coral: '#FF7A59', // gráficos
  coralDark: '#D9542F',
  coralText: '#B8432A', // texto (5,4:1 con blanco)
  coralShadow: '#8E3120',
  achievement: '#F5B700',
  yellowDark: '#9A7300',
  // Neutros
  ink: '#1C1C1E', // texto principal
  secondary: '#5F6670', // texto secundario (≥ 5:1 sobre blanco y sobre el fondo)
  cream: '#F2F2F7', // fondo de la app (gris agrupado)
  white: '#FFFFFF',
  line: '#E5E5EA',
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  // Tintes suaves para estados
  softGreen: '#E8F6F0',
  softCoral: '#FDEDE8',
  softYellow: '#FFF6DB',
  softBlue: '#EAF2FE',
  softPurple: '#F0EEFC',
  // Acentos por categoría de datos
  blue: '#1E63C7',
  blueDark: '#164C99',
  purple: '#5B4BC4',
  low: '#B3261E', // glucosa baja
};

/** Degradados (uso muy puntual). */
export const gradients = {
  hero: ['#E8F6F0', '#F2F2F7'] as const,
  coral: ['#FF8A65', '#FF7A59'] as const,
  night: ['#E9ECF8', '#F2F2F7'] as const,
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_700Bold',
};

export const radius = { s: 8, m: 12, l: 16, xl: 20 };

/** Tamaño mínimo de zona táctil (accesibilidad, mayores de 60). */
export const MIN_TOUCH = 48;
