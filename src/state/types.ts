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

/** Emociones de Owi (la mascota): las del avatar más el reencuentro tras unos días sin abrir la app. */
export type PetMood = Mood | 'missYou';
/** Evolución de Owi: 1 Pequeño, 2 Explorador, 3 Compañero, 4 Leyenda. */
export type PetLevel = 1 | 2 | 3 | 4;

import type { BODY_TYPES, BOTTOMS, BROWS, FACE_SHAPES, FACIAL_HAIR, GLASSES, HAIR_STYLES, HEIGHTS, TOPS } from '../data/avatarOptions';

export type HairStyle = (typeof HAIR_STYLES)[number];

/** Avatar humano: se parece al usuario (§4.2, "cuanto más se parece, más confianza genera"). */
export type Avatar = {
  skin: number;
  bodyType: (typeof BODY_TYPES)[number];
  height: (typeof HEIGHTS)[number];
  faceShape: (typeof FACE_SHAPES)[number];
  eyeColor: number;
  brows: (typeof BROWS)[number];
  hair: HairStyle;
  hairColor: number;
  facialHair: (typeof FACIAL_HAIR)[number];
  glasses: (typeof GLASSES)[number];
  top: (typeof TOPS)[number];
  topColor: number;
  bottom: (typeof BOTTOMS)[number];
  bottomColor: number;
  shoes: number;
  equipped: Record<AccessoryId, boolean>;
};

/** Owi, la mascota. */
export type Pet = { name: string };

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
  pet: Pet;
  /** Última vez que se abrió la app (para que Owi diga "te echaba de menos"). */
  lastOpenAt: string | null;
  previousOpenAt: string | null;
  remindersDoneCount: number;
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
