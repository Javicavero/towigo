/** Opciones de personalización de Owi (especificación §4.2). */
export const SKIN_TONES = ['#F6D7C3', '#EBC2A0', '#D6A27C', '#B47D57', '#8D5A3B', '#5E3A26'];
export const HAIR_COLORS = ['#2B1D14', '#5A3825', '#A0662E', '#E0B65A', '#B0412E', '#9AA0A6'];
export const HOODIE_COLORS = ['#2BB58A', '#FF7A59', '#FFD166', '#3E7CB1', '#7B5EA7', '#1E2A32'];
export const SHOE_COLORS = ['#FFFFFF', '#FF7A59', '#2BB58A', '#1E2A32', '#3E7CB1'];

export const HAIR_STYLES = ['corto', 'melena', 'rizos', 'mono', 'rapado'] as const;

export type AccessoryId = 'glasses' | 'headband' | 'medal';

/** Accesorios que se desbloquean con logros de hábitos (nunca con resultados glucémicos). */
export const ACCESSORIES: { id: AccessoryId; unlockDays: number; emoji: string }[] = [
  { id: 'glasses', unlockDays: 3, emoji: '👓' },
  { id: 'headband', unlockDays: 7, emoji: '🎽' },
  { id: 'medal', unlockDays: 30, emoji: '🏅' },
];
