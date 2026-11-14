/**
 * Qué avisos programar en el móvil a partir del plan del paciente (función pura, con pruebas).
 * Fase 1: solo recuerdan lo que el paciente o su equipo han fijado; nunca indican dosis.
 * "Discreto": el texto no menciona salud, por si alguien ve la pantalla bloqueada.
 */
import { t } from '../i18n';
import { hasT2, isT1, usesGlp1, type AppState } from '../state/types';

export type PlannedNotification = {
  id: string;
  title: string;
  body: string;
  /** weekday: 0 = lunes … 6 = domingo (como en el resto de la app). Sin weekday = todos los días. */
  weekday?: number;
  hour: number;
  minute: number;
  link: string;
};

const hm = (s: string) => s.split(':').map(Number) as [number, number];

export function planNotifications(s: Pick<AppState, 'profile' | 'plan' | 'glp1' | 'meds' | 'insulinPlan' | 'pet' | 'notifications'>): PlannedNotification[] {
  if (!s.notifications.enabled) return [];
  const out: PlannedNotification[] = [];
  const title = s.pet.name;
  const say = (key: string, vars?: Record<string, string | number>) => (s.notifications.discreet ? t('notif.discreet') : t(key, vars));

  if (usesGlp1(s.profile) && s.glp1.status !== 'maintenance' && s.plan.injection.enabled) {
    const [hour, minute] = hm(s.glp1.time);
    out.push({ id: 'injection', title, body: say('notif.injection'), weekday: s.glp1.weekday, hour, minute, link: 'towigo://registrar/inyeccion' });
  }
  if (isT1(s.profile) && s.plan.insulin?.enabled !== false) {
    const [hour, minute] = hm(s.insulinPlan.basalTime);
    out.push({ id: 'basal', title, body: say('notif.basal', { name: s.insulinPlan.basalName.toLowerCase() }), hour, minute, link: 'towigo://registrar' });
  }
  if (hasT2(s.profile) && s.plan.meds.enabled) {
    const times = Array.from(new Set(s.meds.flatMap((m) => m.times))).sort();
    for (const time of times) {
      const [hour, minute] = hm(time);
      out.push({ id: `meds-${time}`, title, body: say('notif.meds'), hour, minute, link: 'towigo://registrar/medicacion' });
    }
  }
  if (s.plan.weigh.enabled) out.push({ id: 'weigh', title, body: say('notif.weigh'), weekday: s.plan.weigh.weekday, hour: 8, minute: 30, link: 'towigo://registrar' });
  return out;
}
