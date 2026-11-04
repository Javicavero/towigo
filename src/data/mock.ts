/**
 * Datos simulados del prototipo. En la app real llegan del sensor
 * (vía Terra/Thryve o Dexcom) y de Apple Health / Health Connect.
 */
import { DEFAULT_TARGET } from '../config';
import type { Message, Scenario } from '../state/types';

export type Trend = 'up' | 'upFast' | 'flat' | 'down' | 'downFast';
/** t = timestamp ms, v = mg/dL, trend = flecha que da el propio sensor (si la hay). */
export type Reading = { t: number; v: number; trend?: Trend };

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const STEP_MIN = 15;

/** Curva de 24 h según el escenario de demostración. */
export function glucoseSeries(scenario: Scenario, now = Date.now()): Reading[] {
  const rnd = seeded(scenario.length * 97 + 13);
  const points = (24 * 60) / STEP_MIN;
  const out: Reading[] = [];
  for (let i = 0; i <= points; i++) {
    const hoursAgo = (points - i) * (STEP_MIN / 60);
    const hourOfDay = (new Date(now - hoursAgo * 3600e3).getHours() + 24) % 24;
    // Base: ligera variación + subidas tras las comidas (8h, 14h, 21h)
    let v = 118 + Math.sin(i / 7) * 12 + (rnd() - 0.5) * 10;
    for (const meal of [8, 14.5, 21.5]) {
      const d = hourOfDay - meal;
      if (d > 0 && d < 3) v += Math.sin((d / 3) * Math.PI) * (scenario === 'goal' ? 30 : 55);
    }
    if ((scenario === 'low' || scenario === 'urgentLow') && hourOfDay >= 3 && hourOfDay < 5) v -= 50; // hipo nocturna
    if (scenario === 'high' && hoursAgo < 2.5) v += (2.5 - hoursAgo) * 48;
    if (scenario === 'veryHigh' && hoursAgo < 3) v += (3 - hoursAgo) * 60;
    if (scenario === 'low' && hoursAgo < 1) v = 78 - (1 - hoursAgo) * 18;
    if (scenario === 'urgentLow' && hoursAgo < 1) v = 72 - (1 - hoursAgo) * 24;
    if (scenario === 'rising' && hoursAgo < 0.75) v = 118 + (0.75 - hoursAgo) * 64;
    if ((scenario === 'inRange' || scenario === 'night') && hoursAgo < 1) v = 128 + (rnd() - 0.5) * 6;
    out.push({ t: now - hoursAgo * 3600e3, v: Math.round(Math.max(45, Math.min(320, v))) });
  }
  if (scenario === 'syncError') {
    const cutoff = now - 2.6 * 3600e3;
    return out.filter((r) => r.t <= cutoff);
  }
  return out;
}

/** Tendencia calculada con las 3 últimas lecturas (si la fuente no la trae). */
export function trendOf(series: Reading[]): Trend {
  if (series.length < 3) return 'flat';
  const a = series[series.length - 3].v;
  const b = series[series.length - 1].v;
  const perMin = (b - a) / (STEP_MIN * 2);
  if (perMin > 2) return 'upFast';
  if (perMin > 1) return 'up';
  if (perMin < -2) return 'downFast';
  if (perMin < -1) return 'down';
  return 'flat';
}

export function timeInRange(series: Reading[], target = DEFAULT_TARGET) {
  if (!series.length) return { inRange: 0, low: 0, high: 0 };
  const n = series.length;
  const low = series.filter((r) => r.v < target.low).length / n;
  const high = series.filter((r) => r.v > target.high).length / n;
  return { inRange: Math.round((1 - low - high) * 100), low: Math.round(low * 100), high: Math.round(high * 100) };
}

/** Pasos de hoy (vendrían de Apple Health / Health Connect). */
export const STEPS_TODAY = 6240;
export const STEPS_GOAL = 6000;

export const TEAM = {
  // Nombres ficticios para el prototipo. fg = color de las iniciales (contraste ≥ 4,5:1).
  endo: { name: 'Dra. Lucía Martín', short: 'Lucía', initials: 'LM', color: '#2BB58A', fg: '#1E2A32' },
  nutri: { name: 'Carlos Ruiz', short: 'Carlos', initials: 'CR', color: '#FF7A59', fg: '#1E2A32' },
  psico: { name: 'Marta Gil', short: 'Marta', initials: 'MG', color: '#7B5EA7', fg: '#FFFFFF' },
} as const;

export function initialMessages(now = Date.now()): Message[] {
  const h = (n: number) => new Date(now - n * 3600e3).toISOString();
  return [
    { id: 'm1', from: 'endo', kind: 'audio', durationSec: 48, text: 'msg.endoWelcome', at: h(30), read: true },
    { id: 'm2', from: 'psico', kind: 'text', text: 'msg.psicoWelcome', at: h(26), read: true },
    { id: 'm3', from: 'nutri', kind: 'audio', durationSec: 35, text: 'msg.nutriAudio', at: h(2), read: false },
  ];
}
