/**
 * Pacientes de demostración del panel profesional y métricas clínicas descriptivas.
 * La priorización ordena la revisión del equipo; no diagnostica ni genera indicaciones al paciente.
 */
import { demoData, derive, initialState, type Derived } from '../state/store';
import { hasDiabetes, isT1, usesGlp1, type AppState, type CheckIn, type Message, type Profile, type Scenario } from '../state/types';

const DAY = 86400e3;
const iso = (t: number) => new Date(t).toISOString();

type Seed = {
  id: string;
  name: string;
  age: number;
  profile: Profile;
  scenario: Scenario;
  quietDays?: number;
  lowMood?: boolean;
  msg?: string;
  strength?: number;
};

const SEEDS: Seed[] = [
  {
    id: 'p1',
    name: 'Carmen Ruiz Ortega',
    age: 54,
    profile: 'glp1',
    scenario: 'missedInjection',
    msg: 'Hola, esta semana se me pasó la inyección por un viaje. ¿Me la pongo hoy?',
  },
  { id: 'p2', name: 'Javier Molina Sáez', age: 37, profile: 't1', scenario: 'lowGlucose', msg: 'He tenido varias bajadas por la tarde después del pádel.' },
  { id: 'p3', name: 'Lucía Fernández Gil', age: 61, profile: 't2_glp1', scenario: 'sideEffects', lowMood: true },
  { id: 'p4', name: 'Antonio Navarro Paz', age: 66, profile: 't2', scenario: 'highGlucose', quietDays: 4 },
  { id: 'p5', name: 'Marta Iglesias Vela', age: 45, profile: 'glp1', scenario: 'plateau', msg: 'Llevo tres semanas sin bajar de peso, ¿es normal?' },
  { id: 'p6', name: 'Raúl Castillo Romero', age: 29, profile: 't1', scenario: 'normal', strength: 3 },
  { id: 'p7', name: 'Elena Prieto Campos', age: 58, profile: 'glp1', scenario: 'milestone' },
  { id: 'p8', name: 'Francisco León Duarte', age: 71, profile: 't2', scenario: 'normal' },
  {
    id: 'p9',
    name: 'Sofía Herrera Muñoz',
    age: 41,
    profile: 't2_glp1',
    scenario: 'normal',
    lowMood: true,
    msg: 'Estos días estoy muy desanimada con la comida.',
  },
  { id: 'p10', name: 'Diego Vargas Peña', age: 33, profile: 't1', scenario: 'highGlucose', quietDays: 2 },
  { id: 'p11', name: 'Pilar Domínguez Rey', age: 63, profile: 'glp1', scenario: 'injectionDay' },
  { id: 'p12', name: 'Andrés Serrano Luna', age: 49, profile: 't2', scenario: 'normal', strength: 2 },
];

/** Quita los registros de los últimos N días (paciente que no sincroniza). */
function quiet(s: AppState, days: number, now: number): AppState {
  const cut = now - days * DAY;
  const old = <T extends { at: string }>(xs: T[]) => xs.filter((x) => new Date(x.at).getTime() < cut);
  return {
    ...s,
    glucose: old(s.glucose),
    weights: old(s.weights),
    injections: old(s.injections),
    insulin: old(s.insulin),
    carbs: old(s.carbs),
    checkins: s.checkins.filter((c) => new Date(c.date).getTime() < cut),
    lastOpenAt: iso(cut),
  };
}

export type Patient = { id: string; name: string; age: number; isMe?: boolean };

export function buildCohort(now = Date.now()): { patients: Patient[]; states: Record<string, AppState> } {
  const states: Record<string, AppState> = {};
  const patients: Patient[] = [];
  SEEDS.forEach((p, i) => {
    let s: AppState = {
      ...initialState(),
      onboarded: true,
      userName: p.name.split(' ')[0],
      profile: p.profile,
      scenario: p.scenario,
      ...demoData(p.profile, p.scenario),
    };
    s.streakBefore = [4, 12, 2, 0, 21, 9, 33, 15, 3, 1, 7, 18][i];
    s.strength = s.strength.slice(0, p.strength ?? i % 3);
    if (p.lowMood) s.checkins = [3, 2, 2, 1].map((v, k) => ({ date: iso(now - (3 - k) * DAY).slice(0, 10), v: v as CheckIn['v'], tags: ['stress', 'tired'] }));
    if (p.msg) {
      const m: Message = { id: `pm${i}`, from: 'patient', kind: 'text', text: p.msg, at: iso(now - (i + 1) * 9 * 60e3), read: true };
      s.messages = [...s.messages, m];
    }
    // Variedad clínica entre pacientes (los datos de demo parten de la misma plantilla).
    const k = 0.75 + ((i * 37) % 50) / 100; // 0,75–1,24
    const base = s.weights[0]?.kg ?? 90;
    const target = [96, 88, 112, 84, 101, 70, 118, 79, 93, 66, 107, 90][i];
    s.weights = s.weights.map((w) => ({ ...w, kg: Math.round((target + (w.kg - base) * k) * 10) / 10 }));
    if (s.glucose.some((g) => g.context === 'sensor')) {
      s.glucose = s.glucose.map((g, j) => {
        const h = new Date(g.at).getHours();
        let v = 120 + (g.v - 120) * (p.scenario === 'highGlucose' ? 1.6 : k);
        if (p.scenario === 'highGlucose') v += 25;
        if (p.scenario === 'lowGlucose' && h >= 16 && h <= 18 && j % 3 !== 0) v -= 55;
        return { ...g, v: Math.round(Math.max(45, Math.min(380, v))) };
      });
    }
    if (p.quietDays) s = quiet(s, p.quietDays, now);
    states[p.id] = s;
    patients.push({ id: p.id, name: p.name, age: p.age });
  });
  return { patients, states };
}

export type Flag = { k: string; w: number; tone: 'high' | 'med' | 'info' };
export type Metrics = {
  d: Derived;
  priority: 'high' | 'med' | 'ok';
  score: number;
  flags: Flag[];
  lastDataDays: number;
  pendingMsgs: number;
  adherencePct: number | null; // GLP-1: semanas con inyección / semanas de tratamiento (máx. 12)
  tir14: number | null;
  tbr14: number | null; // tiempo < 70
  tar14: number | null; // tiempo > 180
  gmi: number | null; // indicador de gestión de glucosa (fórmula de Bergenstal)
  cv: number | null;
  avgFasting: number | null;
  weightDelta4w: number | null;
  moodAvg7: number | null;
};

export function metricsFor(s: AppState, now = Date.now()): Metrics {
  const d = derive(s, now);
  const times = [...s.glucose.map((g) => g.at), ...s.weights.map((w) => w.at), ...s.injections.map((x) => x.at), ...s.insulin.map((x) => x.at)].map((x) =>
    new Date(x).getTime(),
  );
  const lastData = times.length ? Math.max(...times) : 0;
  const lastDataDays = lastData ? Math.floor((now - lastData) / DAY) : 99;
  // Mensajes pendientes: los del paciente posteriores a la última respuesta del equipo.
  const lastTeam = Math.max(0, ...s.messages.filter((m) => m.from !== 'patient' && m.from !== 'owi').map((m) => new Date(m.at).getTime()));
  const pendingMsgs = s.messages.filter((m) => m.from === 'patient' && new Date(m.at).getTime() > lastTeam && m.text).length;

  let adherencePct: number | null = null;
  if (usesGlp1(s.profile) && s.glp1.status !== 'maintenance') {
    const weeks = Math.min(12, Math.max(1, Math.floor((now - new Date(s.glp1.startedAt).getTime()) / (7 * DAY))));
    const got = s.injections.filter((x) => now - new Date(x.at).getTime() < weeks * 7 * DAY + DAY).length;
    adherencePct = Math.min(100, Math.round((got / weeks) * 100));
  }
  const cgm = s.glucose.filter((g) => g.context === 'sensor' && now - new Date(g.at).getTime() < 14 * DAY);
  let tir14 = null,
    tbr14 = null,
    tar14 = null,
    gmi = null,
    cv = null;
  if (cgm.length > 20) {
    const pc = (f: (v: number) => boolean) => Math.round((cgm.filter((g) => f(g.v)).length / cgm.length) * 100);
    tir14 = pc((v) => v >= 70 && v <= 180);
    tbr14 = pc((v) => v < 70);
    tar14 = pc((v) => v > 180);
    const mean = cgm.reduce((a, g) => a + g.v, 0) / cgm.length;
    gmi = Math.round((3.31 + 0.02392 * mean) * 10) / 10;
    cv = Math.round((Math.sqrt(cgm.reduce((a, g) => a + (g.v - mean) ** 2, 0) / cgm.length) / mean) * 100);
  }
  const fasting = s.glucose.filter((g) => g.context === 'ayunas' && now - new Date(g.at).getTime() < 14 * DAY);
  const avgFasting = fasting.length ? Math.round(fasting.reduce((a, g) => a + g.v, 0) / fasting.length) : null;
  const ws = [...s.weights].sort((a, b) => a.at.localeCompare(b.at));
  const w4 = ws.filter((w) => now - new Date(w.at).getTime() < 29 * DAY);
  const weightDelta4w = w4.length >= 2 ? Math.round((w4[w4.length - 1].kg - w4[0].kg) * 10) / 10 : null;
  const ck = s.checkins.filter((c) => now - new Date(c.date).getTime() < 7 * DAY);
  const moodAvg7 = ck.length ? Math.round((ck.reduce((a, c) => a + c.v, 0) / ck.length) * 10) / 10 : null;

  const flags: Flag[] = [];
  if (d.injectionOverdue) flags.push({ k: 'missedInjection', w: 40, tone: 'high' });
  if (tbr14 !== null && tbr14 >= 4) flags.push({ k: 'lows', w: 40, tone: 'high' });
  if (d.glucoseStatus === 'veryLow' || d.glucoseStatus === 'low') flags.push({ k: 'lowNow', w: 25, tone: 'high' });
  if (tir14 !== null && tir14 < 70) flags.push({ k: 'tirLow', w: 20, tone: 'med' });
  if (hasDiabetes(s.profile) && !isT1(s.profile) && avgFasting !== null && avgFasting > s.goals.fastingRange[1])
    flags.push({ k: 'fastingHigh', w: 15, tone: 'med' });
  if (d.glucoseStatus === 'veryHigh' || d.glucoseStatus === 'high') flags.push({ k: 'highNow', w: 10, tone: 'med' });
  if (lastDataDays >= 3) flags.push({ k: 'noData', w: 26, tone: 'med' });
  if (d.worstSymptomToday >= 2) flags.push({ k: 'sideEffects', w: 28, tone: 'high' });
  if (d.lowMoodDays >= 2) flags.push({ k: 'mood', w: 22, tone: 'med' });
  if (d.plateau) flags.push({ k: 'plateau', w: 10, tone: 'info' });
  if (d.phaseChangeSoon) flags.push({ k: 'phase', w: 8, tone: 'info' });
  if (pendingMsgs) flags.push({ k: 'message', w: 12, tone: 'info' });
  if (d.lostPct >= 10) flags.push({ k: 'milestone', w: 2, tone: 'info' });
  const score = flags.reduce((a, f) => a + f.w, 0);
  const priority = score >= 40 ? 'high' : score >= 15 ? 'med' : 'ok';
  return { d, priority, score, flags, lastDataDays, pendingMsgs, adherencePct, tir14, tbr14, tar14, gmi, cv, avgFasting, weightDelta4w, moodAvg7 };
}

/** Perfil ambulatorio de glucosa (AGP): percentiles 5/25/50/75/95 por hora del día. */
export function agp(s: AppState, days = 14, now = Date.now()) {
  const byHour: number[][] = Array.from({ length: 24 }, () => []);
  s.glucose.filter((g) => g.context === 'sensor' && now - new Date(g.at).getTime() < days * DAY).forEach((g) => byHour[new Date(g.at).getHours()].push(g.v));
  const q = (xs: number[], p: number) => {
    if (!xs.length) return NaN;
    const a = [...xs].sort((x, y) => x - y);
    const i = (a.length - 1) * p;
    const lo = Math.floor(i);
    return a[lo] + (a[Math.min(a.length - 1, lo + 1)] - a[lo]) * (i - lo);
  };
  return byHour.map((xs, h) => ({ h, p5: q(xs, 0.05), p25: q(xs, 0.25), p50: q(xs, 0.5), p75: q(xs, 0.75), p95: q(xs, 0.95) }));
}
