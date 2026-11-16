/**
 * Sistema visual de Towigo v2: "Holo" en claro y "Aurora" en oscuro.
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

// Claro "Holo": perla con violeta y aguamarina. Los acentos de texto van oscurecidos para cumplir contraste AA.
const light = {
  owiGreen: '#22C7B8', // gráficos (aguamarina)
  deepGreen: '#12A093',
  greenText: '#5B3DE0', // acción principal y texto de acento (violeta, 5,9:1 sobre el fondo)
  greenDark: '#4327B8',
  coral: '#FF9A6B',
  coralDark: '#E86A3A',
  coralText: '#B4432B',
  coralShadow: '#8E3120',
  achievement: '#E9A23B',
  yellowDark: '#8A6100',
  ink: '#1B1630',
  secondary: '#625B7C',
  cream: '#F4F1FA', // fondo de la app
  white: '#FFFFFF', // superficie de tarjetas
  surface2: '#FAF8FE',
  line: '#E6E0F3',
  border: '#E6E0F3',
  borderStrong: '#D3CAE8',
  onAccent: '#FFFFFF',
  chip: '#ECE7F7',
  tabBar: 'rgba(250,248,254,0.92)',
  softGreen: '#ECE7FF',
  softCoral: '#FFEDE4',
  softYellow: '#FBF1DD',
  softBlue: '#E3F6F4',
  softPurple: '#EFEBFF',
  blue: '#0B7F75', // segundo acento de datos (aguamarina oscuro)
  blueDark: '#085F58',
  purple: '#7B5CFF',
  low: '#C0261C',
};

// Oscuro "Aurora": azul noche con turquesa, violeta y rosa.
const dark: typeof light = {
  owiGreen: '#3DE0C8',
  deepGreen: '#22C7B8',
  greenText: '#3DE0C8', // acción principal y texto de acento (turquesa, 11,5:1)
  greenDark: '#A6F4E8',
  coral: '#FF7AB6',
  coralDark: '#FF7AB6',
  coralText: '#FF9AC6',
  coralShadow: '#8E3120',
  achievement: '#F5B95A',
  yellowDark: '#F2C46D',
  ink: '#F2F5FF',
  secondary: '#93A0BF',
  cream: '#0A0F1E',
  white: '#141A2E',
  surface2: '#1A2138',
  line: '#232B45',
  border: '#232B45',
  borderStrong: '#343E5E',
  onAccent: '#06131A',
  chip: '#1D2540',
  tabBar: 'rgba(10,15,30,0.92)',
  softGreen: 'rgba(61,224,200,0.12)',
  softCoral: 'rgba(255,122,182,0.14)',
  softYellow: 'rgba(245,185,90,0.13)',
  softBlue: 'rgba(124,108,255,0.16)',
  softPurple: 'rgba(124,108,255,0.16)',
  blue: '#9D91FF',
  blueDark: '#C2BAFF',
  purple: '#9D91FF',
  low: '#FF6B5E',
};

export const colors = isDark ? dark : light;

/**
 * Colores de categoría (iconos de Registrar, Para hoy, ajustes…), afinados para Holo y Aurora.
 * Los nombres describen el tono; cada pantalla los usa a través de los iconos (Glyph).
 */
export const cat = isDark
  ? { indigo: '#8C9BFF', violet: '#A28FFF', rose: '#FF7AB6', aqua: '#3DE0C8', amber: '#F5B95A', peach: '#FF9A6B', slate: '#93A0BF' }
  : { indigo: '#4F5BEA', violet: '#7B5CFF', rose: '#E5487F', aqua: '#0FA394', amber: '#D9921F', peach: '#F2703F', slate: '#6B6485' };

/** Los colores antiguos que aún aparecen en pantallas se traducen a la paleta nueva. */
const LEGACY: Record<string, keyof typeof cat> = {
  '#1E63C7': 'indigo',
  '#5B4BC4': 'violet',
  '#C8372D': 'rose',
  '#17785A': 'aqua',
  '#0B7266': 'aqua',
  '#B7791F': 'amber',
  '#D9542F': 'peach',
  '#5F6670': 'slate',
  '#2F3440': 'slate',
};
export const catColor = (c: string) => (LEGACY[c.toUpperCase()] ? cat[LEGACY[c.toUpperCase()]] : c);

/** Color con transparencia (#RRGGBB → rgba). */
export function tint(hex: string, a: number) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

/** Degradados (uso muy puntual). */
export const gradients = {
  hero: isDark ? (['#161B3A', '#0A0F1E'] as const) : (['#E9E2FF', '#F4F1FA'] as const),
  coral: ['#FF8A65', '#FF7A59'] as const,
  night: isDark ? (['#111527', '#0B0C0F'] as const) : (['#E9ECF8', '#F4F3EF'] as const),
  tech: isDark ? (['#0E1A2B', '#16181D'] as const) : (['#EEF3FF', '#FFFFFF'] as const),
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Sora_600SemiBold', // titulares y cifras
  bold: 'Sora_700Bold',
  black: 'Sora_700Bold',
};

export const radius = { s: 10, m: 14, l: 22, xl: 28 };

/** Tamaño mínimo de zona táctil (accesibilidad, mayores de 60). */
export const MIN_TOUCH = 48;
