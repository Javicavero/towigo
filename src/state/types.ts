import type { AccessoryId } from '../data/avatarOptions';
import type { Reading } from '../data/mock';

/**
 * Estados de ánimo de Owi (§4.2). Reaccionan al dato, nunca dan indicaciones clínicas.
 * - happy: en rango y estable          - attentive: en rango pero cambiando rápido
 * - caringHigh: por encima (181-250)   - worriedHigh: muy por encima (>250)
 * - caringLow: por debajo (54-69)      - worriedLow: muy por debajo (<54)
 * - celebrate: objetivo de hábitos     - sleep: de noche y en rango
 * - confused: no llegan datos          - remind: aviso del plan    - sport: toca deporte
 */
export type Mood =
  | 'happy'
  | 'attentive'
  | 'caringHigh'
  | 'worriedHigh'
  | 'caringLow'
  | 'worriedLow'
  | 'celebrate'
  | 'sleep'
  | 'confused'
  | 'remind'
  | 'sport';

export type HairStyle = 'corto' | 'melena' | 'rizos' | 'mono' | 'rapado';

export type Avatar = {
  name: string;
  skin: number;
  hair: HairStyle;
  hairColor: number;
  hoodie: number;
  shoes: number;
  equipped: Record<AccessoryId, boolean>;
};

/** Escenarios de demostración del prototipo (datos simulados). */
export type Scenario = 'inRange' | 'rising' | 'high' | 'veryHigh' | 'low' | 'urgentLow' | 'night' | 'goal' | 'syncError';

export type SensorId = 'libre' | 'dexcom' | 'otro' | 'none';

export type TextScale = 1 | 1.2 | 1.4;

export type Consents = {
  healthData: boolean; // RGPD art. 9: tratamiento de datos de salud (obligatorio)
  careTeam: boolean; // compartir datos con tu equipo (obligatorio)
  productAnalytics: boolean; // analítica de uso anónima (opcional)
  acceptedAt?: string;
};

export type InsulinKind = 'rapida' | 'basal';

export type LogEntry =
  | { id: string; at: string; type: 'insulin'; kind: InsulinKind; units: number }
  | { id: string; at: string; type: 'meal'; label: string; hasPhoto: boolean }
  | { id: string; at: string; type: 'feeling'; level: 1 | 2 | 3 | 4 | 5; symptoms: string[] };

export type TeamRole = 'endo' | 'nutri' | 'psico';
export type Sender = 'patient' | 'owi' | TeamRole;

export type Message = {
  id: string;
  from: Sender;
  kind: 'text' | 'audio';
  text?: string;
  durationSec?: number;
  at: string;
  read: boolean;
};

export type HabitId = 'log' | 'walk' | 'listen';

export type AppState = {
  onboarded: boolean;
  userName: string;
  avatar: Avatar;
  consents: Consents;
  sensor: SensorId;
  textScale: TextScale;
  scenario: Scenario;
  logs: LogEntry[];
  messages: Message[];
  habitsToday: Record<HabitId, boolean>;
  streakBefore: number; // días de racha antes de hoy
  freezes: number; // protectores de racha disponibles
  freezeActiveToday: boolean;
  plan: Plan;
  remindersDone: Record<string, string>; // id del aviso -> día en que se marcó hecho
  snoozedUntil: Record<string, number>;
  demoReminder: ReminderKind | null; // solo prototipo
  dataSource: DataSource;
  dexcom: { connected: boolean; readings: Reading[]; lastSyncAt: string | null; error: string | null };
};

/** Entrada nueva antes de asignarle id y hora (Omit distributivo sobre la unión). */
export type NewLogEntry = LogEntry extends infer E ? (E extends LogEntry ? Omit<E, 'id' | 'at'> : never) : never;

/** Avisos que el paciente (o su equipo) programa. Nunca se calculan a partir de la glucosa (Fase 1). */
export type ReminderKind = 'insulin' | 'sport' | 'sensor' | 'meal' | 'water';

export type Plan = {
  insulin: { enabled: boolean; basalTime: string; rapidTimes: string[] };
  sport: { enabled: boolean; days: number[]; time: string; minutes: number; activity: string };
  sensor: { enabled: boolean; model: 'g7' | 'g6' | 'libre'; insertedAt: string };
  meals: { enabled: boolean; times: string[] };
  water: { enabled: boolean; times: string[] };
};

export type Reminder = { id: string; kind: ReminderKind; text: string; vars: Record<string, string | number> };

export type DataSource = 'demo' | 'dexcom';
