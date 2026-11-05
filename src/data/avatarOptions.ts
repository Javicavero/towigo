/** Opciones del avatar 2D del usuario (busto ilustrado) y premios. */
export const SKIN_TONES = ['#F6D7C3', '#EBC2A0', '#D6A27C', '#B47D57', '#8D5A3B', '#5E3A26'];
/** Incluye canoso y blanco para reflejar la edad. */
export const HAIR_COLORS = ['#2B1D14', '#5A3825', '#A0662E', '#E0B65A', '#B0412E', '#8E9196', '#E4E1DA'];
export const EYE_COLORS = ['#3B2416', '#6B4423', '#8A6A2E', '#4E7A4A', '#4C7BB5', '#7D8A94'];
export const TOP_COLORS = ['#2BB58A', '#FF7A59', '#FFD166', '#3E7CB1', '#7B5EA7', '#1E2A32', '#FFFFFF', '#C8102E'];

export const HAIR_STYLES = ['corto', 'rapado', 'melena', 'rizos', 'mono', 'calvo'] as const;
export const FACIAL_HAIR = ['ninguno', 'corta', 'barba', 'bigote', 'perilla'] as const;
export const GLASSES = ['ninguna', 'redondas', 'cuadradas'] as const;
export const TOPS = ['sudadera', 'camiseta', 'camisa'] as const;
export const BODY_TYPES = ['delgada', 'media', 'robusta', 'grande'] as const;
export const FACE_SHAPES = ['ovalada', 'redonda', 'alargada'] as const;
export const BROWS = ['finas', 'normales', 'gruesas'] as const;

export type AccessoryId = 'headband' | 'medal';

/** Premios del avatar por hábitos (nunca por resultados). */
export const ACCESSORIES: { id: AccessoryId; unlockDays: number; emoji: string }[] = [
  { id: 'headband', unlockDays: 7, emoji: '🎽' },
  { id: 'medal', unlockDays: 30, emoji: '🏅' },
];
