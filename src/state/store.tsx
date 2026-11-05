import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { DEFAULT_AVATAR_NAME } from '../config';
import { ACCESSORIES, type AccessoryId } from '../data/avatarOptions';
import {
  demoCarbs,
  demoCheckins,
  demoCheers,
  demoCrew,
  demoCgm,
  demoGlucose,
  demoInsulin,
  demoHba1c,
  demoInjections,
  demoMeds,
  demoSideEffects,
  demoStrength,
  demoWeights,
  glp1PlanFor,
  goalsFor,
  initialMessages,
  insulinPlanFor,
  SITE_ORDER,
  STEPS_GOAL,
  STEPS_TODAY,
} from '../data/mock';
import { defaultPlan, dueReminders } from '../data/reminders';
import { clear, load, save } from './storage';
import {
  hasDiabetes,
  isT1,
  type InsulinKind,
  usesGlp1,
  type AppState,
  type Avatar,
  type CheckIn,
  type CrewPerms,
  type CrewRelation,
  type Consents,
  type TeamRole,
  type GlucoseContext,
  type GlucoseEntry,
  type Glp1Plan,
  type HabitId,
  type InjectionSite,
  type Medication,
  type Message,
  type PetLevel,
  type PetMood,
  type Plan,
  type Profile,
  type Reminder,
  type ReminderKind,
  type Scenario,
  type SensorId,
  type SideEffectEntry,
  type TitrationStep,
  type TextScale,
  type WeightEntry,
} from './types';

const uid = () => Math.random().toString(36).slice(2, 10);
const DAY = 86400e3;
const dayKey = (t: number | string | Date) => new Date(t).toISOString().slice(0, 10);

export const defaultAvatar: Avatar = {
  skin: 1,
  bodyType: 'media',
  faceShape: 'ovalada',
  eyeColor: 1,
  brows: 'normales',
  hair: 'corto',
  hairColor: 1,
  facialHair: 'ninguno',
  glasses: 'ninguna',
  top: 'sudadera',
  topColor: 0,
  equipped: { headband: true, medal: true },
};

/** Vínculo con Owi: sube con hábitos e interacciones; marca su evolución. */
/** Hitos del programa de constancia (semanas de tratamiento). */
export const MILESTONES = [4, 12, 26, 52];

export const PET_LEVEL_AT: Record<PetLevel, number> = { 1: 0, 2: 40, 3: 120, 4: 300 };

export function demoData(profile: Profile, scenario: Scenario) {
  const glp1 = glp1PlanFor();
  return {
    goals: goalsFor(profile),
    glp1,
    injections: usesGlp1(profile) ? demoInjections(scenario, glp1) : [],
    weights: demoWeights(profile, scenario),
    glucose: isT1(profile) ? demoCgm(scenario) : hasDiabetes(profile) ? demoGlucose(scenario) : [],
    insulin: isT1(profile) ? demoInsulin() : [],
    carbs: isT1(profile) ? demoCarbs() : [],
    hba1c: hasDiabetes(profile) ? demoHba1c() : [],
    meds: demoMeds(profile),
    sideEffects: usesGlp1(profile) ? demoSideEffects(scenario) : [],
    strength: demoStrength(),
  };
}

export function initialState(): AppState {
  const profile: Profile = 'glp1';
  return {
    onboarded: false,
    userName: '',
    profile,
    avatar: defaultAvatar,
    pet: { name: DEFAULT_AVATAR_NAME },
    consents: { healthData: false, careTeam: false, productAnalytics: false },
    sensor: 'none',
    textScale: 1.2,
    scenario: 'normal',
    ...demoData(profile, 'normal'),
    medsTaken: {},
    intake: [],
    insulinPlan: insulinPlanFor(),
    supportAskedOn: null,
    owiChat: [],
    consultQuestions: [],
    checkins: demoCheckins(),
    crew: demoCrew(),
    cheers: demoCheers(),
    messages: initialMessages(profile),
    habitsToday: { log: false, walk: STEPS_TODAY >= STEPS_GOAL, listen: false },
    logsToday: 0,
    streakBefore: 4,
    freezes: 2,
    freezeActiveToday: false,
    plan: defaultPlan(),
    remindersDone: {},
    remindersDoneCount: 0,
    snoozedUntil: {},
    demoReminder: null,
    lastOpenAt: null,
    previousOpenAt: null,
    dataSource: 'demo',
    dexcom: { connected: false, readings: [], lastSyncAt: null, error: null },
  };
}

export type Action =
  | { type: 'setName'; name: string }
  | { type: 'setProfile'; profile: Profile }
  | { type: 'setAvatar'; patch: Partial<Avatar> }
  | { type: 'toggleAccessory'; id: AccessoryId }
  | { type: 'setPetName'; name: string }
  | { type: 'opened' }
  | { type: 'setConsents'; consents: Consents }
  | { type: 'setSensor'; sensor: SensorId }
  | { type: 'finishOnboarding' }
  | { type: 'setTextScale'; scale: TextScale }
  | { type: 'setScenario'; scenario: Scenario }
  | { type: 'setGlp1'; patch: Partial<Glp1Plan> }
  | { type: 'addInjection'; dose: number; site: InjectionSite }
  | { type: 'addWeight'; entry: Omit<WeightEntry, 'at'> }
  | { type: 'addGlucose'; v: number; context: GlucoseContext }
  | { type: 'takeMed'; medId: string; time: string }
  | { type: 'addSideEffect'; symptoms: SideEffectEntry['symptoms'] }
  | { type: 'addIntake'; protein?: number; water?: number }
  | { type: 'addStrength'; routine: string }
  | { type: 'setInsulinPlan'; patch: Partial<AppState['insulinPlan']> }
  | { type: 'addInsulin'; units: number; kind: InsulinKind; minutesAgo?: number }
  | { type: 'addCarbs'; g: number; protein?: number; label?: string; photo?: boolean; minutesAgo?: number }
  | { type: 'setTitration'; steps: TitrationStep[]; startedAt?: string }
  | { type: 'askTeam'; text: string }
  | { type: 'dismissSupport' }
  | { type: 'teamMessage'; from: TeamRole; text: string; kind?: 'text' | 'audio'; durationSec?: number }
  | { type: 'setGoals'; patch: Partial<AppState['goals']> }
  | { type: 'crewInvite'; name: string; relation: CrewRelation }
  | { type: 'crewPerms'; id: string; perms: Partial<CrewPerms> }
  | { type: 'crewRemove'; id: string }
  | { type: 'cheerRead'; id: string }
  | { type: 'chat'; from: 'me' | 'owi'; text: string }
  | { type: 'saveQuestions'; questions: string[] }
  | { type: 'checkin'; v: CheckIn['v']; tags: string[]; note?: string; share?: boolean }
  | { type: 'sendMessage'; text?: string; kind: 'text' | 'audio'; durationSec?: number }
  | { type: 'owiReply'; text: string }
  | { type: 'listened'; id: string }
  | { type: 'useFreeze' }
  | { type: 'setPlan'; patch: Partial<Plan> }
  | { type: 'reminderDone'; id: string; kind: ReminderKind }
  | { type: 'snooze'; id: string; minutes: number }
  | { type: 'setDemoReminder'; kind: ReminderKind | null }
  | { type: 'setDataSource'; source: AppState['dataSource'] }
  | { type: 'dexcom'; patch: Partial<AppState['dexcom']> }
  | { type: 'reset' };

/** Cualquier registro cuenta como hábito del día. */
const logged = (s: AppState): Partial<AppState> => ({ habitsToday: { ...s.habitsToday, log: true }, logsToday: s.logsToday + 1 });

export function reducer(s: AppState, a: Action): AppState {
  const now = new Date().toISOString();
  switch (a.type) {
    case 'setName':
      return { ...s, userName: a.name };
    case 'setProfile':
      return { ...s, profile: a.profile, ...demoData(a.profile, s.scenario), messages: initialMessages(a.profile) };
    case 'setAvatar':
      return { ...s, avatar: { ...s.avatar, ...a.patch } };
    case 'toggleAccessory':
      return { ...s, avatar: { ...s.avatar, equipped: { ...s.avatar.equipped, [a.id]: !s.avatar.equipped[a.id] } } };
    case 'setPetName':
      return { ...s, pet: { ...s.pet, name: a.name } };
    case 'opened':
      return { ...s, previousOpenAt: s.lastOpenAt, lastOpenAt: now };
    case 'setConsents':
      return { ...s, consents: a.consents };
    case 'setSensor':
      return { ...s, sensor: a.sensor };
    case 'finishOnboarding':
      return { ...s, onboarded: true };
    case 'setTextScale':
      return { ...s, textScale: a.scale };
    case 'setScenario':
      // Prototipo: el escenario regenera los datos de demostración.
      return { ...s, scenario: a.scenario, demoReminder: null, ...demoData(s.profile, a.scenario) };
    case 'setGlp1':
      return { ...s, glp1: { ...s.glp1, ...a.patch } };
    case 'addInjection':
      return { ...s, ...logged(s), injections: [...s.injections, { id: uid(), at: now, dose: a.dose, site: a.site }] };
    case 'addWeight':
      return { ...s, ...logged(s), weights: [...s.weights, { ...a.entry, at: now }] };
    case 'addGlucose':
      return { ...s, ...logged(s), glucose: [...s.glucose, { id: uid(), at: now, v: a.v, context: a.context }] };
    case 'takeMed': {
      const k = `${dayKey(Date.now())}|${a.medId}|${a.time}`;
      return { ...s, ...logged(s), medsTaken: { ...s.medsTaken, [k]: !s.medsTaken[k] } };
    }
    case 'addSideEffect':
      return { ...s, ...logged(s), sideEffects: [{ id: uid(), at: now, symptoms: a.symptoms }, ...s.sideEffects] };
    case 'addIntake': {
      const today = dayKey(Date.now());
      const cur = s.intake.find((i) => i.date === today) ?? { date: today, protein: 0, water: 0 };
      const next = { ...cur, protein: Math.max(0, cur.protein + (a.protein ?? 0)), water: Math.max(0, cur.water + (a.water ?? 0)) };
      return { ...s, ...logged(s), intake: [...s.intake.filter((i) => i.date !== today), next] };
    }
    case 'addInsulin': {
      const at = new Date(Date.now() - (a.minutesAgo ?? 0) * 60e3).toISOString();
      return { ...s, ...logged(s), insulin: [...s.insulin, { id: uid(), at, units: a.units, kind: a.kind }] };
    }
    case 'addCarbs': {
      const at = new Date(Date.now() - (a.minutesAgo ?? 0) * 60e3).toISOString();
      const today = dayKey(Date.now());
      const cur = s.intake.find((i) => i.date === today) ?? { date: today, protein: 0, water: 0 };
      const intake = a.protein ? [...s.intake.filter((i) => i.date !== today), { ...cur, protein: cur.protein + a.protein }] : s.intake;
      return { ...s, ...logged(s), intake, carbs: [...s.carbs, { id: uid(), at, g: a.g, protein: a.protein, label: a.label, photo: a.photo }] };
    }
    case 'setInsulinPlan':
      return { ...s, insulinPlan: { ...s.insulinPlan, ...a.patch } };
    case 'addStrength':
      return { ...s, ...logged(s), habitsToday: { ...s.habitsToday, log: true, walk: true }, strength: [...s.strength, { id: uid(), at: now, routine: a.routine }] };
    case 'setTitration':
      return { ...s, glp1: { ...s.glp1, titration: a.steps, startedAt: a.startedAt ?? s.glp1.startedAt } };
    case 'askTeam': {
      const m: Message = { id: uid(), from: 'patient', kind: 'text', text: a.text, at: now, read: true };
      return { ...s, supportAskedOn: dayKey(Date.now()), messages: [...s.messages, m] };
    }
    case 'chat':
      return { ...s, owiChat: [...s.owiChat, { id: uid(), from: a.from, text: a.text, at: now }].slice(-80) };
    case 'saveQuestions':
      return { ...s, consultQuestions: Array.from(new Set([...s.consultQuestions, ...a.questions])) };
    case 'checkin': {
      const date = dayKey(Date.now());
      const entry: CheckIn = { date, v: a.v, tags: a.tags, note: a.note, shared: a.share };
      return { ...s, ...logged(s), checkins: [...s.checkins.filter((c) => c.date !== date), entry] };
    }
    case 'crewInvite': {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      return { ...s, crew: [...s.crew, { id: uid(), name: a.name, relation: a.relation, perms: { summary: true, logForMe: false, sos: true }, status: 'invited', code }] };
    }
    case 'crewPerms':
      return { ...s, crew: s.crew.map((c) => (c.id === a.id ? { ...c, perms: { ...c.perms, ...a.perms } } : c)) };
    case 'crewRemove':
      return { ...s, crew: s.crew.filter((c) => c.id !== a.id) };
    case 'cheerRead':
      return { ...s, cheers: s.cheers.map((c) => (c.id === a.id ? { ...c, read: true } : c)) };
    case 'teamMessage':
      return { ...s, messages: [...s.messages, { id: uid(), from: a.from, kind: a.kind ?? 'text', text: a.text, durationSec: a.durationSec, at: now, read: false }] };
    case 'setGoals':
      return { ...s, goals: { ...s.goals, ...a.patch } };
    case 'dismissSupport':
      return { ...s, supportAskedOn: dayKey(Date.now()) };
    case 'sendMessage': {
      const m: Message = { id: uid(), from: 'patient', kind: a.kind, text: a.text, durationSec: a.durationSec, at: now, read: true };
      return { ...s, messages: [...s.messages, m] };
    }
    case 'owiReply':
      return { ...s, messages: [...s.messages, { id: uid(), from: 'owi', kind: 'text', text: a.text, at: now, read: true }] };
    case 'listened':
      return { ...s, messages: s.messages.map((m) => (m.id === a.id ? { ...m, read: true } : m)), habitsToday: { ...s.habitsToday, listen: true } };
    case 'useFreeze':
      if (s.freezes <= 0 || s.freezeActiveToday) return s;
      return { ...s, freezes: s.freezes - 1, freezeActiveToday: true };
    case 'setPlan':
      return { ...s, plan: { ...s.plan, ...a.patch } };
    case 'reminderDone':
      return {
        ...s,
        remindersDone: { ...s.remindersDone, [a.id]: new Date().toDateString() },
        remindersDoneCount: s.remindersDoneCount + 1,
        demoReminder: null,
        habitsToday: a.kind === 'sport' ? { ...s.habitsToday, walk: true } : s.habitsToday,
      };
    case 'snooze':
      return { ...s, snoozedUntil: { ...s.snoozedUntil, [a.id]: Date.now() + a.minutes * 60000 }, demoReminder: null };
    case 'setDemoReminder':
      return { ...s, demoReminder: a.kind, remindersDone: {}, snoozedUntil: {} };
    case 'setDataSource':
      return { ...s, dataSource: a.source };
    case 'dexcom':
      return { ...s, dexcom: { ...s.dexcom, ...a.patch } };
    case 'reset':
      clear();
      return initialState();
  }
}

export type MedSlot = { med: Medication; time: string; taken: boolean };

export type Derived = {
  // GLP-1
  lastInjection: AppState['injections'][number] | null;
  nextInjectionAt: number | null;
  daysToInjection: number | null;
  injectedToday: boolean;
  injectionOverdue: boolean;
  suggestedSite: InjectionSite;
  injectionWeeks: number;
  /** Pauta del médico: fase actual, dosis pautada y próxima fase (solo se muestra). */
  phaseIndex: number;
  prescribedDose: number;
  phaseWeek: number;
  phaseWeeks: number;
  nextPhase: { dose: number; at: number } | null;
  phaseChangeSoon: boolean;
  // Mantenimiento tras el GLP-1
  maintenance: boolean;
  maintWeeks: number;
  maintDeltaKg: number | null;
  // Constancia
  treatmentStart: number;
  treatmentWeek: number;
  nextMilestone: number | null;
  supportReason: 'missedInjection' | 'plateau' | 'sideEffects' | 'mood' | 'away' | null;
  checkinToday: CheckIn | null;
  lowMoodDays: number;
  // Fuerza
  strengthThisWeek: number;
  // Peso
  weightNow: number | null;
  weightStart: number | null;
  lostKg: number;
  lostPct: number;
  plateau: boolean;
  toGoalKg: number | null;
  musclePct: number | null;
  fatPct: number | null;
  // Tipo 2
  lastGlucose: GlucoseEntry | null;
  glucoseStatus: 'none' | 'veryLow' | 'low' | 'in' | 'high' | 'veryHigh';
  glucoseInTargetPct: number;
  hba1cNow: number | null;
  hba1cPrev: number | null;
  medsToday: MedSlot[];
  // Tipo 1
  tir24: number;
  avg24: number | null;
  lows24: number;
  basalToday: boolean;
  rapidTodayU: number;
  carbsToday: number;
  lastInsulin: AppState['insulin'][number] | null;
  trend: 'up2' | 'up' | 'flat' | 'down' | 'down2' | null;
  // Efectos e ingesta
  sideEffectsToday: SideEffectEntry[];
  worstSymptomToday: 0 | 1 | 2 | 3;
  proteinToday: number;
  waterToday: number;
  // Hábitos y Owi
  reminders: Reminder[];
  isNight: boolean;
  petMood: PetMood;
  streak: number;
  streakBefore: number;
  habitsToday: Record<HabitId, boolean>;
  todayDone: boolean;
  unlocked: Record<AccessoryId, boolean>;
  unreadCount: number;
  owiAvatar: Avatar;
  bond: number;
  petLevel: PetLevel;
  petProgress: number;
  daysAway: number;
  syncOk: boolean;
};

/** Datos derivados (puros): se usan en la app del paciente y en el panel profesional para cada paciente. */
export function derive(state: AppState, now: number): Derived {
  const today = dayKey(now);
  const maintenance = usesGlp1(state.profile) && state.glp1.status === 'maintenance';
  // En mantenimiento ya no hay inyecciones semanales: se apagan recordatorios, pauta y avisos de inyección.
  const glp1 = usesGlp1(state.profile) && !maintenance;
  const t2 = hasDiabetes(state.profile);

  // ---- GLP-1 ----
  const inj = [...state.injections].sort((a, b) => a.at.localeCompare(b.at));
  const lastInjection = inj.length ? inj[inj.length - 1] : null;
  const injectedToday = !!lastInjection && dayKey(lastInjection.at) === today;
  let nextInjectionAt: number | null = null;
  if (glp1) {
    const base = new Date(now);
    const wd = (base.getDay() + 6) % 7;
    const [hh, mm] = state.glp1.time.split(':').map(Number);
    let ahead = (state.glp1.weekday - wd + 7) % 7;
    if (ahead === 0 && injectedToday) ahead = 7;
    nextInjectionAt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + ahead, hh, mm).getTime();
  }
  const daysToInjection = nextInjectionAt !== null ? Math.round((new Date(nextInjectionAt).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / DAY) : null;
  const injectionOverdue = glp1 && !!lastInjection && now - new Date(lastInjection.at).getTime() > 8 * DAY;
  const lastIdx = lastInjection ? SITE_ORDER.indexOf(lastInjection.site) : -1;
  const suggestedSite = SITE_ORDER[(lastIdx + 1) % SITE_ORDER.length];
  let injectionWeeks = 0;
  for (let i = inj.length - 1; i > 0; i--) {
    const gap = new Date(inj[i].at).getTime() - new Date(inj[i - 1].at).getTime();
    if (gap <= 8.5 * DAY) injectionWeeks++;
    else break;
  }
  if (inj.length) injectionWeeks++;
  if (injectionOverdue) injectionWeeks = 0;

  // ---- Pauta de escalado (la fija el médico) ----
  const steps = state.glp1.titration?.length ? state.glp1.titration : [{ dose: state.glp1.currentDose, weeks: 0 }];
  const startT = new Date(state.glp1.startedAt).getTime();
  const weeksOn = Math.max(0, Math.floor((now - startT) / (7 * DAY)));
  let phaseIndex = steps.length - 1;
  let acc = 0;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].weeks === 0 || weeksOn < acc + steps[i].weeks) {
      phaseIndex = i;
      break;
    }
    acc += steps[i].weeks;
  }
  const phase = steps[phaseIndex];
  const phaseWeek = weeksOn - acc + 1;
  // La nueva fase empieza el primer día de inyección a partir del fin de la fase actual.
  let nextPhaseAt = startT + (acc + phase.weeks) * 7 * DAY;
  while ((new Date(nextPhaseAt).getDay() + 6) % 7 !== state.glp1.weekday) nextPhaseAt += DAY;
  const nextPhase = glp1 && phase.weeks > 0 && phaseIndex < steps.length - 1 ? { dose: steps[phaseIndex + 1].dose, at: nextPhaseAt } : null;
  const phaseChangeSoon = !!nextPhase && nextPhase.at - now < 7 * DAY;

  // ---- Constancia: semanas desde el inicio del tratamiento ----
  const firstWeight = state.weights.length ? Math.min(...state.weights.map((w) => new Date(w.at).getTime())) : now;
  const treatmentStart = maintenance && state.glp1.maintenanceSince ? new Date(state.glp1.maintenanceSince).getTime() : glp1 ? startT : firstWeight;
  const treatmentWeek = Math.max(1, Math.floor((now - treatmentStart) / (7 * DAY)) + 1);
  const nextMilestone = MILESTONES.find((m) => m >= treatmentWeek) ?? null;

  // ---- Fuerza ----
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const strengthThisWeek = state.strength.filter((x) => new Date(x.at).getTime() >= monday.getTime()).length;

  // ---- Peso ----
  const ws = [...state.weights].sort((a, b) => a.at.localeCompare(b.at));
  const weightNow = ws.length ? ws[ws.length - 1].kg : null;
  const weightStart = ws.length ? ws[0].kg : null;
  const lostKg = weightNow !== null && weightStart !== null ? Math.round((weightStart - weightNow) * 10) / 10 : 0;
  const lostPct = weightStart ? Math.round((lostKg / weightStart) * 1000) / 10 : 0;
  const recent = ws.filter((w) => now - new Date(w.at).getTime() < 22 * DAY);
  const plateau = glp1 && recent.length >= 3 && Math.abs(recent[0].kg - recent[recent.length - 1].kg) < 0.5;
  const toGoalKg = weightNow !== null ? Math.round((weightNow - state.goals.weightKg) * 10) / 10 : null;
  const lastComp = [...ws].reverse().find((w) => w.musclePct);

  // ---- Tipo 2 ----
  const gl = [...state.glucose].sort((a, b) => a.at.localeCompare(b.at));
  const lastGlucose = t2 && gl.length ? gl[gl.length - 1] : null;
  const fresh = !!lastGlucose && now - new Date(lastGlucose.at).getTime() < 3 * 3600e3;
  const v = lastGlucose?.v ?? 0;
  const glucoseStatus: Derived['glucoseStatus'] = !lastGlucose
    ? 'none'
    : v < 54
      ? 'veryLow'
      : v < 70
        ? 'low'
        : v > 250
          ? 'veryHigh'
          : v > (lastGlucose.context === 'ayunas' ? state.goals.fastingRange[1] : state.goals.postMealMax)
            ? 'high'
            : 'in';
  const last14 = gl.filter((g) => now - new Date(g.at).getTime() < 14 * DAY);
  const okCount = last14.filter((g) => (g.context === 'ayunas' ? g.v >= state.goals.fastingRange[0] && g.v <= state.goals.fastingRange[1] : g.v >= 70 && g.v <= state.goals.postMealMax)).length;
  const glucoseInTargetPct = last14.length ? Math.round((okCount / last14.length) * 100) : 0;
  const hb = [...state.hba1c].sort((a, b) => a.at.localeCompare(b.at));
  const medsToday: MedSlot[] = t2
    ? state.meds.flatMap((m) => m.times.map((time) => ({ med: m, time, taken: !!state.medsTaken[`${today}|${m.id}|${time}`] })))
    : [];

  // ---- Tipo 1 ----
  const last24 = gl.filter((g) => g.context === 'sensor' && now - new Date(g.at).getTime() < DAY);
  const tir24 = last24.length ? Math.round((last24.filter((g) => g.v >= 70 && g.v <= 180).length / last24.length) * 100) : 0;
  const avg24 = last24.length ? Math.round(last24.reduce((x, g) => x + g.v, 0) / last24.length) : null;
  const lows24 = last24.filter((g, i) => g.v < 70 && (i === 0 || last24[i - 1].v >= 70)).length;
  const insToday = state.insulin.filter((x) => dayKey(x.at) === today);
  const basalToday = insToday.some((x) => x.kind === 'basal');
  const rapidTodayU = insToday.filter((x) => x.kind === 'rapid').reduce((x, i) => x + i.units, 0);
  const carbsToday = state.carbs.filter((x) => dayKey(x.at) === today).reduce((x, c) => x + c.g, 0);
  const ins = [...state.insulin].sort((a, b) => a.at.localeCompare(b.at));
  let trend: Derived['trend'] = null;
  if (lastGlucose?.context === 'sensor' && gl.length > 1) {
    const prev = gl[gl.length - 2];
    const mins = Math.max(5, (new Date(lastGlucose.at).getTime() - new Date(prev.at).getTime()) / 60e3);
    const rate = (lastGlucose.v - prev.v) / mins; // mg/dL por minuto
    trend = rate > 2 ? 'up2' : rate > 1 ? 'up' : rate < -2 ? 'down2' : rate < -1 ? 'down' : 'flat';
  }

  // ---- Efectos e ingesta ----
  const sideEffectsToday = state.sideEffects.filter((s) => dayKey(s.at) === today);
  const worstSymptomToday = sideEffectsToday.reduce<number>((m, e) => Math.max(m, ...e.symptoms.map((x) => x.level)), 0) as 0 | 1 | 2 | 3;
  const intake = state.intake.find((i) => i.date === today);

  // ---- Avisos ----
  const lowNow = fresh && v < 70;
  const reminders = dueReminders(
    { profile: state.profile, plan: state.plan, glp1: state.glp1, meds: state.meds, injectedToday, medsTaken: state.medsTaken, insulinPlan: state.insulinPlan, basalToday },
    new Date(now),
    state.remindersDone,
    { lowGlucose: lowNow, demo: state.demoReminder },
  ).filter((r) => !(state.snoozedUntil[r.id] > now));

  // ---- Hábitos ----
  const habitsToday = state.habitsToday;
  const todayDone = Object.values(habitsToday).some(Boolean) || state.freezeActiveToday;
  const streakBefore = state.scenario === 'milestone' ? Math.max(6, state.streakBefore) : state.streakBefore;
  const streak = streakBefore + (todayDone ? 1 : 0);
  const unlocked = Object.fromEntries(ACCESSORIES.map((a) => [a.id, streak >= a.unlockDays])) as Record<AccessoryId, boolean>;
  const listened = state.messages.filter((m) => m.read && m.kind === 'audio' && m.from !== 'patient').length;
  const sent = state.messages.filter((m) => m.from === 'patient').length;
  const bond = streak * 10 + state.logsToday * 4 + injectionWeeks * 2 + listened * 5 + sent * 3 + state.remindersDoneCount * 3 + state.strength.length * 4 + (state.scenario === 'milestone' ? 120 : 0);
  const petLevel = ([4, 3, 2, 1] as PetLevel[]).find((l) => bond >= PET_LEVEL_AT[l]) ?? 1;
  const nextAt = petLevel < 4 ? PET_LEVEL_AT[(petLevel + 1) as PetLevel] : PET_LEVEL_AT[4];
  const petProgress = petLevel < 4 ? (bond - PET_LEVEL_AT[petLevel]) / (nextAt - PET_LEVEL_AT[petLevel]) : 1;
  const daysAway = state.previousOpenAt ? Math.floor((now - new Date(state.previousOpenAt).getTime()) / DAY) : 0;
  const hour = new Date(now).getHours();
  const isNight = state.scenario === 'night' || hour < 7;
  const syncOk = !(state.dataSource === 'dexcom' && state.dexcom.error);

  // ---- Momentos en los que ayuda hablar con el equipo (avisa a una persona; no es una indicación clínica) ----
  // Ánimo: días seguidos (hasta hoy) con un check-in bajo (1–2).
  const ck = [...state.checkins].sort((a, b) => b.date.localeCompare(a.date));
  let lowMoodDays = 0;
  for (const c of ck) {
    if (c.v <= 2) lowMoodDays++;
    else break;
  }
  const checkinToday = state.checkins.find((c) => c.date === today) ?? null;
  const supportReason: Derived['supportReason'] =
    state.supportAskedOn === today
      ? null
      : injectionOverdue
        ? 'missedInjection'
        : worstSymptomToday >= 2
          ? 'sideEffects'
          : lowMoodDays >= 2
            ? 'mood'
            : plateau
              ? 'plateau'
              : daysAway >= 3
                ? 'away'
                : null;

  // ---- Emoción de Owi (por prioridad). Acompaña; nunca regaña ni da indicaciones clínicas. ----
  let petMood: PetMood = 'happy';
  if (!syncOk) petMood = 'confused';
  else if (fresh && glucoseStatus === 'veryLow') petMood = 'worriedLow';
  else if (fresh && glucoseStatus === 'low') petMood = 'caringLow';
  else if (fresh && glucoseStatus === 'veryHigh') petMood = 'worriedHigh';
  // En tipo 1 las subidas tras comer son habituales: Owi no reacciona a cada una, solo a las muy altas.
  else if (fresh && glucoseStatus === 'high' && !isT1(state.profile)) petMood = 'caringHigh';
  else if (worstSymptomToday >= 2) petMood = 'caringHigh';
  else if (state.scenario === 'milestone') petMood = 'celebrate';
  else if (reminders.length) petMood = reminders[0].kind === 'sport' ? 'sport' : 'remind';
  else if (injectionOverdue || plateau) petMood = 'attentive';
  else if (isNight) petMood = 'sleep';
  else if (daysAway >= 2 && !todayDone) petMood = 'missYou';

  return {
    lastInjection,
    nextInjectionAt,
    daysToInjection,
    injectedToday,
    injectionOverdue,
    suggestedSite,
    injectionWeeks,
    phaseIndex,
    prescribedDose: phase.dose,
    phaseWeek,
    phaseWeeks: phase.weeks,
    nextPhase,
    phaseChangeSoon,
    treatmentStart,
    maintenance,
    maintWeeks: maintenance && state.glp1.maintenanceSince ? Math.max(1, Math.floor((now - new Date(state.glp1.maintenanceSince).getTime()) / (7 * DAY)) + 1) : 0,
    maintDeltaKg: maintenance && weightNow !== null && state.glp1.maintenanceKg ? Math.round((weightNow - state.glp1.maintenanceKg) * 10) / 10 : null,
    treatmentWeek,
    nextMilestone,
    supportReason,
    checkinToday,
    lowMoodDays,
    strengthThisWeek,
    weightNow,
    weightStart,
    lostKg,
    lostPct,
    plateau,
    toGoalKg,
    musclePct: lastComp?.musclePct ?? null,
    fatPct: lastComp?.fatPct ?? null,
    lastGlucose,
    glucoseStatus,
    glucoseInTargetPct,
    hba1cNow: hb.length ? hb[hb.length - 1].v : null,
    hba1cPrev: hb.length > 1 ? hb[hb.length - 2].v : null,
    medsToday,
    tir24,
    avg24,
    lows24,
    basalToday,
    rapidTodayU,
    carbsToday,
    lastInsulin: ins.length ? ins[ins.length - 1] : null,
    trend,
    sideEffectsToday,
    worstSymptomToday,
    proteinToday: intake?.protein ?? 0,
    waterToday: intake?.water ?? 0,
    reminders,
    isNight,
    petMood,
    streak,
    streakBefore,
    habitsToday,
    todayDone,
    unlocked,
    unreadCount: state.messages.filter((m) => !m.read).length,
    owiAvatar: {
      ...state.avatar,
      equipped: Object.fromEntries(Object.entries(state.avatar.equipped).map(([k, val]) => [k, val && unlocked[k as AccessoryId]])) as Record<AccessoryId, boolean>,
    },
    bond,
    petLevel,
    petProgress,
    daysAway,
    syncOk,
  };
}

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; d: Derived } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = load<AppState>();
    const base = initialState();
    // Versiones anteriores del prototipo (otro modelo de datos): empezamos de cero.
    if (!saved || !saved.profile || !saved.goals) return base;
    return {
      ...base,
      ...saved,
      glp1: { ...base.glp1, ...saved.glp1 },
      goals: { ...base.goals, ...saved.goals },
      plan: { ...base.plan, ...saved.plan },
      insulin: saved.insulin ?? base.insulin,
      carbs: saved.carbs ?? base.carbs,
      insulinPlan: { ...base.insulinPlan, ...saved.insulinPlan },
      owiChat: saved.owiChat ?? [],
      consultQuestions: saved.consultQuestions ?? [],
      checkins: saved.checkins ?? base.checkins,
      crew: saved.crew ?? base.crew,
      cheers: saved.cheers ?? base.cheers,
      avatar: { ...base.avatar, ...saved.avatar, equipped: { ...base.avatar.equipped, ...(saved.avatar?.equipped ?? {}) } } };
  });

  useEffect(() => save(state), [state]);
  useEffect(() => {
    dispatch({ type: 'opened' });
  }, []);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const d = useMemo<Derived>(() => derive(state, now), [state, now]);

  return <Ctx.Provider value={{ state, dispatch, d }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de StoreProvider');
  return v;
}

export type { HabitId };
