/**
 * Pasos: los de Apple Salud si está conectada (0 los días sin datos); si no, los de ejemplo del prototipo
 * (estables por día; hoy, el dato fijo de la demo).
 */
import { STEPS_TODAY } from '../data/mock';
import { dayKey } from './dates';
import type { AppState } from './types';

function hash(day: string) {
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0;
  let a = h;
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function stepsOn(s: AppState, day: string, today = dayKey(Date.now())): number {
  if (s.health?.connected) return s.health.stepsByDay[day] ?? 0;
  if (day === today) return STEPS_TODAY;
  return Math.round(3500 + hash(day) * 6500);
}

/** Pasos de hoy. */
export const stepsToday = (s: AppState, now = Date.now()) => stepsOn(s, dayKey(now), dayKey(now));
