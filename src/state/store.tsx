import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { ACCESSORIES, type AccessoryId } from '../data/avatarOptions';
import { DEFAULT_AVATAR_NAME, DEFAULT_TARGET } from '../config';
import { glucoseSeries, initialMessages, timeInRange, trendOf, STEPS_GOAL, STEPS_TODAY, type Reading, type Trend } from '../data/mock';
import { defaultPlan, dueReminders } from '../data/reminders';
import { clear, load, save } from './storage';
import type { NewLogEntry, AppState, Avatar, PetLevel, PetMood, Consents, HabitId, LogEntry, Message, Mood, Plan, Reminder, ReminderKind, Scenario, SensorId, TextScale } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

export const defaultAvatar: Avatar = {
  skin: 1,
  bodyType: 'media',
  height: 'media',
  faceShape: 'ovalada',
  eyeColor: 1,
  brows: 'normales',
  hair: 'corto',
  hairColor: 1,
  facialHair: 'ninguno',
  glasses: 'ninguna',
  top: 'sudadera',
  topColor: 0,
  bottom: 'pantalon',
  bottomColor: 0,
  shoes: 0,
  // Equipados por defecto: aparecen solos en cuanto se desbloquean (el usuario puede quitarlos).
  equipped: { headband: true, medal: true },
};

/** Vínculo con Owi: sube con hábitos e interacciones; marca su evolución. */
export const PET_LEVEL_AT: Record<PetLevel, number> = { 1: 0, 2: 40, 3: 120, 4: 300 };

function initialState(): AppState {
  return {
    onboarded: false,
    userName: '',
    avatar: defaultAvatar,
    pet: { name: DEFAULT_AVATAR_NAME },
    lastOpenAt: null,
    previousOpenAt: null,
    remindersDoneCount: 0,
    consents: { healthData: false, careTeam: false, productAnalytics: false },
    sensor: 'none',
    textScale: 1.2,
    scenario: 'inRange',
    logs: [],
    messages: initialMessages(),
    habitsToday: { log: false, walk: STEPS_TODAY >= STEPS_GOAL, listen: false },
    streakBefore: 4,
    freezes: 2,
    freezeActiveToday: false,
    plan: defaultPlan(),
    remindersDone: {},
    snoozedUntil: {},
    demoReminder: null,
    dataSource: 'demo',
    dexcom: { connected: false, readings: [], lastSyncAt: null, error: null },
  };
}

type Action =
  | { type: 'setName'; name: string }
  | { type: 'setAvatar'; patch: Partial<Avatar> }
  | { type: 'setPetName'; name: string }
  | { type: 'opened' }
  | { type: 'toggleAccessory'; id: AccessoryId }
  | { type: 'setConsents'; consents: Consents }
  | { type: 'setSensor'; sensor: SensorId }
  | { type: 'finishOnboarding' }
  | { type: 'setTextScale'; scale: TextScale }
  | { type: 'setScenario'; scenario: Scenario }
  | { type: 'addLog'; entry: NewLogEntry }
  | { type: 'sendMessage'; text?: string; kind: 'text' | 'audio'; durationSec?: number }
  | { type: 'owiReply'; text: string }
  | { type: 'listened'; id: string }
  | { type: 'useFreeze' }
  | { type: 'setPlan'; patch: Partial<Plan> }
  | { type: 'reminderDone'; id: string }
  | { type: 'snooze'; id: string; minutes: number }
  | { type: 'setDemoReminder'; kind: ReminderKind | null }
  | { type: 'setDataSource'; source: AppState['dataSource'] }
  | { type: 'dexcom'; patch: Partial<AppState['dexcom']> }
  | { type: 'reset' };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'setName':
      return { ...s, userName: a.name };
    case 'setAvatar':
      return { ...s, avatar: { ...s.avatar, ...a.patch } };
    case 'setPetName':
      return { ...s, pet: { ...s.pet, name: a.name } };
    case 'opened':
      return { ...s, previousOpenAt: s.lastOpenAt, lastOpenAt: new Date().toISOString() };
    case 'toggleAccessory':
      return { ...s, avatar: { ...s.avatar, equipped: { ...s.avatar.equipped, [a.id]: !s.avatar.equipped[a.id] } } };
    case 'setConsents':
      return { ...s, consents: a.consents };
    case 'setSensor':
      return { ...s, sensor: a.sensor };
    case 'finishOnboarding':
      return { ...s, onboarded: true };
    case 'setTextScale':
      return { ...s, textScale: a.scale };
    case 'setScenario':
      return { ...s, scenario: a.scenario };
    case 'addLog':
      return {
        ...s,
        logs: [{ ...a.entry, id: uid(), at: new Date().toISOString() } as LogEntry, ...s.logs],
        habitsToday: { ...s.habitsToday, log: true },
      };
    case 'sendMessage': {
      const m: Message = {
        id: uid(),
        from: 'patient',
        kind: a.kind,
        text: a.text,
        durationSec: a.durationSec,
        at: new Date().toISOString(),
        read: true,
      };
      return { ...s, messages: [...s.messages, m] };
    }
    case 'owiReply':
      return {
        ...s,
        messages: [...s.messages, { id: uid(), from: 'owi', kind: 'text', text: a.text, at: new Date().toISOString(), read: true }],
      };
    case 'listened':
      return {
        ...s,
        messages: s.messages.map((m) => (m.id === a.id ? { ...m, read: true } : m)),
        habitsToday: { ...s.habitsToday, listen: true },
      };
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
        habitsToday: a.id === 'sport' ? { ...s.habitsToday, walk: true } : s.habitsToday,
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

type Derived = {
  series: Reading[];
  current: Reading | null;
  trend: Trend;
  /** Avisos del plan pendientes ahora mismo (el primero es el que muestra Owi). */
  reminders: Reminder[];
  isNight: boolean;
  tir: ReturnType<typeof timeInRange>;
  minutesSinceSync: number;
  syncOk: boolean;
  mood: Mood;
  streak: number;
  streakBefore: number;
  habitsToday: Record<HabitId, boolean>;
  todayDone: boolean;
  unlocked: Record<AccessoryId, boolean>;
  unreadCount: number;
  /** Avatar tal como se dibuja: solo con los accesorios ya desbloqueados. */
  owiAvatar: Avatar;
  /** El avatar humano nunca muestra preocupación (no juzga): solo celebra, hace deporte, duerme o está contento. */
  avatarMood: Mood;
  petMood: PetMood;
  bond: number;
  petLevel: PetLevel;
  /** 0-1: progreso hacia el siguiente nivel de Owi. */
  petProgress: number;
  daysAway: number;
};

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; d: Derived } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = load<AppState>();
    if (!saved) return initialState();
    const base = initialState();
    // Estados guardados de versiones anteriores: completamos los campos nuevos.
    return { ...base, ...saved, avatar: { ...base.avatar, ...saved.avatar, equipped: { ...base.avatar.equipped, ...(saved.avatar?.equipped ?? {}) } }, pet: { ...base.pet, ...(saved.pet ?? {}) } };
  });

  useEffect(() => save(state), [state]);
  useEffect(() => {
    dispatch({ type: 'opened' });
  }, []);

  // Reloj para que los avisos y "hace X min" se actualicen solos.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const d = useMemo<Derived>(() => {
    const live = state.dataSource === 'dexcom' && state.dexcom.connected;
    const series = live ? state.dexcom.readings : glucoseSeries(state.scenario, now);
    const current = series.length ? series[series.length - 1] : null;
    const minutesSinceSync = current ? Math.round((Date.now() - current.t) / 60000) : 999;
    const syncOk = minutesSinceSync < 20;
    // El escenario de demo "objetivo cumplido" simula un día con 7 días de racha
    // sin tocar los hábitos reales del usuario.
    const isGoalDemo = state.scenario === 'goal';
    const habitsToday = isGoalDemo ? { log: true, walk: true, listen: true } : state.habitsToday;
    const streakBefore = isGoalDemo ? Math.max(6, state.streakBefore) : state.streakBefore;
    const todayDone = Object.values(habitsToday).some(Boolean) || state.freezeActiveToday;
    const streak = streakBefore + (todayDone ? 1 : 0);
    const trend = current?.trend ?? trendOf(series);
    const v = current?.v ?? 0;
    const belowRange = !!current && syncOk && v < DEFAULT_TARGET.low;
    const nowDate = new Date(now);
    const reminders = dueReminders(state.plan, nowDate, state.remindersDone, {
      belowRange,
      demo: live ? null : state.demoReminder,
    }).filter((r) => !(state.snoozedUntil[r.id] > now));
    const hour = nowDate.getHours();
    const isNight = live ? hour < 7 : state.scenario === 'night' || (state.scenario === 'inRange' && hour < 7);
    // Owi solo reacciona al dato; nunca da indicaciones clínicas (Fase 1, §8.2).
    // Prioridad: sin datos > glucosa fuera de rango > celebración > aviso del plan > noche > tendencia > feliz.
    let mood: Mood = 'happy';
    if (!syncOk) mood = 'confused';
    else if (v < 54) mood = 'worriedLow';
    else if (v < DEFAULT_TARGET.low) mood = 'caringLow';
    else if (v > 250) mood = 'worriedHigh';
    else if (v > DEFAULT_TARGET.high) mood = 'caringHigh';
    else if (!live && state.scenario === 'goal') mood = 'celebrate';
    else if (reminders.length) mood = reminders[0].kind === 'sport' ? 'sport' : 'remind';
    else if (isNight) mood = 'sleep';
    else if (trend === 'upFast' || trend === 'downFast' || trend === 'up' || trend === 'down') mood = 'attentive';
    const unlocked = Object.fromEntries(ACCESSORIES.map((a) => [a.id, streak >= a.unlockDays])) as Record<AccessoryId, boolean>;
    // Vínculo con Owi: hábitos e interacciones con la app y con el equipo.
    const listened = state.messages.filter((m) => m.read && m.kind === 'audio' && m.from !== 'patient').length;
    const sent = state.messages.filter((m) => m.from === 'patient').length;
    const bond = streak * 10 + state.logs.length * 4 + listened * 5 + sent * 3 + state.remindersDoneCount * 3 + (isGoalDemo ? 150 : 0);
    const petLevel = ([4, 3, 2, 1] as PetLevel[]).find((l) => bond >= PET_LEVEL_AT[l]) ?? 1;
    const nextAt = petLevel < 4 ? PET_LEVEL_AT[(petLevel + 1) as PetLevel] : PET_LEVEL_AT[4];
    const petProgress = petLevel < 4 ? (bond - PET_LEVEL_AT[petLevel]) / (nextAt - PET_LEVEL_AT[petLevel]) : 1;
    const daysAway = state.previousOpenAt ? Math.floor((now - new Date(state.previousOpenAt).getTime()) / 86400e3) : 0;
    const petMood: PetMood = mood === 'happy' && daysAway >= 2 && !todayDone ? 'missYou' : mood;
    const avatarMood: Mood =
      mood === 'celebrate' || mood === 'sport' || mood === 'sleep' ? mood : 'happy';
    return {
      series,
      current,
      trend,
      reminders,
      isNight,
      tir: timeInRange(series),
      minutesSinceSync,
      syncOk,
      mood,
      streak,
      streakBefore,
      habitsToday,
      todayDone,
      unlocked,
      unreadCount: state.messages.filter((m) => !m.read).length,
      avatarMood,
      petMood,
      bond,
      petLevel,
      petProgress,
      daysAway,
      owiAvatar: {
        ...state.avatar,
        equipped: Object.fromEntries(
          Object.entries(state.avatar.equipped).map(([k, v]) => [k, v && unlocked[k as AccessoryId]]),
        ) as Record<AccessoryId, boolean>,
      },
    };
  }, [state, now]);

  return <Ctx.Provider value={{ state, dispatch, d }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de StoreProvider');
  return v;
}

export type { HabitId };
