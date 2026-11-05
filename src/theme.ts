/**
 * Sistema visual de Towigo v1 — "premium + tech".
 * Neutros cálidos y superficies limpias en claro; grafito profundo en oscuro.
 * Los colores de datos (teal, azul eléctrico, violeta, coral) son los protagonistas.
 * El tema (claro/oscuro) se decide al arrancar: sistema o preferencia del usuario (Yo → Apariencia).
 */
import { Appearance, Platform } from 'react-native';

export type Appearance_ = 'system' | 'light' | 'dark';
const PREF_KEY = 'towigo.appearance';

export function readAppearancePref(): Appearance_ {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return (localStorage.getItem(PREF_KEY) as Appearance_) || 'system';
  } catch {
    /* sin almacenamiento */
  }
  return 'system';
}

/** Guarda la preferencia y recarga (en web) para aplicar el tema en toda la app. */
export function setAppearancePref(p: Appearance_) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(PREF_KEY, p);
      window.location.reload();
    }
  } catch {
    /* sin almacenamiento */
  }
}

const pref = readAppearancePref();
export const scheme: 'light' | 'dark' = pref === 'system' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : pref;
export const isDark = scheme === 'dark';

const light = {
  // Marca y acentos (texto/botones con contraste ≥ 4,5:1 sobre la superficie)
  owiGreen: '#14B8A6', // gráficos
  deepGreen: '#0F9488',
  greenText: '#0B7266', // texto y botones
  greenDark: '#085A51',
  coral: '#FF7A59',
  coralDark: '#E0573A',
  coralText: '#B4432B',
  coralShadow: '#8E3120',
  achievement: '#E9A23B',
  yellowDark: '#8A6100',
  // Neutros
  ink: '#121316',
  secondary: '#62646B',
  cream: '#F4F3EF', // fondo de la app (neutro cálido)
  white: '#FFFFFF', // superficie de tarjetas
  surface2: '#F8F7F4',
  line: '#E8E6E1',
  border: '#E8E6E1',
  borderStrong: '#D6D3CC',
  onAccent: '#FFFFFF', // texto/iconos sobre acentos
  chip: '#EFEDE8',
  tabBar: 'rgba(250,249,246,0.92)',
  // Tintes de estado
  softGreen: '#E3F4F1',
  softCoral: '#FCEBE5',
  softYellow: '#FBF1DD',
  softBlue: '#E8EFFF',
  softPurple: '#EFEBFF',
  // Datos
  blue: '#2F5BEA',
  blueDark: '#1F44B8',
  purple: '#6A4DF4',
  low: '#C0261C',
};

const dark: typeof light = {
  owiGreen: '#2DD4BF',
  deepGreen: '#14B8A6',
  greenText: '#3EE0C4',
  greenDark: '#99F6E4',
  coral: '#FF8A6B',
  coralDark: '#FF7A59',
  coralText: '#FF9479',
  coralShadow: '#8E3120',
  achievement: '#F5B95A',
  yellowDark: '#F2C46D',
  ink: '#F3F3F4',
  secondary: '#A1A3AA',
  cream: '#0B0C0F',
  white: '#16181D',
  surface2: '#1C1F25',
  line: '#272A31',
  border: '#272A31',
  borderStrong: '#363A43',
  onAccent: '#04221C',
  chip: '#22252C',
  tabBar: 'rgba(14,15,19,0.92)',
  softGreen: 'rgba(45,212,191,0.12)',
  softCoral: 'rgba(255,138,107,0.13)',
  softYellow: 'rgba(245,185,90,0.13)',
  softBlue: 'rgba(110,150,255,0.14)',
  softPurple: 'rgba(160,140,255,0.14)',
  blue: '#7A9BFF',
  blueDark: '#A9BEFF',
  purple: '#A58FFF',
  low: '#FF6B5E',
};

export const colors = isDark ? dark : light;

/** Degradados (uso muy puntual). */
export const gradients = {
  hero: isDark ? (['#10231F', '#0B0C0F'] as const) : (['#E3F4F1', '#F4F3EF'] as const),
  coral: ['#FF8A65', '#FF7A59'] as const,
  night: isDark ? (['#111527', '#0B0C0F'] as const) : (['#E9ECF8', '#F4F3EF'] as const),
  tech: isDark ? (['#0E1A2B', '#16181D'] as const) : (['#EEF3FF', '#FFFFFF'] as const),
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_700Bold',
};

export const radius = { s: 8, m: 12, l: 20, xl: 28 };

/** Tamaño mínimo de zona táctil (accesibilidad, mayores de 60). */
export const MIN_TOUCH = 48;
