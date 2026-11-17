import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseClarityCsv, shiftDaysToNow } from '../src/data/clarityImport';
import { derive, initialState, reducer } from '../src/state/logic';

// Datos inventados (no son de ningún paciente).
const EN = [
  'Index,Timestamp (YYYY-MM-DDThh:mm:ss),Event Type,Event Subtype,Patient Info,Device Info,Source Device ID,Glucose Value (mg/dL),Insulin Value (u),Carb Value (grams),Duration (hh:mm:ss),Glucose Rate of Change (mg/dL/min),Transmitter Time (Long Integer),Transmitter ID',
  '1,,FirstName,,Ana,,,,,,,,,',
  '2,,LastName,,Prueba,,,,,,,,,',
  '3,,DateOfBirth,,1990-01-01,,,,,,,,,',
  '10,2026-03-01T08:00:00,EGV,,,"iPhone G7",iPhone,112,,,,,1,AB',
  '11,2026-03-01T08:05:00,EGV,,,"iPhone G7",iPhone,Low,,,,,2,AB',
  '12,2026-03-01T08:10:00,EGV,,,"iPhone G7",iPhone,High,,,,,3,AB',
  '13,2026-03-01T08:12:00,Calibration,,,,,99,,,,,,',
  '14,2026-03-01T08:15:00,Insulin,Fast-Acting,,,,,4.5,,,,,',
  '15,2026-03-01T22:00:00,Insulin,Long-Acting,,,,,18,,,,,',
  '16,2026-03-01T08:20:00,Carbs,,,,,,,45,,,,',
  '17,2026-03-01T08:25:00,EGV,,,"iPhone G7",iPhone,140,,,,,4,AB',
].join('\n');

test('lee glucosa, insulina y carbohidratos de una exportación de Clarity e ignora los datos personales', () => {
  const r = parseClarityCsv(EN);
  assert.deepEqual(r.glucose.map((g) => g.v), [112, 39, 401, 140]);
  assert.equal(r.insulin.length, 2);
  assert.equal(r.insulin.find((i) => i.units === 18)?.kind, 'basal');
  assert.equal(r.insulin.find((i) => i.units === 4.5)?.kind, 'rapid');
  assert.deepEqual(r.carbs.map((c) => c.g), [45]);
  assert.ok(!JSON.stringify(r).includes('Ana') && !JSON.stringify(r).includes('1990'));
  assert.equal(new Date(r.from!).getHours(), 8, 'hora local del dispositivo');
});

test('acepta separador ";", cabeceras en español y mmol/L', () => {
  const ES = ['Índice;Marca de tiempo (AAAA-MM-DDThh:mm:ss);Tipo de evento;Subtipo de evento;Valor de glucosa (mmol/L)', '1;2026-03-01T09:00:00;EGV;;6,2', '2;2026-03-01T09:05:00;EGV;;Bajo'].join('\n');
  const r = parseClarityCsv(ES);
  assert.deepEqual(r.glucose.map((g) => g.v), [112, 39]);
  assert.equal(parseClarityCsv('hola,mundo').glucose.length, 0);
});

test('importar sustituye los datos de ejemplo y alinea con hoy sin dejar lecturas en el futuro', () => {
  const now = Date.now();
  const day = 864e5;
  const glucose = Array.from({ length: 288 * 3 }, (_, i) => ({ at: now - 20 * day + i * 5 * 60e3, v: 100 + (i % 50) }));
  const shift = shiftDaysToNow(glucose[glucose.length - 1].at, now);
  let s = reducer({ ...initialState(), onboarded: true }, { type: 'setProfile', profile: 't1' });
  s = reducer(s, { type: 'importSensor', glucose, insulin: [], carbs: [], shiftDays: shift });
  assert.equal(s.dataSource, 'import');
  assert.ok(s.glucose.every((g) => new Date(g.at).getTime() <= Date.now()), 'nada en el futuro');
  assert.ok(s.glucose.every((g) => g.context === 'sensor' && g.id.startsWith('i')));
  const last = Math.max(...s.glucose.map((g) => new Date(g.at).getTime()));
  assert.ok(Date.now() - last < 24 * 3600e3, 'la última lectura es de las últimas 24 h');
  const d = derive(s, Date.now());
  assert.ok(d.tir24 >= 0 && d.tir24 <= 100);
  // volver a los datos de ejemplo
  s = reducer(s, { type: 'setProfile', profile: 't1' });
  assert.equal(s.dataSource, 'demo');
});
