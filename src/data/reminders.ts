/**
 * Avisos de Owi a partir del PLAN del paciente (horarios que fija el paciente o su equipo).
 * Fase 1 (§8.2): nunca se calculan a partir de la glucosa ni dicen qué dosis ponerse.
 * Seguridad: con una glucosa baja reciente no se muestran avisos de medicación; Owi solo acompaña.
 */
import type { Glp1Plan, Medication, Plan, Profile, Reminder, ReminderKind } from '../state/types';
import { usesGlp1, hasT2 } from '../state/types';

export const defaultPlan = (): Plan => ({
  injection: { enabled: true },
  meds: { enabled: true },
  sport: { enabled: true, days: [0, 2, 4], time: '18:00', minutes: 30, activity: 'paseo' },
  weigh: { enabled: true, weekday: 0 },
  meals: { enabled: true, times: ['14:30', '21:30'] },
  water: { enabled: true, times: ['11:00', '17:00'] },
});

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const inWindow = (nowMin: number, hhmm: string, len = 45) => nowMin >= minutesOf(hhmm) && nowMin < minutesOf(hhmm) + len;

export function dueReminders(
  ctx: { profile: Profile; plan: Plan; glp1: Glp1Plan; meds: Medication[]; injectedToday: boolean; medsTaken: Record<string, boolean> },
  now: Date,
  done: Record<string, string>,
  opts: { lowGlucose: boolean; demo?: ReminderKind | null },
): Reminder[] {
  const day = now.toDateString();
  const dateKey = now.toISOString().slice(0, 10);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const weekday = (now.getDay() + 6) % 7; // 0 = lunes
  const out: Reminder[] = [];
  const push = (r: Reminder) => {
    if (done[r.id] !== day) out.push(r);
  };
  const { plan } = ctx;

  if (usesGlp1(ctx.profile) && plan.injection.enabled && !ctx.injectedToday && ((weekday === ctx.glp1.weekday && nowMin >= minutesOf(ctx.glp1.time)) || opts.demo === 'injection'))
    push({ id: `inj-${dateKey}`, kind: 'injection', text: 'rem.injection', vars: { time: ctx.glp1.time } });

  if (hasT2(ctx.profile) && plan.meds.enabled && !opts.lowGlucose)
    for (const m of ctx.meds)
      for (const t of m.times)
        if ((inWindow(nowMin, t) || (opts.demo === 'meds' && t === m.times[0])) && !ctx.medsTaken[`${dateKey}|${m.id}|${t}`])
          push({ id: `med-${m.id}-${t}`, kind: 'meds', text: 'rem.meds', vars: { med: m.name, dose: m.dose, time: t } });

  const sportDay = plan.sport.days.includes(weekday);
  if (plan.sport.enabled && ((sportDay && (inWindow(nowMin, '09:00', 30) || inWindow(nowMin, plan.sport.time, 60))) || opts.demo === 'sport'))
    push({ id: 'sport', kind: 'sport', text: 'rem.sport', vars: { min: plan.sport.minutes, activity: plan.sport.activity, time: plan.sport.time } });

  if (plan.weigh.enabled && ((weekday === plan.weigh.weekday && nowMin >= 7 * 60 && nowMin < 11 * 60) || opts.demo === 'weigh'))
    push({ id: `weigh-${dateKey}`, kind: 'weigh', text: 'rem.weigh', vars: {} });

  if (plan.meals.enabled)
    for (const t of plan.meals.times)
      if (inWindow(nowMin, t) || (opts.demo === 'meal' && t === plan.meals.times[0])) push({ id: `meal-${t}`, kind: 'meal', text: 'rem.meal', vars: { time: t } });

  if (plan.water.enabled)
    for (const t of plan.water.times)
      if (inWindow(nowMin, t, 30) || (opts.demo === 'water' && t === plan.water.times[0])) push({ id: `water-${t}`, kind: 'water', text: 'rem.water', vars: {} });

  const order: ReminderKind[] = ['injection', 'meds', 'weigh', 'meal', 'sport', 'water'];
  return out.sort((a, b) => (a.kind === opts.demo ? -1 : b.kind === opts.demo ? 1 : order.indexOf(a.kind) - order.indexOf(b.kind)));
}
