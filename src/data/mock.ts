/**
 * Datos de demostración (simulados) para los tres caminos: tipo 2, GLP-1 y tipo 2 + GLP-1.
 * En la app real llegan del paciente, de su báscula / Apple Health y, si lo usa, de su sensor.
 */
import type { Cheer, CrewMember, CheckIn, CarbEntry, InsulinEntry, InsulinPlan, GlucoseEntry, Glp1Plan, Goals, Hba1cEntry, Injection, InjectionSite, Medication, Message, Profile, Scenario, SideEffectEntry, StrengthSession, WeightEntry } from '../state/types';

const DAY = 86400e3;
const iso = (t: number) => new Date(t).toISOString();
const seeded = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

/** Rotación de zonas de inyección (educación habitual: no repetir la misma zona seguida). */
export const SITE_ORDER: InjectionSite[] = ['abdIzq', 'abdDer', 'musloIzq', 'musloDer', 'brazoIzq', 'brazoDer'];

export const TEAM = {
  endo: { name: 'Dra. Lucía Martín', short: 'Lucía', initials: 'LM', color: '#2BB58A', fg: '#1E2A32' },
  nutri: { name: 'Carlos Ruiz', short: 'Carlos', initials: 'CR', color: '#FF7A59', fg: '#1E2A32' },
  psico: { name: 'Marta Gil', short: 'Marta', initials: 'MG', color: '#7B5EA7', fg: '#FFFFFF' },
} as const;

export const STEPS_TODAY = 6240;
export const STEPS_GOAL = 6000;

export function goalsFor(profile: Profile): Goals {
  return {
    weightKg: profile === 't1' ? 72 : profile === 't2' ? 82 : 88,
    proteinG: profile === 't1' ? 80 : profile === 't2' ? 80 : 100,
    waterGlasses: 8,
    fastingRange: [80, 130],
    postMealMax: 180,
    proteinPerKg: 1.2,
    strengthPerWeek: 2,
  };
}

export function glp1PlanFor(now = Date.now()): Glp1Plan {
  // Pauta de escalado de la Dra. (ejemplo): 4 semanas por fase hasta la dosis de mantenimiento.
  return {
    drug: 'semaglutida',
    titration: [
      { dose: 0.25, weeks: 4 },
      { dose: 0.5, weeks: 4 },
      { dose: 1, weeks: 4 },
      { dose: 1.7, weeks: 4 },
      { dose: 2.4, weeks: 0 },
    ],
    currentDose: 1,
    weekday: 6,
    time: '10:00',
    startedAt: iso(now - 80 * DAY),
  };
}

export function demoStrength(now = Date.now()): StrengthSession[] {
  return [
    { id: 'st1', at: iso(now - 9 * DAY), routine: 'base' },
    { id: 'st2', at: iso(now - 6 * DAY), routine: 'legs' },
    { id: 'st3', at: iso(now - 2 * DAY), routine: 'base' },
  ];
}

/** Fecha de la última vez que tocó el día de inyección (antes de hoy o hoy). */
function lastWeekday(now: number, weekday: number) {
  const d = new Date(now);
  const today = (d.getDay() + 6) % 7;
  const back = (today - weekday + 7) % 7;
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0).getTime() - back * DAY;
  return t;
}

export function demoInjections(scenario: Scenario, plan: Glp1Plan, now = Date.now()): Injection[] {
  // 12 semanas: 0,25 mg x4 → 0,5 mg x4 → 1 mg (lo que el paciente se puso, según su pauta médica).
  let last = lastWeekday(now, plan.weekday);
  if (last > now - 3600e3) last -= 7 * DAY; // la de hoy aún no
  const weeks = scenario === 'missedInjection' ? 10 : 11;
  const start = scenario === 'missedInjection' ? last - 7 * DAY : last;
  return Array.from({ length: weeks }, (_, i) => {
    const t = start - (weeks - 1 - i) * 7 * DAY;
    const dose = i < 4 ? 0.25 : i < 8 ? 0.5 : 1;
    return { id: `inj${i}`, at: iso(t), dose, site: SITE_ORDER[i % SITE_ORDER.length] };
  });
}

export function demoWeights(profile: Profile, scenario: Scenario, now = Date.now()): WeightEntry[] {
  const rnd = seeded(7);
  const start = profile === 't1' ? 73.6 : profile === 't2' ? 88.4 : 104.2;
  const lossPerWeek = profile === 't1' ? 0.05 : profile === 't2' ? 0.12 : 0.62;
  return Array.from({ length: 13 }, (_, i) => {
    const weeksAgo = 12 - i;
    let kg = start - lossPerWeek * i * (1 - i * 0.02) + (rnd() - 0.5) * 0.4;
    if (scenario === 'plateau' && i >= 9) kg = start - lossPerWeek * 9 * 0.82 + (rnd() - 0.5) * 0.3;
    if (scenario === 'milestone' && i === 12) kg = Math.min(kg, start - 10.05);
    const fat = (profile === 't1' ? 26 : profile === 't2' ? 33 : 41) - i * (profile === 't1' ? 0.03 : profile === 't2' ? 0.08 : 0.35);
    return { at: iso(now - weeksAgo * 7 * DAY), kg: Math.round(kg * 10) / 10, fatPct: Math.round(fat * 10) / 10, musclePct: Math.round((100 - fat) * 0.48 * 10) / 10 };
  });
}

export function demoGlucose(scenario: Scenario, now = Date.now()): GlucoseEntry[] {
  const rnd = seeded(3);
  const out: GlucoseEntry[] = [];
  for (let d = 13; d >= 0; d--) {
    const base = new Date(now - d * DAY);
    const at = (h: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, 15).getTime();
    out.push({ id: `g${d}a`, at: iso(at(8)), v: Math.round(112 + rnd() * 30 - d * 0.6), context: 'ayunas' });
    if (d % 2 === 0) out.push({ id: `g${d}b`, at: iso(at(16)), v: Math.round(138 + rnd() * 40), context: 'despuesComer' });
  }
  const last = out.filter((g) => new Date(g.at).getTime() <= now);
  if (scenario === 'highGlucose') last.push({ id: 'gx', at: iso(now - 20 * 60e3), v: 236, context: 'despuesComer' });
  if (scenario === 'lowGlucose') last.push({ id: 'gx', at: iso(now - 15 * 60e3), v: 64, context: 'antesComer' });
  return last;
}

// ---------- Tipo 1: sensor continuo, insulina y carbohidratos (simulados) ----------
const T1_MEALS = [
  { h: 8.5, g: 40, units: 4, label: 'desayuno' },
  { h: 14.5, g: 70, units: 6, label: 'comida' },
  { h: 21.5, g: 55, units: 5, label: 'cena' },
];

export function insulinPlanFor(): InsulinPlan {
  return { rapidName: 'Insulina rápida', basalName: 'Insulina lenta', basalTime: '22:00', basalUnits: 18 };
}

/** Lecturas del sensor cada 15 min durante 7 días, con subidas tras las comidas. */
export function demoCgm(scenario: Scenario, now = Date.now()): GlucoseEntry[] {
  const rnd = seeded(11);
  const out: GlucoseEntry[] = [];
  const start = now - 7 * DAY;
  let drift = 0;
  for (let t = start - (start % (15 * 60e3)); t <= now; t += 15 * 60e3) {
    const d = new Date(t);
    const h = d.getHours() + d.getMinutes() / 60;
    let v = 118 + Math.sin((h / 24) * Math.PI * 2) * 12;
    for (const m of T1_MEALS) {
      const dt = h - m.h;
      if (dt > 0 && dt < 4) v += m.g * 1.7 * Math.exp(-((dt - 1.1) ** 2) / 0.7);
    }
    drift = drift * 0.9 + (rnd() - 0.5) * 8;
    v += drift;
    const dayIdx = Math.floor((now - t) / DAY);
    if (dayIdx === 3 && h > 16.5 && h < 17.6) v = 62 + (rnd() - 0.5) * 6; // una bajada
    out.push({ id: `c${t}`, at: iso(t), v: Math.round(Math.max(48, Math.min(320, v))), context: 'sensor' });
  }
  if (scenario === 'highGlucose') out.push({ id: 'cx', at: iso(now - 5 * 60e3), v: 248, context: 'sensor' });
  if (scenario === 'lowGlucose') out.push({ id: 'cx', at: iso(now - 5 * 60e3), v: 63, context: 'sensor' });
  return out;
}

export function demoInsulin(now = Date.now()): InsulinEntry[] {
  const out: InsulinEntry[] = [];
  for (let d = 6; d >= 0; d--) {
    const base = new Date(now - d * DAY);
    const at = (h: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(h), Math.round((h % 1) * 60)).getTime();
    for (const m of T1_MEALS) if (at(m.h) - 10 * 60e3 < now) out.push({ id: `r${d}${m.h}`, at: iso(at(m.h) - 10 * 60e3), units: m.units + (d % 3 === 0 ? 1 : 0), kind: 'rapid' });
    if (at(22) < now) out.push({ id: `b${d}`, at: iso(at(22)), units: 18, kind: 'basal' });
  }
  return out;
}

export function demoCarbs(now = Date.now()): CarbEntry[] {
  const out: CarbEntry[] = [];
  for (let d = 6; d >= 0; d--) {
    const base = new Date(now - d * DAY);
    for (const m of T1_MEALS) {
      const t = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(m.h), Math.round((m.h % 1) * 60)).getTime();
      if (t < now) out.push({ id: `k${d}${m.h}`, at: iso(t), g: m.g + (d % 2 ? 5 : 0), label: m.label });
    }
  }
  return out;
}

export function demoCrew(): CrewMember[] {
  return [{ id: 'ana', name: 'Ana', relation: 'pareja', perms: { summary: true, logForMe: true, sos: true }, status: 'active', code: 'ANA123' }];
}

export function demoCheers(now = Date.now()): Cheer[] {
  return [{ id: 'ch1', from: 'ana', text: '¡Vamos, que esta semana lo estás haciendo genial! Esta noche cocino yo algo rico con mucha proteína.', at: iso(now - 3 * 3600e3), read: false }];
}

export function demoCheckins(now = Date.now()): CheckIn[] {
  const vals: CheckIn['v'][] = [4, 3, 4, 2, 3, 4];
  return vals.map((v, i) => ({ date: iso(now - (vals.length - i) * DAY).slice(0, 10), v, tags: v <= 2 ? ['cansancio'] : ['familia'] }));
}

export function demoHba1c(now = Date.now()): Hba1cEntry[] {
  return [
    { at: iso(now - 180 * DAY), v: 7.8 },
    { at: iso(now - 90 * DAY), v: 7.3 },
    { at: iso(now - 5 * DAY), v: 6.9 },
  ];
}

export function demoMeds(profile: Profile): Medication[] {
  if (profile === 'glp1' || profile === 't1') return [];
  return [
    { id: 'metformina', name: 'Metformina', dose: '850 mg', times: ['08:30', '21:00'] },
    { id: 'empagliflozina', name: 'Empagliflozina', dose: '10 mg', times: ['08:30'] },
  ];
}

export function demoSideEffects(scenario: Scenario, now = Date.now()): SideEffectEntry[] {
  const list: SideEffectEntry[] = [
    { id: 's1', at: iso(now - 6 * DAY), symptoms: [{ id: 'nausea', level: 1 }] },
    { id: 's2', at: iso(now - 13 * DAY), symptoms: [{ id: 'estrenimiento', level: 2 }, { id: 'pocoApetito', level: 1 }] },
  ];
  if (scenario === 'sideEffects') list.unshift({ id: 's0', at: iso(now - 2 * 3600e3), symptoms: [{ id: 'nausea', level: 2 }, { id: 'pocoApetito', level: 2 }] });
  return list;
}

export function initialMessages(profile: Profile, now = Date.now()): Message[] {
  const h = (n: number) => new Date(now - n * 3600e3).toISOString();
  return [
    { id: 'm1', from: 'endo', kind: 'audio', durationSec: 48, text: profile === 't1' ? 'msg.endoT1' : profile === 't2' ? 'msg.endoT2' : 'msg.endoGlp1', at: h(30), read: true },
    { id: 'm2', from: 'psico', kind: 'text', text: 'msg.psicoWelcome', at: h(26), read: true },
    { id: 'm3', from: 'nutri', kind: 'audio', durationSec: 35, text: profile === 't1' ? 'msg.nutriT1' : profile === 't2' ? 'msg.nutriT2' : 'msg.nutriGlp1', at: h(2), read: false },
  ];
}
