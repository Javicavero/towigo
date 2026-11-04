import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { ACCESSORIES, type AccessoryId } from '../data/avatarOptions';
import { DEFAULT_AVATAR_NAME, DEFAULT_TARGET } from '../config';
import { glucoseSeries, initialMessages, timeInRange, trendOf, STEPS_GOAL, STEPS_TODAY } from '../data/mock';
import { clear, load, save } from './storage';
import type { NewLogEntry, AppState, Avatar, Consents, HabitId, LogEntry, Message, Mood, Scenario, SensorId, TextScale } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

export const defaultAvatar: Avatar = {
  name: DEFAULT_AVATAR_NAME,
  skin: 1,
  hair: 'corto',
  hairColor: 1,
  hoodie: 0,
  shoes: 0,
  // Equipados por defecto: aparecen solos en cuanto se desbloquean (el usuario puede quitarlos).
  equipped: { glasses: true, headband: true, medal: true },
};

function initialState(): AppState {
  return {
    onboarded: false,
    userName: '',
    avatar: defaultAvatar,
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
  };
}

type Action =
  | { type: 'setName'; name: string }
  | { type: 'setAvatar'; patch: Partial<Avatar> }
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
  | { type: 'reset' };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'setName':
      return { ...s, userName: a.name };
    case 'setAvatar':
      return { ...s, avatar: { ...s.avatar, ...a.patch } };
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
    case 'reset':
      clear();
      return initialState();
  }
}

type Derived = {
  series: ReturnType<typeof glucoseSeries>;
  current: { v: number; t: number } | null;
  trend: ReturnType<typeof trendOf>;
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
};

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; d: Derived } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = load<AppState>();
    return saved ? { ...initialState(), ...saved } : initialState();
  });

  useEffect(() => save(state), [state]);

  const d = useMemo<Derived>(() => {
    const series = glucoseSeries(state.scenario);
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
    // Owi solo reacciona al dato; nunca da indicaciones clínicas (Fase 1, §8.2).
    let mood: Mood = 'happy';
    if (state.scenario === 'goal') mood = 'celebrate';
    else if (current && syncOk && (current.v < DEFAULT_TARGET.low || current.v > DEFAULT_TARGET.high)) mood = 'concern';
    const unlocked = Object.fromEntries(ACCESSORIES.map((a) => [a.id, streak >= a.unlockDays])) as Record<AccessoryId, boolean>;
    return {
      series,
      current,
      trend: trendOf(series),
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
      owiAvatar: {
        ...state.avatar,
        equipped: Object.fromEntries(
          Object.entries(state.avatar.equipped).map(([k, v]) => [k, v && unlocked[k as AccessoryId]]),
        ) as Record<AccessoryId, boolean>,
      },
    };
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch, d }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de StoreProvider');
  return v;
}

export type { HabitId };
