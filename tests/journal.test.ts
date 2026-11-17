import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activityLoad, activityTarget, journalDays, journalImpact, keyStats, wellbeing } from '../src/state/journal';
import { initialState, reducer } from '../src/state/logic';
import type { AppState, Profile } from '../src/state/types';
import { dayKey } from '../src/state/dates';

const make = (p: Profile): AppState => reducer({ ...initialState(), onboarded: true }, { type: 'setProfile', profile: p });

test('la carga de actividad va de 0 a 21 y sube con una sesión de fuerza', () => {
  const s = make('glp1');
  const a = activityLoad(s);
  assert.ok(a > 0 && a <= 21);
  const b = activityLoad(reducer(s, { type: 'addStrength', routine: 'base' }));
  assert.ok(b > a, `con fuerza sube (${a} → ${b})`);
  const [lo, hi] = activityTarget(s);
  assert.ok(lo < hi && hi <= 21);
});

test('el diario guarda las respuestas de hoy y el análisis compara días con sí y con no', () => {
  let s = make('glp1');
  s = reducer(s, { type: 'journal', q: 'sleep7', v: true });
  assert.equal(journalDays(s)[dayKey(Date.now())].sleep7, true);
  s = reducer(s, { type: 'journal', q: 'sleep7', v: null });
  assert.equal(s.journal?.[dayKey(Date.now())]?.sleep7, undefined);
  const imp = journalImpact(make('t1'));
  assert.ok(imp.length >= 3, 'hay suficientes días para comparar');
  for (const i of imp) assert.ok(i.yes >= 3 && i.no >= 3 && Number.isFinite(i.diff));
});

test('estadísticas clave y bienestar tienen valores válidos en cada perfil', () => {
  for (const p of ['t1', 't2', 'glp1', 't2_glp1'] as Profile[]) {
    const s = make(p);
    const ks = keyStats(s);
    assert.ok(ks.length >= 3, p);
    for (const k of ks) assert.ok(Number.isFinite(k.value), `${p}/${k.id}`);
    const w = wellbeing(s);
    assert.ok(w === null || (w >= 0 && w <= 100));
  }
  assert.ok(keyStats(make('t1')).some((k) => k.id === 'tir'), 'tipo 1: tiempo en rango');
});

test('en la demo, los hábitos que más pesan van en el sentido esperado (buenos suman, malos restan)', () => {
  for (const p of ['t1', 't2', 'glp1', 't2_glp1'] as Profile[])
    for (const i of journalImpact(make(p)))
      if (Math.abs(i.diff) >= 3) assert.equal(i.diff > 0, i.good, `${p}/${i.id}: ${i.diff}`);
});
