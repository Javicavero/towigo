import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toSnapshot, type RawHealth } from '../src/services/healthTransform';
import type { HealthSnapshot } from '../src/services/healthTypes';
import { dayKey, dayKeyAgo } from '../src/state/dates';
import { initialState, reducer } from '../src/state/logic';
import { stepsOn } from '../src/state/steps';
import type { AppState } from '../src/state/types';

// Datos inventados (no son de ningún paciente).
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const empty: RawHealth = { stepsDaily: [], sleep: [], mass: [], fat: [], lean: [], glucose: [], insulin: [], carbs: [], protein: [] };

test('Salud: pasos por día y sueño asignado al día en que te despiertas', () => {
  const r = toSnapshot({
    ...empty,
    stepsDaily: [
      { start: at(2026, 11, 16, 0), sum: 8123.6 },
      { start: at(2026, 11, 17, 0), sum: 0 },
    ],
    sleep: [
      { start: at(2026, 11, 16, 23, 30), end: at(2026, 11, 17, 3, 30), value: 3 }, // básico
      { start: at(2026, 11, 17, 3, 30), end: at(2026, 11, 17, 3, 45), value: 2 }, // despierto: no cuenta
      { start: at(2026, 11, 17, 3, 45), end: at(2026, 11, 17, 7, 15), value: 5 }, // REM
      { start: at(2026, 11, 16, 23, 0), end: at(2026, 11, 17, 7, 15), value: 0 }, // en la cama: no cuenta
    ],
  });
  assert.deepEqual(r.stepsByDay, { '2026-11-16': 8124 }, 'los días con 0 pasos no se guardan');
  assert.deepEqual(r.sleepByDay, { '2026-11-17': 7.5 });
});

test('Salud: peso con grasa y masa magra del mismo día', () => {
  const r = toSnapshot({
    ...empty,
    mass: [
      { startDate: at(2026, 11, 10, 8), quantity: 90.04 },
      { startDate: at(2026, 11, 3, 8), quantity: 91.2 },
      { startDate: at(2026, 11, 4, 8), quantity: 5 }, // error de báscula
    ],
    fat: [{ startDate: at(2026, 11, 10, 8), quantity: 0.312 }],
    lean: [{ startDate: at(2026, 11, 10, 8), quantity: 61.9 }],
  });
  assert.deepEqual(r.weights.map((w) => w.kg), [91.2, 90]);
  assert.equal(r.weights[1].fatPct, 31.2, 'Salud guarda la grasa como fracción');
  assert.equal(r.weights[1].musclePct, 68.7);
  assert.equal(r.weights[0].fatPct, undefined);
});

test('Salud: distingue sensor y glucómetro, y el momento de la lectura de glucómetro', () => {
  const sensor = Array.from({ length: 40 }, (_, i) => ({ startDate: new Date(at(2026, 11, 16, 0).getTime() + i * 5 * 60e3), quantity: 110 + i, source: 'Mi lector' }));
  const r = toSnapshot({
    ...empty,
    glucose: [
      { startDate: at(2026, 11, 16, 9), quantity: 300, source: 'Dexcom G7' },
      ...sensor,
      { startDate: at(2026, 11, 16, 7, 30), quantity: 98, source: 'Contour' },
      { startDate: at(2026, 11, 16, 15), quantity: 165, source: 'Contour', meal: 2 },
      { startDate: at(2026, 11, 16, 13), quantity: 104, source: 'Contour', meal: 1 },
      { startDate: at(2026, 11, 16, 23), quantity: 175, source: 'Contour' },
      { startDate: at(2026, 11, 16, 12), quantity: 700, source: 'Contour' }, // fuera de rango
    ],
  });
  const byV = (v: number) => r.glucose.find((g) => g.v === v)!;
  assert.equal(byV(300).cgm, true, 'Dexcom se reconoce por el nombre');
  assert.equal(byV(115).cgm, true, 'más de 30 lecturas al día de la misma fuente: sensor');
  assert.equal(byV(115).context, 'sensor');
  assert.equal(byV(98).context, 'ayunas');
  assert.equal(byV(165).context, 'despuesComer');
  assert.equal(byV(104).context, 'antesComer');
  assert.equal(byV(175).context, 'noche');
  assert.equal(r.glucose.some((g) => g.v === 700), false);
  assert.ok(r.glucose.every((g, i, a) => i === 0 || a[i - 1].at <= g.at), 'ordenadas por hora');
});

test('Salud: insulina lenta o rápida según el motivo, carbohidratos y proteína por día', () => {
  const r = toSnapshot({
    ...empty,
    insulin: [
      { startDate: at(2026, 11, 16, 22), quantity: 18, reason: 1 },
      { startDate: at(2026, 11, 16, 8), quantity: 4.46, reason: 2 },
      { startDate: at(2026, 11, 16, 9), quantity: 0 },
    ],
    carbs: [{ startDate: at(2026, 11, 16, 8), quantity: 44.6 }],
    protein: [
      { startDate: at(2026, 11, 16, 8), quantity: 25.4 },
      { startDate: at(2026, 11, 16, 14), quantity: 40.2 },
    ],
  });
  assert.deepEqual(r.insulin.map((x) => [x.units, x.kind]), [[18, 'basal'], [4.5, 'rapid']]);
  assert.deepEqual(r.carbs.map((x) => x.g), [45]);
  assert.deepEqual(r.proteinByDay, { '2026-11-16': 66 });
});

const snap = (over: Partial<HealthSnapshot> = {}): HealthSnapshot => ({
  stepsByDay: {},
  sleepByDay: {},
  weights: [],
  glucose: [],
  insulin: [],
  carbs: [],
  proteinByDay: {},
  ...over,
});
const base = (over: Partial<AppState> = {}): AppState => ({ ...initialState(), onboarded: true, ...over });

test('al sincronizar Salud, sus datos sustituyen a los de ejemplo', () => {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  let s = reducer(base(), { type: 'setProfile', profile: 't1' });
  const demoInsulin = s.insulin.length;
  assert.ok(demoInsulin > 0);
  s = reducer(s, {
    type: 'healthSync',
    at: iso(0),
    snapshot: snap({
      stepsByDay: { [dayKey(now)]: 4321 },
      weights: [{ at: iso(864e5), kg: 80.5 }],
      glucose: [
        { at: iso(3 * 3600e3), v: 140, cgm: true, context: 'sensor' },
        { at: iso(4 * 3600e3), v: 120, cgm: true, context: 'sensor' },
      ],
      insulin: [{ at: iso(5 * 3600e3), units: 3, kind: 'rapid' }],
      proteinByDay: { [dayKey(now)]: 999 },
    }),
  });
  assert.equal(s.dataSource, 'health');
  assert.equal(s.health?.connected, true);
  assert.deepEqual(s.glucose.map((g) => g.v), [140, 120]);
  assert.deepEqual(s.weights.map((w) => w.kg), [80.5]);
  assert.equal(s.insulin.length, 1);
  assert.equal(s.intake.find((x) => x.date === dayKey(now))?.protein, 999);
  assert.equal(stepsOn(s, dayKey(now), dayKey(now)), 4321);
  assert.equal(stepsOn(s, dayKeyAgo(1, now), dayKey(now)), 0, 'con Salud conectada, un día sin datos son 0 pasos');

  const off = reducer(s, { type: 'healthDisconnect' });
  assert.equal(off.health, null);
  assert.equal(off.dataSource, 'demo', 'al desconectar se vuelve a los datos de ejemplo');
  assert.ok(off.insulin.length === demoInsulin);
});

test('con Dexcom conectado, la glucosa de Salud no sustituye a la de Dexcom', () => {
  const s0 = base({ dataSource: 'dexcom', glucose: [{ id: 'd1', at: new Date().toISOString(), v: 111, context: 'sensor' }] });
  const s = reducer(s0, { type: 'healthSync', at: new Date().toISOString(), snapshot: snap({ glucose: [{ at: new Date().toISOString(), v: 222, cgm: true, context: 'sensor' }] }) });
  assert.equal(s.dataSource, 'dexcom');
  assert.deepEqual(s.glucose.map((g) => g.v), [111]);
});

test('Dexcom: las lecturas nuevas se suman a las guardadas, sin duplicados y solo de 30 días', () => {
  const now = Date.now();
  const t = (minAgo: number) => now - minAgo * 60e3;
  let s = base({ dataSource: 'dexcom', glucose: [] });
  s = reducer(s, { type: 'dexcom', patch: { connected: true, readings: [{ t: t(10), v: 100 }, { t: t(5), v: 104.4 }, { t: now - 31 * 864e5, v: 90 }] } });
  assert.deepEqual(s.glucose.map((g) => g.v), [100, 104]);
  assert.deepEqual(s.dexcom.readings, [], 'no se guardan dos veces');
  s = reducer(s, { type: 'dexcom', patch: { readings: [{ t: t(5), v: 104 }, { t: t(0), v: 110 }] } });
  assert.deepEqual(s.glucose.map((g) => g.v), [100, 104, 110]);
  assert.ok(s.glucose.every((g) => g.context === 'sensor' && g.id.startsWith('d')));

  const demo = reducer(base(), { type: 'dexcom', patch: { readings: [{ t: now, v: 150 }] } });
  assert.equal(demo.glucose.some((g) => g.id.startsWith('d')), false, 'si la fuente no es Dexcom, la glucosa no cambia');
});
