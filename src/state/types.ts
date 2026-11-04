import type { AccessoryId } from '../data/avatarOptions';

export type Mood = 'happy' | 'concern' | 'celebrate';

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
export type Scenario = 'inRange' | 'high' | 'low' | 'goal' | 'syncError';

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
};

/** Entrada nueva antes de asignarle id y hora (Omit distributivo sobre la unión). */
export type NewLogEntry = LogEntry extends infer E ? (E extends LogEntry ? Omit<E, 'id' | 'at'> : never) : never;
