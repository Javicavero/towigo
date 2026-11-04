/**
 * Avisos de Owi a partir del PLAN del paciente (horarios que fija el paciente o su equipo).
 * Fase 1 (§8.2): nunca se calculan a partir de la glucosa ni dicen cuánta insulina ponerse.
 * Seguridad: si la glucosa está por debajo del rango, no se muestra el aviso de insulina;
 * Owi solo acompaña y la app muestra el dato.
 */
import type { Plan, Reminder, ReminderKind } from '../state/types';

export const SENSOR_DAYS: Record<Plan['sensor']['model'], number> = { g7: 10, g6: 10, libre: 14 };

export const defaultPlan = (now = new Date()): Plan => ({
  insulin: { enabled: true, basalTime: '22:00', rapidTimes: ['08:00', '14:00', '21:00'] },
  sport: { enabled: true, days: [0, 2, 4], time: '18:00', minutes: 30, activity: 'paseo' },
  sensor: { enabled: true, model: 'g7', insertedAt: new Date(now.getTime() - 6 * 86400e3).toISOString() },
  meals: { enabled: true, times: ['08:30', '14:30', '21:30'] },
  water: { enabled: true, times: ['11:00', '17:00'] },
});

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Ventana de un aviso: desde su hora hasta 45 min después. */
const inWindow = (nowMin: number, hhmm: string, len = 45) => nowMin >= minutesOf(hhmm) && nowMin < minutesOf(hhmm) + len;

export function dueReminders(
  plan: Plan,
  now: Date,
  done: Record<string, string>,
  opts: { belowRange: boolean; demo?: ReminderKind | null },
): Reminder[] {
  const day = now.toDateString();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const out: Reminder[] = [];
  const push = (r: Reminder) => {
    if (done[r.id] !== day) out.push(r);
  };

  if (plan.insulin.enabled && !opts.belowRange) {
    if (inWindow(nowMin, plan.insulin.basalTime) || opts.demo === 'insulin')
      push({ id: `basal-${plan.insulin.basalTime}`, kind: 'insulin', text: 'rem.basal', vars: { time: plan.insulin.basalTime } });
    for (const t of plan.insulin.rapidTimes)
      if (inWindow(nowMin, t, 30)) push({ id: `rapid-${t}`, kind: 'insulin', text: 'rem.rapid', vars: { time: t } });
  }
  const weekday = (now.getDay() + 6) % 7; // 0 = lunes
  // Deporte: un aviso por la mañana (9:00-9:30) y otro a la hora planificada (60 min).
  const sportDay = plan.sport.days.includes(weekday);
  if (plan.sport.enabled && ((sportDay && (inWindow(nowMin, '09:00', 30) || inWindow(nowMin, plan.sport.time, 60))) || opts.demo === 'sport'))
    push({ id: 'sport', kind: 'sport', text: 'rem.sport', vars: { min: plan.sport.minutes, activity: plan.sport.activity, time: plan.sport.time } });
  if (plan.sensor.enabled) {
    const ends = new Date(plan.sensor.insertedAt).getTime() + SENSOR_DAYS[plan.sensor.model] * 86400e3;
    const hoursLeft = Math.round((ends - now.getTime()) / 3600e3);
    if ((hoursLeft <= 24 && hoursLeft > -12) || opts.demo === 'sensor')
      push({
        id: `sensor-${plan.sensor.insertedAt.slice(0, 10)}`,
        kind: 'sensor',
        text: hoursLeft > 0 ? 'rem.sensorSoon' : 'rem.sensorNow',
        vars: { h: Math.max(1, hoursLeft) },
      });
  }
  if (plan.meals.enabled)
    for (const t of plan.meals.times)
      if (inWindow(nowMin, t) || (opts.demo === 'meal' && t === plan.meals.times[1]))
        push({ id: `meal-${t}`, kind: 'meal', text: 'rem.meal', vars: { time: t } });
  if (plan.water.enabled)
    for (const t of plan.water.times)
      if (inWindow(nowMin, t, 30) || (opts.demo === 'water' && t === plan.water.times[0]))
        push({ id: `water-${t}`, kind: 'water', text: 'rem.water', vars: {} });

  // Un demo concreto va primero; si no, el orden de prioridad: insulina, sensor, comida, deporte, agua.
  const order: ReminderKind[] = ['insulin', 'sensor', 'meal', 'sport', 'water'];
  return out.sort((a, b) => (a.kind === opts.demo ? -1 : b.kind === opts.demo ? 1 : order.indexOf(a.kind) - order.indexOf(b.kind)));
}
