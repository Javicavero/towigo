/**
 * Índice Towigo (0–100): una cifra, como la puntuación de sueño de los relojes, que resume cómo va la vida de la persona
 * con su tratamiento en los últimos 7 días. Combina varias áreas con pesos fijos; si de un área no hay datos, no cuenta
 * y el resto se reparte su peso.
 *
 *   Tratamiento 20 · Glucosa 20 · Peso 15 · Actividad 15 · Constancia 10 · Bienestar 10 · Nutrición 10
 *
 * Es una medida de hábitos y tendencias para motivar y para conversar con el equipo. No es una valoración clínica
 * ni sirve para tomar decisiones de tratamiento (Fase 1). Función pura: se prueba en tests/score.test.ts.
 */
import { STEPS_GOAL } from '../data/mock';
import { stepsOn } from './steps';
import { DAY_MS, dayKey, dayKeyAgo } from './dates';
import { hasDiabetes, hasT2, isT1, usesGlp1, type AppState } from './types';

export type AreaId = 'treatment' | 'glucose' | 'weight' | 'activity' | 'consistency' | 'wellbeing' | 'nutrition';
export type Area = { id: AreaId; score: number; weight: number };
export type Score = { value: number; areas: Area[]; band: 'great' | 'good' | 'fair' | 'low' };

export const WEIGHTS: Record<AreaId, number> = { treatment: 20, glucose: 20, weight: 15, activity: 15, consistency: 10, wellbeing: 10, nutrition: 10 };

const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
const lin = (x: number, x0: number, y0: number, x1: number, y1: number) => clamp(y0 + ((x - x0) * (y1 - y0)) / (x1 - x0));
const within = (at: string, end: number, days: number) => {
  const tt = new Date(at).getTime();
  return tt <= end && end - tt < days * DAY_MS;
};

export const bandOf = (v: number): Score['band'] => (v >= 85 ? 'great' : v >= 70 ? 'good' : v >= 50 ? 'fair' : 'low');

/** Índice a fecha `end` (ventana de 7 días que acaba en `end`). */
export function towigoScore(s: AppState, end = Date.now()): Score {
  const areas: Area[] = [];
  const add = (id: AreaId, score: number | null) => {
    if (score !== null && Number.isFinite(score)) areas.push({ id, score: clamp(score), weight: WEIGHTS[id] });
  };
  const maintenance = usesGlp1(s.profile) && s.glp1.status === 'maintenance';

  // Tratamiento: GLP-1 al día; insulina lenta registrada; pastillas tomadas.
  const parts: number[] = [];
  if (usesGlp1(s.profile) && !maintenance && s.injections.length) {
    const last = Math.max(...s.injections.map((x) => new Date(x.at).getTime()).filter((x) => x <= end));
    const days = (end - last) / DAY_MS;
    parts.push(days <= 7.5 ? 100 : days <= 9 ? 70 : days <= 14 ? 35 : 10);
  }
  if (isT1(s.profile)) {
    const basalDays = new Set(s.insulin.filter((x) => x.kind === 'basal' && within(x.at, end, 7)).map((x) => dayKey(new Date(x.at).getTime())));
    if (s.insulin.length) parts.push((basalDays.size / 7) * 100);
  }
  if (hasT2(s.profile) && s.meds.length) {
    let due = 0;
    let taken = 0;
    for (let i = 0; i < 7; i++) {
      const day = dayKeyAgo(i, end);
      for (const m of s.meds)
        for (const time of m.times) {
          due++;
          if (s.medsTaken[`${day}|${m.id}|${time}`]) taken++;
        }
    }
    // Sin historial de tomas (datos de ejemplo), solo cuenta hoy.
    if (taken > 0) parts.push((taken / due) * 100);
  }
  add('treatment', parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null);

  // Glucosa: tiempo en rango (sensor) o media de ayunas (glucómetro).
  if (hasDiabetes(s.profile) || isT1(s.profile)) {
    const gl = s.glucose.filter((g) => within(g.at, end, 7));
    if (isT1(s.profile)) {
      const sens = gl.filter((g) => g.context === 'sensor');
      if (sens.length >= 20) {
        const tir = (sens.filter((g) => g.v >= 70 && g.v <= 180).length / sens.length) * 100;
        const tbr = (sens.filter((g) => g.v < 70).length / sens.length) * 100;
        add('glucose', lin(tir, 40, 30, 80, 100) - Math.max(0, tbr - 4) * 3);
      }
    } else {
      const f = gl.filter((g) => g.context === 'ayunas').map((g) => g.v);
      if (f.length) add('glucose', lin(f.reduce((a, b) => a + b, 0) / f.length, 130, 100, 200, 30));
    }
  }

  // Peso: tendencia de las últimas 4 semanas (en mantenimiento, cuanto más estable, mejor).
  const ws = s.weights.filter((w) => new Date(w.at).getTime() <= end).sort((a, b) => a.at.localeCompare(b.at));
  const recent = ws.filter((w) => within(w.at, end, 29));
  if (recent.length >= 2) {
    const a = recent[0];
    const b = recent[recent.length - 1];
    const weeks = Math.max(1, (new Date(b.at).getTime() - new Date(a.at).getTime()) / (7 * DAY_MS));
    const pctWeek = ((a.kg - b.kg) / a.kg) * 100 / weeks; // % de pérdida por semana
    if (maintenance) add('weight', lin(Math.abs(pctWeek), 0.1, 100, 0.8, 40));
    else if (usesGlp1(s.profile)) add('weight', pctWeek >= 0.5 ? 100 : pctWeek >= 0 ? lin(pctWeek, 0, 60, 0.5, 100) : lin(pctWeek, -0.5, 20, 0, 60));
    else add('weight', lin(Math.abs(pctWeek), 0.1, 100, 1, 50));
  }

  // Actividad: fuerza frente al objetivo + pasos.
  const strength = s.strength.filter((x) => within(x.at, end, 7)).length;
  add('activity', 0.6 * Math.min(100, (strength / Math.max(1, s.goals.strengthPerWeek)) * 100) + 0.4 * Math.min(100, (stepsOn(s, dayKey(end), dayKey(Date.now())) / STEPS_GOAL) * 100));

  // Constancia: días con algún registro (historial + hoy).
  let logDays = 0;
  for (let i = 0; i < 7; i++) {
    const k = dayKeyAgo(i, end);
    if (k === s.day ? s.habitsToday.log || s.habitHistory[k] : s.habitHistory[k]) logDays++;
  }
  add('consistency', (logDays / 7) * 100);

  // Bienestar: ánimo de los check-ins.
  const ms = s.checkins.filter((c) => c.date <= dayKeyAgo(0, end) && c.date > dayKeyAgo(7, end)).map((c) => c.v);
  add('wellbeing', ms.length ? ((ms.reduce((a, b) => a + b, 0) / ms.length - 1) / 4) * 100 : null);

  // Nutrición: días que se llegó a la proteína objetivo.
  const intake = s.intake.filter((x) => x.date <= dayKeyAgo(0, end) && x.date > dayKeyAgo(7, end));
  add('nutrition', intake.length ? (intake.reduce((a, x) => a + Math.min(1, x.protein / s.goals.proteinG), 0) / Math.max(3, intake.length)) * 100 : null);

  const wsum = areas.reduce((a, x) => a + x.weight, 0);
  const value = wsum ? clamp(areas.reduce((a, x) => a + x.score * x.weight, 0) / wsum) : 0;
  return { value, areas, band: bandOf(value) };
}

/** Evolución diaria del índice (de más antiguo a hoy). */
export function scoreHistory(s: AppState, days = 14, now = Date.now()): number[] {
  return Array.from({ length: days }, (_, i) => towigoScore(s, now - (days - 1 - i) * DAY_MS).value);
}
