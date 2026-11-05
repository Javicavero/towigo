/**
 * Instantánea para los widgets de la pantalla de inicio y de bloqueo (iOS y Android).
 * La app la recalcula cada vez que cambian los datos y la guarda en un almacén compartido
 * con el widget (App Group en iOS, SharedPreferences en Android).
 * Fase 1: solo emociones de Owi, recordatorios y datos; nunca indicaciones clínicas.
 */
import { t } from '../i18n';
import type { AppState, PetMood } from '../state/types';
import { hasDiabetes, usesGlp1 } from '../state/types';

export type WidgetSnapshot = {
  v: 1;
  owiName: string;
  mood: PetMood;
  /** Frase corta de Owi (máx. ~40 caracteres). */
  message: string;
  /** Lo siguiente importante, p. ej. "Inyección" · "en 3 días". */
  nextLabel: string;
  nextValue: string;
  streak: number;
  /** Abre la app en la sección adecuada al tocar el widget. */
  deepLink: string;
  updatedAt: string;
};

type D = {
  petMood: PetMood;
  streak: number;
  daysToInjection: number | null;
  injectedToday: boolean;
  injectionOverdue: boolean;
  medsToday: { taken: boolean }[];
  lastGlucose: { v: number } | null;
  trend?: 'up2' | 'up' | 'flat' | 'down' | 'down2' | null;
  reminders: { kind: string }[];
};

export function buildWidgetSnapshot(state: AppState, d: D): WidgetSnapshot {
  const glp1 = usesGlp1(state.profile);
  const t2 = hasDiabetes(state.profile);
  let nextLabel = t('widget.streakLabel');
  let nextValue = t('widget.days', { n: d.streak });
  let deepLink = 'towigo://hoy';
  if (state.profile === 't1' && d.lastGlucose) {
    const arrow = d.trend ? ` ${{ up2: '⇈', up: '↑', flat: '→', down: '↓', down2: '⇊' }[d.trend]}` : '';
    nextLabel = t('widget.glucose');
    nextValue = `${d.lastGlucose.v}${arrow} mg/dL`;
  } else if (glp1 && d.daysToInjection !== null) {
    nextLabel = t('widget.injection');
    nextValue = d.injectedToday ? t('widget.injDone') : d.injectionOverdue ? t('widget.injPending') : d.daysToInjection === 0 ? t('widget.today') : t('widget.inDays', { n: d.daysToInjection });
    deepLink = 'towigo://registrar/inyeccion';
  } else if (t2 && d.medsToday.length) {
    nextLabel = t('widget.meds');
    nextValue = t('widget.medsValue', { a: d.medsToday.filter((m) => m.taken).length, b: d.medsToday.length });
    deepLink = 'towigo://registrar/medicacion';
  } else if (t2 && d.lastGlucose) {
    nextLabel = t('widget.glucose');
    nextValue = `${d.lastGlucose.v} mg/dL`;
  }
  const reminderKind = d.reminders[0]?.kind;
  const message = reminderKind ? t(`widget.rem.${reminderKind}`) : t(`widget.mood.${d.petMood}`, { n: d.streak });
  return {
    v: 1,
    owiName: state.pet.name,
    mood: d.petMood,
    message,
    nextLabel,
    nextValue,
    streak: d.streak,
    deepLink,
    updatedAt: new Date().toISOString(),
  };
}
