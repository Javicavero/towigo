import type { AccessoryId, BODY_TYPES, BROWS, FACE_SHAPES, FACIAL_HAIR, GLASSES, HAIR_STYLES, TOPS } from '../data/avatarOptions';

/** Los tres caminos de la app. */
/** Los cuatro caminos de la app. */
export type Profile = 't1' | 't2' | 'glp1' | 't2_glp1';
export const usesGlp1 = (p: Profile) => p === 'glp1' || p === 't2_glp1';
/** Lleva control de glucosa (tipo 1 o tipo 2). */
export const hasDiabetes = (p: Profile) => p !== 'glp1';
/** Tipo 2 (medicación oral). */
export const hasT2 = (p: Profile) => p === 't2' || p === 't2_glp1';
export const isT1 = (p: Profile) => p === 't1';

/**
 * Emociones de Owi (las 12 ilustraciones del diseño). Reaccionan a hábitos y datos;
 * nunca dan indicaciones clínicas (Fase 1, §8.2).
 */
export type PetMood =
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
  | 'sport'
  | 'missYou';
/** Evolución de Owi: 1 Pequeño, 2 Explorador, 3 Compañero, 4 Leyenda. */
export type PetLevel = 1 | 2 | 3 | 4;

export type HairStyle = (typeof HAIR_STYLES)[number];

/** Avatar 2D del usuario (busto ilustrado que se parece a la persona). */
export type Avatar = {
  skin: number;
  bodyType: (typeof BODY_TYPES)[number];
  faceShape: (typeof FACE_SHAPES)[number];
  eyeColor: number;
  brows: (typeof BROWS)[number];
  hair: HairStyle;
  hairColor: number;
  facialHair: (typeof FACIAL_HAIR)[number];
  glasses: (typeof GLASSES)[number];
  top: (typeof TOPS)[number];
  topColor: number;
  equipped: Record<AccessoryId, boolean>;
};

export type Pet = { name: string };

/** Escenarios de demostración del prototipo (datos simulados). */
export type Scenario = 'normal' | 'injectionDay' | 'missedInjection' | 'sideEffects' | 'plateau' | 'milestone' | 'highGlucose' | 'lowGlucose' | 'night';

export type SensorId = 'glucometro' | 'libre' | 'dexcom' | 'none';
export type TextScale = 1 | 1.2 | 1.4;

export type Consents = {
  healthData: boolean; // RGPD art. 9 (obligatorio)
  careTeam: boolean; // compartir con el equipo (obligatorio)
  productAnalytics: boolean; // opcional
  acceptedAt?: string;
};

// ---------- GLP-1 ----------
export type Glp1Drug = 'semaglutida' | 'tirzepatida' | 'liraglutida' | 'otro';
export type InjectionSite = 'abdIzq' | 'abdDer' | 'musloIzq' | 'musloDer' | 'brazoIzq' | 'brazoDer';
/** Registro de una inyección: lo que el paciente se ha puesto (la app no decide dosis). */
export type Injection = { id: string; at: string; dose: number; site: InjectionSite };
/** Una fase de la pauta de escalado que fija el médico (la app solo la muestra y la recuerda). */
export type TitrationStep = { dose: number; weeks: number };
export type Glp1Plan = {
  drug: Glp1Drug;
  /** Pauta de escalado del médico, desde `startedAt`. La última fase es la de mantenimiento. */
  titration: TitrationStep[];
  /** 'maintenance' cuando el médico retira o reduce el GLP-1: la app pasa a cuidar el mantenimiento. */
  status?: 'active' | 'maintenance';
  maintenanceSince?: string;
  /** Peso al empezar el mantenimiento (referencia de la zona de mantenimiento). */
  maintenanceKg?: number;
  /** Dosis actual pautada por su médico (solo se muestra, no se calcula). */
  currentDose: number;
  weekday: number; // 0 = lunes
  time: string;
  startedAt: string;
};

// ---------- Peso y cuerpo ----------
export type WeightEntry = { at: string; kg: number; musclePct?: number; fatPct?: number };

// ---------- Tipo 2 ----------
export type GlucoseContext = 'ayunas' | 'antesComer' | 'despuesComer' | 'noche' | 'sensor';
export type GlucoseEntry = { id: string; at: string; v: number; context: GlucoseContext };
export type Hba1cEntry = { at: string; v: number };
export type Medication = { id: string; name: string; dose: string; times: string[] };

// ---------- Tipo 1: insulina y carbohidratos ----------
/** Lo que el paciente se ha puesto. Towigo nunca calcula ni sugiere bolos ni dosis (Fase 1). */
export type InsulinKind = 'rapid' | 'basal';
export type InsulinEntry = { id: string; at: string; units: number; kind: InsulinKind };
export type CarbEntry = { id: string; at: string; g: number; protein?: number; label?: string; photo?: boolean };
/** Insulinas y pauta basal que fija el equipo (solo se muestra y se recuerda). */
export type InsulinPlan = { rapidName: string; basalName: string; basalTime: string; basalUnits: number };

// ---------- Efectos secundarios ----------
export type SymptomId = 'nausea' | 'vomitos' | 'estrenimiento' | 'diarrea' | 'ardor' | 'fatiga' | 'pocoApetito' | 'mareo';
export type SideEffectEntry = { id: string; at: string; symptoms: { id: SymptomId; level: 1 | 2 | 3 }[] };

// ---------- Nutrición e hidratación ----------
export type DayIntake = { date: string; protein: number; water: number };

// ---------- Equipo ----------
export type TeamRole = 'endo' | 'nutri' | 'psico';
export type Sender = 'patient' | 'owi' | TeamRole;
export type Message = { id: string; from: Sender; kind: 'text' | 'audio'; text?: string; durationSec?: number; at: string; read: boolean };

// ---------- Owi: chat y check-in ----------
export type ChatMsg = { id: string; from: 'me' | 'owi'; text: string; at: string };
/** Cómo estás hoy: 1 (muy mal) … 5 (muy bien). Solo lo ve tu equipo si tú lo compartes. */
export type CheckIn = { date: string; v: 1 | 2 | 3 | 4 | 5; tags: string[]; note?: string; shared?: boolean };

// ---------- Tu gente (familia y cuidadores) ----------
export type CrewRelation = 'pareja' | 'hijo' | 'madre' | 'padre' | 'amistad' | 'cuidador';
/** Permisos que da el paciente; puede quitarlos cuando quiera. */
export type CrewPerms = { summary: boolean; logForMe: boolean; sos: boolean };
export type CrewMember = { id: string; name: string; relation: CrewRelation; perms: CrewPerms; status: 'invited' | 'active'; code: string };
export type Cheer = { id: string; from: string; text: string; at: string; read: boolean };

export type HabitId = 'log' | 'walk' | 'listen';

/** Objetivos: los fija el profesional del paciente (en el prototipo vienen precargados). */
export type Goals = {
  weightKg: number;
  proteinG: number;
  waterGlasses: number;
  fastingRange: [number, number];
  postMealMax: number;
  /** g de proteína por kg que pauta la nutricionista (el objetivo diario sale de aquí). */
  proteinPerKg: number;
  /** Sesiones de fuerza por semana que propone el equipo. */
  strengthPerWeek: number;
};

/** Una sesión de fuerza hecha (rutinas cortas para proteger el músculo). */
export type StrengthSession = { id: string; at: string; routine: string };

/** Avisos del plan (horarios del paciente o su equipo; nunca calculados por la app). */
export type ReminderKind = 'injection' | 'insulin' | 'meds' | 'sport' | 'meal' | 'water' | 'weigh';
export type Plan = {
  injection: { enabled: boolean };
  meds: { enabled: boolean };
  insulin: { enabled: boolean };
  sport: { enabled: boolean; days: number[]; time: string; minutes: number; activity: string };
  weigh: { enabled: boolean; weekday: number };
  meals: { enabled: boolean; times: string[] };
  water: { enabled: boolean; times: string[] };
};
export type Reminder = { id: string; kind: ReminderKind; text: string; vars: Record<string, string | number> };

export type Reading = { t: number; v: number };

export type AppState = {
  onboarded: boolean;
  userName: string;
  profile: Profile;
  avatar: Avatar;
  pet: Pet;
  consents: Consents;
  sensor: SensorId;
  textScale: TextScale;
  scenario: Scenario;
  goals: Goals;
  glp1: Glp1Plan;
  injections: Injection[];
  weights: WeightEntry[];
  glucose: GlucoseEntry[];
  hba1c: Hba1cEntry[];
  meds: Medication[];
  insulin: InsulinEntry[];
  carbs: CarbEntry[];
  insulinPlan: InsulinPlan;
  medsTaken: Record<string, boolean>; // `${fecha}|${medId}|${hora}`
  sideEffects: SideEffectEntry[];
  intake: DayIntake[];
  strength: StrengthSession[];
  owiChat: ChatMsg[];
  consultQuestions: string[];
  checkins: CheckIn[];
  crew: CrewMember[];
  cheers: Cheer[];
  /** Último día en que el paciente pidió hablar con su equipo desde el programa de constancia. */
  supportAskedOn: string | null;
  messages: Message[];
  habitsToday: Record<HabitId, boolean>;
  logsToday: number;
  streakBefore: number;
  freezes: number;
  freezeActiveToday: boolean;
  plan: Plan;
  remindersDone: Record<string, string>;
  remindersDoneCount: number;
  snoozedUntil: Record<string, number>;
  demoReminder: ReminderKind | null;
  lastOpenAt: string | null;
  previousOpenAt: string | null;
  dataSource: 'demo' | 'dexcom';
  dexcom: { connected: boolean; readings: Reading[]; lastSyncAt: string | null; error: string | null };
};
