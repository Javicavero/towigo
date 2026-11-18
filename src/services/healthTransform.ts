/**
 * Convierte las muestras de Apple Salud en el formato de Towigo (función pura; se prueba en tests/health.test.ts).
 * Pasos por día, sueño por noche (día en que te despiertas), peso con composición del mismo día, glucosa (sensor o
 * glucómetro), insulina (lenta o rápida según el motivo que guarda Salud), carbohidratos y proteína por día.
 */
import { dayKey } from '../state/dates';
import type { GlucoseContext } from '../state/types';
import type { HealthSnapshot } from './healthTypes';

/** reason: motivo de la insulina (1 = basal). meal: momento de la glucosa de glucómetro (1 = antes de comer, 2 = después). */
type Q = { startDate: Date; endDate?: Date; quantity: number; source?: string; reason?: number; meal?: number };
export type RawHealth = {
  stepsDaily: { start: Date; sum: number }[];
  sleep: { start: Date; end: Date; value: number }[];
  mass: Q[];
  fat: Q[];
  lean: Q[];
  glucose: Q[];
  insulin: Q[];
  carbs: Q[];
  protein: Q[];
};

/** Fuentes que son sensores de glucosa (para distinguirlas de un glucómetro). */
const CGM = /dexcom|libre|freestyle|cgm|guardian|eversense|simplera|medtronic|sibionics/i;
/** Valores de sueño de HealthKit que cuentan como dormido (sin especificar, básico, profundo, REM). */
const ASLEEP = new Set([1, 3, 4, 5]);

/** Momento de una lectura de glucómetro: el que guarda Salud; si no, por la hora (antes de las 10, en ayunas). */
function meterContext(at: Date, meal?: number): GlucoseContext {
  const h = at.getHours();
  if (meal === 2) return 'despuesComer';
  if (h >= 4 && h < 10) return 'ayunas';
  if (meal === 1) return 'antesComer';
  return h >= 22 || h < 4 ? 'noche' : 'antesComer';
}

export function toSnapshot(r: RawHealth): HealthSnapshot {
  const stepsByDay: Record<string, number> = {};
  for (const s of r.stepsDaily) if (s.sum > 0) stepsByDay[dayKey(s.start.getTime())] = Math.round(s.sum);

  const sleepByDay: Record<string, number> = {};
  for (const s of r.sleep) {
    if (!ASLEEP.has(s.value)) continue;
    const k = dayKey(s.end.getTime());
    sleepByDay[k] = (sleepByDay[k] ?? 0) + (s.end.getTime() - s.start.getTime()) / 3600e3;
  }
  for (const k of Object.keys(sleepByDay)) sleepByDay[k] = Math.round(sleepByDay[k] * 10) / 10;

  // Peso: una entrada por pesada; grasa y masa magra del mismo día si las hay (masa magra → % sobre el peso).
  const fatBy = new Map(r.fat.map((x) => [dayKey(x.startDate.getTime()), x.quantity <= 1 ? x.quantity * 100 : x.quantity]));
  const leanBy = new Map(r.lean.map((x) => [dayKey(x.startDate.getTime()), x.quantity]));
  const weights = r.mass
    .filter((m) => m.quantity > 20 && m.quantity < 400)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map((m) => {
      const k = dayKey(m.startDate.getTime());
      const fat = fatBy.get(k);
      const lean = leanBy.get(k);
      return {
        at: m.startDate.toISOString(),
        kg: Math.round(m.quantity * 10) / 10,
        ...(fat !== undefined ? { fatPct: Math.round(fat * 10) / 10 } : {}),
        ...(lean !== undefined ? { musclePct: Math.round((lean / m.quantity) * 1000) / 10 } : {}),
      };
    });

  // Glucosa: si una fuente da muchas lecturas al día, es un sensor aunque no reconozcamos su nombre.
  const perSourceDay = new Map<string, number>();
  for (const g of r.glucose) {
    const key = `${g.source ?? ''}|${dayKey(g.startDate.getTime())}`;
    perSourceDay.set(key, (perSourceDay.get(key) ?? 0) + 1);
  }
  const glucose = r.glucose
    .filter((g) => g.quantity >= 20 && g.quantity <= 600)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .map((g) => {
      const cgm = CGM.test(g.source ?? '') || (perSourceDay.get(`${g.source ?? ''}|${dayKey(g.startDate.getTime())}`) ?? 0) > 30;
      return { at: g.startDate.toISOString(), v: Math.round(g.quantity), cgm, context: cgm ? ('sensor' as const) : meterContext(g.startDate, g.meal) };
    });

  // Insulina: motivo 1 = basal (lenta) según HealthKit; el resto, rápida.
  const insulin = r.insulin.filter((x) => x.quantity > 0).map((x) => ({ at: x.startDate.toISOString(), units: Math.round(x.quantity * 10) / 10, kind: x.reason === 1 ? ('basal' as const) : ('rapid' as const) }));
  const carbs = r.carbs.filter((x) => x.quantity > 0).map((x) => ({ at: x.startDate.toISOString(), g: Math.round(x.quantity) }));
  const proteinByDay: Record<string, number> = {};
  for (const p of r.protein) {
    const k = dayKey(p.startDate.getTime());
    proteinByDay[k] = (proteinByDay[k] ?? 0) + p.quantity;
  }
  for (const k of Object.keys(proteinByDay)) proteinByDay[k] = Math.round(proteinByDay[k]);
  return { stepsByDay, sleepByDay, weights, glucose, insulin, carbs, proteinByDay };
}
