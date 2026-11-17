/**
 * Guion del modo presentación: cada paso dice qué perfil y situación cargar, qué pantalla abrir
 * y qué contar. Es solo datos (se prueba en tests/demo.test.ts).
 * Fase 1: lo que se cuenta describe datos, hábitos y comunicación; nunca indicaciones clínicas ni dosis.
 */
import type { LogSection, Tab } from '../nav';
import type { Profile, ReminderKind, Scenario } from '../state/types';

export type Audience = 'full' | 'patients' | 'clinic' | 'quick';
export const AUDIENCES: Audience[] = ['quick', 'full', 'patients', 'clinic'];

/** Pantallas propias de la presentación además de las de la app. */
export type DemoView = Tab | 'cover' | 'owiShow' | 'pro' | 'proPatient' | 'end';

export type Step = {
  id: string;
  /** Capítulo (clave i18n `pres.ch.<chapter>`). Título y guion: `pres.s.<id>.title` / `pres.s.<id>.say`. */
  chapter: 'intro' | 'day' | 'glp1' | 't1' | 'owi' | 'team' | 'clinic' | 'close';
  view: DemoView;
  section?: LogSection;
  profile?: Profile;
  scenario?: Scenario;
  reminder?: ReminderKind | null;
  /** Conversación de ejemplo con Owi (claves i18n de lo que escribe la persona; responde el cerebro local). */
  chat?: string[];
  /** Segundos en avance automático. */
  secs?: number;
  audiences: Audience[];
};

const ALL: Audience[] = ['full', 'patients', 'clinic', 'quick'];

export const STEPS: Step[] = [
  { id: 'cover', chapter: 'intro', view: 'cover', secs: 8, audiences: ALL },
  { id: 'today', chapter: 'day', view: 'home', profile: 'glp1', scenario: 'normal', reminder: null, secs: 11, audiences: ALL },
  { id: 'remind', chapter: 'glp1', view: 'home', profile: 'glp1', scenario: 'injectionDay', reminder: 'injection', secs: 9, audiences: ['full', 'patients', 'quick'] },
  { id: 'logInjection', chapter: 'glp1', view: 'log', section: 'injection', profile: 'glp1', scenario: 'injectionDay', reminder: null, secs: 10, audiences: ['full', 'patients'] },
  { id: 'sideEffects', chapter: 'glp1', view: 'home', profile: 'glp1', scenario: 'sideEffects', reminder: null, secs: 10, audiences: ['full', 'patients', 'clinic'] },
  { id: 'food', chapter: 'glp1', view: 'log', section: 'intake', profile: 'glp1', scenario: 'normal', reminder: null, secs: 10, audiences: ['full', 'patients'] },
  { id: 'chat', chapter: 'owi', view: 'owi', profile: 'glp1', scenario: 'normal', chat: ['chat.sug.how', 'chat.sug.nausea'], secs: 12, audiences: ['full', 'patients', 'quick'] },
  { id: 'progress', chapter: 'glp1', view: 'progress', profile: 'glp1', scenario: 'normal', secs: 11, audiences: ['full', 'patients', 'clinic', 'quick'] },
  { id: 'milestone', chapter: 'glp1', view: 'home', profile: 'glp1', scenario: 'milestone', reminder: null, secs: 8, audiences: ['full', 'patients'] },
  { id: 't1Today', chapter: 't1', view: 'home', profile: 't1', scenario: 'normal', reminder: null, secs: 11, audiences: ['full', 'patients', 'clinic', 'quick'] },
  { id: 't1Low', chapter: 't1', view: 'home', profile: 't1', scenario: 'lowGlucose', reminder: null, secs: 10, audiences: ['full', 'patients', 'clinic'] },
  { id: 't1Log', chapter: 't1', view: 'log', section: 'insulin', profile: 't1', scenario: 'normal', reminder: null, secs: 9, audiences: ['full', 'patients'] },
  { id: 'team', chapter: 'team', view: 'team', profile: 'glp1', scenario: 'normal', reminder: null, secs: 10, audiences: ['full', 'patients', 'clinic'] },
  { id: 'me', chapter: 'team', view: 'me', profile: 'glp1', scenario: 'normal', secs: 9, audiences: ['full', 'patients'] },
  { id: 'owiShow', chapter: 'owi', view: 'owiShow', secs: 14, audiences: ['full', 'patients', 'quick'] },
  { id: 'pro', chapter: 'clinic', view: 'pro', profile: 'glp1', scenario: 'sideEffects', secs: 12, audiences: ['full', 'clinic', 'quick'] },
  { id: 'proPatient', chapter: 'clinic', view: 'proPatient', profile: 'glp1', scenario: 'sideEffects', secs: 12, audiences: ['full', 'clinic'] },
  { id: 'end', chapter: 'close', view: 'end', secs: 10, audiences: ALL },
];

export function stepsFor(a: Audience): Step[] {
  return STEPS.filter((s) => s.audiences.includes(a));
}

/** Duración aproximada en minutos (con el avance automático; hablando, algo más). */
export function minutesFor(a: Audience): number {
  return Math.max(1, Math.round(stepsFor(a).reduce((n, s) => n + (s.secs ?? 9), 0) / 60));
}
