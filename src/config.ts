/**
 * Configuración global de Towigo.
 * El nombre comercial se define aquí una sola vez (ver especificación §0).
 */
export const APP_NAME = 'Towigo';
export const DEFAULT_AVATAR_NAME = 'Owi';

/**
 * Feature flags.
 * Fase 1 NO es producto sanitario (especificación §8.2): todo lo clínico
 * automático queda desactivado hasta tener el marcado CE (Fase 2).
 * No activar estas funciones sin el visto bueno regulatorio.
 */
export const FLAGS = {
  // --- Fase 2 (requiere marcado CE). Deben seguir en false en Fase 1. ---
  insulinDoseCalculator: false,
  automaticClinicalAlerts: false,
  aiTherapeuticRecommendations: false,

  // --- Funciones de producto que se pueden activar ya ---
  streakFreeze: true,
  achievements: true,
  audioMessages: true,
  community: false, // fase posterior (§4.6)
  groupSessions: false, // propuesta (§4.3)

  // Solo para el prototipo: muestra el selector de escenarios de demostración.
  demoScenarios: true,
} as const;

/** Rango objetivo por defecto. En la app real lo fija el profesional del paciente. */
export const DEFAULT_TARGET = { low: 70, high: 180, unit: 'mg/dL' as const };
