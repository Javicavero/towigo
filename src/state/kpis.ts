/**
 * Indicadores de la semana frente a la anterior (últimos 7 días vs. los 7 previos).
 * Solo describe datos registrados: no interpreta clínicamente ni sugiere cambios de tratamiento.
 * Función pura: se prueba en tests/kpis.test.ts.
 */
import { DAY_MS, dayKeyAgo } from './dates';
import { hasDiabetes, isT1, usesGlp1, type AppState, type GlucoseEntry } from './types';

export type Kpi = {
  id: 'weight' | 'tir' | 'glucoseAvg' | 'glucoseCv' | 'adherence' | 'logDays' | 'mood' | 'strength';
  value: number;
  unit: string;
  decimals: number;
  /** Cambio frente a la semana anterior (misma unidad); null si no hay datos para comparar. */
  delta: number | null;
  /** true si el cambio va en la buena dirección; null si es neutro o no hay cambio. */
  good: boolean | null;
  /** Serie para la mini gráfica (de más antiguo a más reciente). */
  series: number[];
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const inWin = (at: string, now: number, from: number, to: number) => {
  const age = now - new Date(at).getTime();
  return age >= from * DAY_MS && age < to * DAY_MS;
};
const dir = (delta: number | null, betterUp: boolean, eps: number) => (delta === null || Math.abs(delta) < eps ? null : delta > 0 === betterUp);

function glucoseIn(gl: GlucoseEntry[], now: number, from: number, to: number) {
  return gl.filter((g) => inWin(g.at, now, from, to)).map((g) => g.v);
}
const tirOf = (vs: number[]) => (vs.length ? Math.round((vs.filter((v) => v >= 70 && v <= 180).length / vs.length) * 100) : null);
const cvOf = (vs: number[]) => {
  const m = avg(vs);
  if (m === null || vs.length < 10) return null;
  const sd = Math.sqrt(vs.reduce((a, v) => a + (v - m) ** 2, 0) / vs.length);
  return Math.round((sd / m) * 1000) / 10;
};

export function weeklyKpis(state: AppState, now = Date.now()): Kpi[] {
  const out: Kpi[] = [];
  const push = (k: Omit<Kpi, 'good' | 'delta'> & { prev: number | null; betterUp: boolean; eps?: number }) => {
    const delta = k.prev === null ? null : Math.round((k.value - k.prev) * 10 ** k.decimals) / 10 ** k.decimals;
    const { prev: _p, betterUp, eps, ...rest } = k;
    out.push({ ...rest, delta, good: dir(delta, betterUp, eps ?? 10 ** -k.decimals / 2) });
  };

  // Glucosa (sensor en tipo 1; glucómetro en tipo 2).
  if (hasDiabetes(state.profile) || isT1(state.profile)) {
    const g = state.glucose;
    const a = glucoseIn(g, now, 0, 7);
    const b = glucoseIn(g, now, 7, 14);
    const daily = Array.from({ length: 7 }, (_, i) => tirOf(glucoseIn(g, now, 6 - i, 7 - i))).filter((x): x is number => x !== null);
    if (isT1(state.profile) && a.length) {
      push({ id: 'tir', value: tirOf(a)!, prev: tirOf(b), unit: '%', decimals: 0, betterUp: true, eps: 1, series: daily });
      const cv = cvOf(a);
      if (cv !== null) push({ id: 'glucoseCv', value: cv, prev: cvOf(b), unit: '%', decimals: 1, betterUp: false, eps: 0.5, series: [] });
    }
    const ma = avg(a);
    if (ma !== null) {
      const dailyAvg = Array.from({ length: 7 }, (_, i) => avg(glucoseIn(g, now, 6 - i, 7 - i))).filter((x): x is number => x !== null).map(Math.round);
      const mb = avg(b);
      push({ id: 'glucoseAvg', value: Math.round(ma), prev: mb === null ? null : Math.round(mb), unit: 'mg/dL', decimals: 0, betterUp: false, eps: 2, series: dailyAvg });
    }
  }

  // Peso: último registro de cada semana.
  const ws = [...state.weights].sort((x, y) => x.at.localeCompare(y.at));
  const lastIn = (from: number, to: number) => [...ws].reverse().find((w) => inWin(w.at, now, from, to))?.kg ?? null;
  const wNow = lastIn(0, 7) ?? (ws.length ? ws[ws.length - 1].kg : null);
  if (wNow !== null) {
    const wPrev = lastIn(7, 14);
    push({ id: 'weight', value: wNow, prev: wPrev, unit: 'kg', decimals: 1, betterUp: false, eps: 0.1, series: ws.slice(-12).map((w) => w.kg) });
  }

  // Adherencia GLP-1: semanas con inyección en las últimas 4 (frente a las 4 anteriores).
  if (usesGlp1(state.profile) && state.injections.length) {
    const weeksWith = (from: number) =>
      Array.from({ length: 4 }, (_, i) => state.injections.some((x) => inWin(x.at, now, (from + i) * 7, (from + i + 1) * 7))).filter(Boolean).length;
    const series = Array.from({ length: 8 }, (_, i) => (state.injections.some((x) => inWin(x.at, now, (7 - i) * 7, (8 - i) * 7)) ? 1 : 0));
    push({ id: 'adherence', value: (weeksWith(0) / 4) * 100, prev: (weeksWith(4) / 4) * 100, unit: '%', decimals: 0, betterUp: true, eps: 1, series });
  }

  // Constancia: días con algún registro.
  const days = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => state.habitHistory[dayKeyAgo(from + i, now)]).filter(Boolean).length;
  const logSeries = Array.from({ length: 14 }, (_, i) => (state.habitHistory[dayKeyAgo(13 - i, now)] ? 1 : 0));
  push({ id: 'logDays', value: days(0, 7), prev: days(7, 14), unit: '/7', decimals: 0, betterUp: true, eps: 1, series: logSeries });

  // Ánimo (check-ins 1–5).
  const moodIn = (from: number, to: number) => avg(state.checkins.filter((c) => c.date <= dayKeyAgo(from, now) && c.date > dayKeyAgo(to, now)).map((c) => c.v));
  const m1 = moodIn(0, 7);
  if (m1 !== null) {
    const m0 = moodIn(7, 14);
    push({ id: 'mood', value: Math.round(m1 * 10) / 10, prev: m0 === null ? null : Math.round(m0 * 10) / 10, unit: '/5', decimals: 1, betterUp: true, eps: 0.1, series: state.checkins.slice(-14).map((c) => c.v) });
  }

  // Fuerza: sesiones por semana.
  const st = (from: number, to: number) => state.strength.filter((x) => inWin(x.at, now, from, to)).length;
  push({ id: 'strength', value: st(0, 7), prev: st(7, 14), unit: `/${state.goals.strengthPerWeek}`, decimals: 0, betterUp: true, eps: 1, series: [] });

  return out;
}

/** Texto del cambio: "+1,2", "−0,4", "=". */
export function fmtDelta(k: Kpi): string {
  if (k.delta === null) return '';
  if (Math.abs(k.delta) < 10 ** -k.decimals / 2) return '=';
  const s = Math.abs(k.delta).toFixed(k.decimals).replace('.', ',');
  return `${k.delta > 0 ? '+' : '−'}${s}`;
}
export const fmtVal = (k: Kpi) => k.value.toFixed(k.decimals).replace('.', ',');
