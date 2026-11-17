/**
 * Rendimiento (formato "app de recuperación"): diario de hábitos de sí/no, qué influye en tu Índice Towigo,
 * carga de actividad del día (0–21), objetivo de actividad según tu índice y estadísticas clave frente a tu media.
 * Todo describe datos y hábitos (Fase 1): son asociaciones para motivar y hablar con el equipo, no causas ni consejos clínicos.
 * Función pura: se prueba en tests/journal.test.ts.
 */
import { STEPS_GOAL, STEPS_TODAY } from '../data/mock';
import { DAY_MS, dayKey, dayKeyAgo } from './dates';
import { scoreHistory, towigoScore } from './score';
import { hasDiabetes, isT1, type AppState, type JournalQ } from './types';

/** Preguntas del diario. `good`: true si responder "sí" es el hábito que se busca. */
export const JOURNAL: { id: JournalQ; good: boolean }[] = [
  { id: 'proteinBreakfast', good: true },
  { id: 'sleep7', good: true },
  { id: 'walk30', good: true },
  { id: 'water', good: true },
  { id: 'alcohol', good: false },
  { id: 'stress', good: false },
  { id: 'eatOut', good: false },
];

/** Generador pseudoaleatorio estable (mulberry32): mismos datos de ejemplo en cada visita. */
const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Pasos de días pasados (prototipo: datos simulados estables por día; hoy, el dato del móvil). */
export function stepsOn(day: string, today = dayKey(Date.now())): number {
  if (day === today) return STEPS_TODAY;
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0;
  return Math.round(3500 + rng(h)() * 6500);
}

/**
 * Diario de los últimos 30 días: lo que la persona ha respondido y, en el prototipo, respuestas de ejemplo para días
 * anteriores (coherentes con su índice de cada día, para que el análisis tenga sentido en la demo).
 */
export function journalDays(s: AppState, now = Date.now(), days = 30): Record<string, Partial<Record<JournalQ, boolean>>> {
  const out: Record<string, Partial<Record<JournalQ, boolean>>> = {};
  const hist = s.dataSource === 'demo' ? scoreHistory(s, days, now) : [];
  // En la demo, los días por encima de su media semanal tienden a tener mejores hábitos (para que el análisis se entienda).
  const local = hist.map((v, i) => {
    const win = hist.slice(Math.max(0, i - 3), i + 4);
    return v - win.reduce((x, y) => x + y, 0) / Math.max(1, win.length);
  });
  const spread = Math.max(0.5, Math.sqrt(local.reduce((x, y) => x + y * y, 0) / Math.max(1, local.length)));
  for (let i = 0; i < days; i++) {
    const day = dayKeyAgo(days - 1 - i, now);
    const own = s.journal?.[day];
    if (own && Object.keys(own).length) {
      out[day] = own;
      continue;
    }
    if (!hist.length || i === days - 1) continue;
    const q = Math.max(-1, Math.min(1, local[i] / spread)); // −1 … 1
    const ans: Partial<Record<JournalQ, boolean>> = {};
    JOURNAL.forEach((j, k) => {
      const rr = rng(7919 * (i + 1) + 104729 * (k + 1));
      const p = Math.max(0.1, Math.min(0.9, 0.5 + (j.good ? 1 : -1) * 0.42 * q + (rr() - 0.5) * 0.16));
      ans[j.id] = rr() < p;
    });
    out[day] = ans;
  }
  return out;
}

export type Impact = { id: JournalQ; diff: number; yes: number; no: number; good: boolean };

/** Diferencia media del índice entre los días con "sí" y con "no" (mínimo 3 días de cada). */
export function journalImpact(s: AppState, now = Date.now()): Impact[] {
  const days = 30;
  const hist = scoreHistory(s, days, now);
  const j = journalDays(s, now, days);
  const out: Impact[] = [];
  for (const q of JOURNAL) {
    const yes: number[] = [];
    const no: number[] = [];
    for (let i = 0; i < days; i++) {
      const a = j[dayKeyAgo(days - 1 - i, now)]?.[q.id];
      if (a === true) yes.push(hist[i]);
      if (a === false) no.push(hist[i]);
    }
    if (yes.length >= 3 && no.length >= 3) {
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      out.push({ id: q.id, diff: Math.round((avg(yes) - avg(no)) * 10) / 10, yes: yes.length, no: no.length, good: q.good });
    }
  }
  return out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/** Carga de actividad del día, de 0 a 21 (pasos + sesiones de fuerza; crece cada vez más despacio). */
export function activityLoad(s: AppState, daysAgo = 0, now = Date.now()): number {
  const day = dayKeyAgo(daysAgo, now);
  const steps = stepsOn(day, dayKey(now));
  const strength = s.strength.filter((x) => dayKey(new Date(x.at).getTime()) === day).length;
  const raw = (steps / 1000) * 1.1 + strength * 5;
  return Math.round(21 * (1 - Math.exp(-raw / 11)) * 10) / 10;
}

/** Rango de actividad recomendado para hoy según el índice (hábitos, no prescripción de ejercicio). */
export function activityTarget(s: AppState, now = Date.now()): [number, number] {
  const band = towigoScore(s, now).band;
  return band === 'great' ? [12, 16] : band === 'good' ? [10, 14] : band === 'fair' ? [7, 11] : [4, 8];
}

/** Bienestar (0–100) a partir del ánimo de los check-ins: el de hoy si lo hay; si no, la media de 7 días. */
export function wellbeing(s: AppState, now = Date.now()): number | null {
  const today = s.checkins.find((c) => c.date === dayKey(now));
  const week = s.checkins.filter((c) => c.date > dayKeyAgo(7, now));
  const v = today ? today.v : week.length ? week.reduce((a, c) => a + c.v, 0) / week.length : null;
  return v === null ? null : Math.round(((v - 1) / 4) * 100);
}

export type KeyStat = { id: 'weight' | 'protein' | 'steps' | 'mood' | 'glucose' | 'tir'; value: number; baseline: number | null; unit: string; decimals: number; betterUp: boolean | null };

/** Estadísticas clave de hoy frente a tu media de 30 días. */
export function keyStats(s: AppState, now = Date.now()): KeyStat[] {
  const out: KeyStat[] = [];
  const within = (at: string, days: number) => now - new Date(at).getTime() < days * DAY_MS && new Date(at).getTime() <= now;
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const ws = [...s.weights].sort((a, b) => a.at.localeCompare(b.at));
  if (ws.length) out.push({ id: 'weight', value: ws[ws.length - 1].kg, baseline: avg(ws.filter((w) => within(w.at, 30)).map((w) => w.kg)), unit: 'kg', decimals: 1, betterUp: false });
  const today = dayKey(now);
  const prot = s.intake.find((x) => x.date === today)?.protein ?? 0;
  out.push({ id: 'protein', value: prot, baseline: avg(s.intake.filter((x) => x.date !== today && x.date > dayKeyAgo(30, now)).map((x) => x.protein)), unit: 'g', decimals: 0, betterUp: true });
  const pastSteps = Array.from({ length: 29 }, (_, i) => stepsOn(dayKeyAgo(i + 1, now), today));
  out.push({ id: 'steps', value: STEPS_TODAY, baseline: avg(pastSteps), unit: `/ ${STEPS_GOAL.toLocaleString('es-ES')}`, decimals: 0, betterUp: true });
  const moods = s.checkins.filter((c) => c.date > dayKeyAgo(30, now));
  const last = [...s.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (last) out.push({ id: 'mood', value: last.v, baseline: avg(moods.map((c) => c.v)), unit: '/5', decimals: 1, betterUp: true });
  if (isT1(s.profile) || hasDiabetes(s.profile)) {
    const g24 = s.glucose.filter((g) => within(g.at, 1)).map((g) => g.v);
    const g30 = s.glucose.filter((g) => within(g.at, 30)).map((g) => g.v);
    const a24 = avg(g24);
    if (a24 !== null) out.push({ id: 'glucose', value: Math.round(a24), baseline: avg(g30), unit: 'mg/dL', decimals: 0, betterUp: false });
    if (isT1(s.profile)) {
      const sens = (days: number) => s.glucose.filter((g) => g.context === 'sensor' && within(g.at, days));
      const tir = (xs: { v: number }[]) => (xs.length ? Math.round((xs.filter((g) => g.v >= 70 && g.v <= 180).length / xs.length) * 100) : null);
      const t24 = tir(sens(1));
      if (t24 !== null) out.push({ id: 'tir', value: t24, baseline: tir(sens(14)), unit: '%', decimals: 0, betterUp: true });
    }
  }
  return out;
}
