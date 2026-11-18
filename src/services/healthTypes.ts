import type { GlucoseContext } from '../state/types';

/** Lo que Towigo lee de Apple Salud (y, en Android, de Health Connect cuando llegue). Datos ya simplificados. */
export type HealthSnapshot = {
  /** Pasos por día (clave AAAA-MM-DD, hora local). */
  stepsByDay: Record<string, number>;
  /** Horas dormidas, asignadas al día en que te despiertas. */
  sleepByDay: Record<string, number>;
  weights: { at: string; kg: number; fatPct?: number; musclePct?: number }[];
  /**
   * cgm: lectura de sensor (Dexcom, Libre…); si no, glucómetro. context: momento de la lectura de glucómetro
   * (el que guarda Salud; si no lo guarda, por la hora del día).
   */
  glucose: { at: string; v: number; cgm: boolean; context: GlucoseContext }[];
  insulin: { at: string; units: number; kind: 'rapid' | 'basal' }[];
  carbs: { at: string; g: number }[];
  proteinByDay: Record<string, number>;
};
