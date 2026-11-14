import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dueReminders, defaultPlan } from '../src/data/reminders';
import { t } from '../src/i18n';
import { owiThink } from '../src/owi/brain';
import { dayKey, dayKeyAgo } from '../src/state/dates';
import { derive, initialState, migrate, reducer, rollDay, streakBeforeToday, SCHEMA_VERSION } from '../src/state/logic';
import type { AppState } from '../src/state/types';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const base = (over: Partial<AppState> = {}): AppState => ({ ...initialState(), onboarded: true, userName: 'Ana', ...over });

test('las fechas usan la hora local: las 00:30 ya son el día nuevo', () => {
  assert.equal(dayKey(at(2026, 11, 15, 0, 30)), '2026-11-15');
  assert.equal(dayKey(at(2026, 11, 14, 23, 59)), '2026-11-14');
  assert.equal(dayKeyAgo(1, at(2026, 3, 1)), '2026-02-28');
});

test('cierre de día: guarda si se cumplió y deja el día nuevo en blanco', () => {
  const s = base({ day: '2026-11-14', habitHistory: {}, habitsToday: { log: true, walk: false, listen: false }, logsToday: 3 });
  const n = rollDay(s, '2026-11-15');
  assert.equal(n.habitHistory['2026-11-14'], true);
  assert.deepEqual(n.habitsToday, { log: false, walk: false, listen: false });
  assert.equal(n.logsToday, 0);
  assert.equal(rollDay(n, '2026-11-15'), n, 'el mismo día no cambia nada');
});

test('la racha sube cada día cumplido y se rompe si falta uno', () => {
  let s = base({ day: '2026-11-10', habitHistory: {}, habitsToday: { log: false, walk: false, listen: false } });
  for (const d of ['2026-11-11', '2026-11-12', '2026-11-13']) {
    s = reducer(s, { type: 'addIntake', water: 1 }); // cualquier registro cumple el día
    s = rollDay(s, d);
  }
  assert.equal(streakBeforeToday(s.habitHistory, '2026-11-13'), 3);
  // Dos días sin abrir la app: el 13 queda sin cumplir y el 14 no existe → racha rota.
  s = rollDay(s, '2026-11-15');
  assert.equal(streakBeforeToday(s.habitHistory, '2026-11-15'), 0);
});

test('un protector de racha cuenta como día cumplido', () => {
  let s = base({ day: '2026-11-14', habitHistory: { '2026-11-13': true }, habitsToday: { log: false, walk: false, listen: false }, freezes: 1 });
  s = reducer(s, { type: 'useFreeze' });
  s = rollDay(s, '2026-11-15');
  assert.equal(streakBeforeToday(s.habitHistory, '2026-11-15'), 2);
  assert.equal(s.freezes, 0);
  assert.equal(s.freezeActiveToday, false);
});

test('la racha que ve el usuario suma hoy cuando ya ha cumplido', () => {
  const now = Date.now();
  const s = base({ day: dayKey(now), habitHistory: { [dayKeyAgo(1, now)]: true, [dayKeyAgo(2, now)]: true }, habitsToday: { log: false, walk: false, listen: false } });
  assert.equal(derive(s, now).streak, 2);
  assert.equal(derive(reducer(s, { type: 'addIntake', water: 1 }), now).streak, 3);
});

test('migración: los datos de la versión anterior se conservan y la racha fija pasa a días reales', () => {
  const old = { ...initialState(), userName: 'Luis', streakBefore: 7 } as Partial<AppState> & { streakBefore: number };
  delete old.habitHistory;
  delete old.day;
  delete old.schemaVersion;
  const m = migrate(old)!;
  assert.equal(m.schemaVersion, SCHEMA_VERSION);
  assert.equal(m.userName, 'Luis');
  assert.equal(streakBeforeToday(m.habitHistory, m.day), 7);
  assert.equal(migrate(null), null);
  assert.equal(migrate({ userName: 'x' }), null);
});

test('apuntar una inyección la marca como hecha hoy y no como atrasada', () => {
  const s = reducer(base({ profile: 'glp1' }), { type: 'addInjection', dose: 1, site: 'abdIzq' });
  const d = derive(s, Date.now());
  assert.equal(d.injectedToday, true);
  assert.equal(d.injectionOverdue, false);
});

test('la medicación se apunta en el día local', () => {
  const s = reducer(reducer(base(), { type: 'setProfile', profile: 't2' }), { type: 'takeMed', medId: 'metformina', time: '08:30' });
  assert.equal(s.medsTaken[`${dayKey()}|metformina|08:30`], true);
});

test('avisos: con glucosa baja no se recuerda la medicación', () => {
  const s = reducer(base(), { type: 'setProfile', profile: 't2' });
  const ctx = { profile: s.profile, plan: defaultPlan(), glp1: s.glp1, meds: s.meds, injectedToday: false, medsTaken: {}, insulinPlan: s.insulinPlan, basalToday: false };
  const morning = at(2026, 11, 16, 8, 40);
  assert.ok(dueReminders(ctx, morning, {}, { lowGlucose: false }).some((r) => r.kind === 'meds'));
  assert.ok(!dueReminders(ctx, morning, {}, { lowGlucose: true }).some((r) => r.kind === 'meds'));
});

test('Owi nunca da dosis y deriva las urgencias al 112', () => {
  const s = reducer(base(), { type: 'setProfile', profile: 't1' });
  const d = derive(s, Date.now());
  const dose = owiThink('¿cuántas unidades me pongo para 60 g?', s, d);
  assert.equal(dose.confirm, undefined);
  assert.match(dose.text, /equipo/);
  assert.equal(owiThink('me duele el pecho, es una urgencia', s, d).text, t('chat.emergency'));
});

test('Owi entiende registros y pide confirmación', () => {
  const s = reducer(base(), { type: 'setProfile', profile: 't1' });
  const d = derive(s, Date.now());
  assert.deepEqual(owiThink('me he puesto 4,5 u de rápida hace 15 min', s, d).confirm, { type: 'addInsulin', units: 4.5, kind: 'rapid', minutesAgo: 15 });
  assert.deepEqual(owiThink('50 g de carbos', s, d).confirm, { type: 'addCarbs', g: 50, minutesAgo: undefined });
  assert.deepEqual(owiThink('peso 98,5', s, d).confirm, { type: 'addWeight', entry: { kg: 98.5 } });
});

test('Owi no apunta nada si la frase es una negación', () => {
  const s = reducer(base(), { type: 'setProfile', profile: 't1' });
  const d = derive(s, Date.now());
  assert.equal(owiThink('no me he puesto 4 u de rápida', s, d).confirm, undefined);
  assert.equal(owiThink('todavía no he comido 50 g de carbos', s, d).confirm, undefined);
});

test('se puede apuntar algo de ayer y borrar un registro equivocado', () => {
  let s = base({ profile: 'glp1', injections: [], weights: [] });
  s = reducer(s, { type: 'addWeight', entry: { kg: 98.5 }, daysAgo: 1 });
  assert.equal(dayKey(s.weights[0].at), dayKeyAgo(1));
  s = reducer(s, { type: 'addInjection', dose: 1, site: 'abdIzq' });
  assert.equal(s.injections.length, 1);
  s = reducer(s, { type: 'deleteEntry', kind: 'injection', key: s.injections[0].id });
  assert.equal(s.injections.length, 0);
  assert.equal(derive(s, Date.now()).injectedToday, false);
  s = reducer(s, { type: 'deleteEntry', kind: 'weight', key: s.weights[0].at });
  assert.equal(s.weights.length, 0);
});

test('avisos del móvil: salen del plan, respetan el modo discreto y nunca mencionan dosis', async () => {
  const { planNotifications } = await import('../src/data/notificationPlan');
  let s = base({ profile: 'glp1' });
  assert.deepEqual(planNotifications(s), [], 'desactivados por defecto');
  s = reducer(s, { type: 'setNotifications', patch: { enabled: true } });
  const list = planNotifications(s);
  const inj = list.find((n) => n.id === 'injection')!;
  assert.equal(inj.weekday, s.glp1.weekday);
  assert.equal(`${inj.hour}:${String(inj.minute).padStart(2, '0')}`, s.glp1.time);
  assert.ok(list.every((n) => !/\d\s?(mg|u\b|unidades)/.test(n.body)), 'ningún aviso lleva dosis');
  const discreet = planNotifications(reducer(s, { type: 'setNotifications', patch: { discreet: true } }));
  assert.ok(discreet.every((n) => n.body === t('notif.discreet')));
  // En mantenimiento ya no hay aviso de inyección.
  const maint = planNotifications(reducer(s, { type: 'setGlp1', patch: { status: 'maintenance' } }));
  assert.ok(!maint.some((n) => n.id === 'injection'));
  // Tipo 2: un aviso por cada hora distinta de medicación.
  const t2 = planNotifications(reducer(s, { type: 'setProfile', profile: 't2' }));
  assert.deepEqual(t2.filter((n) => n.id.startsWith('meds')).map((n) => n.id), ['meds-08:30', 'meds-21:00']);
});
