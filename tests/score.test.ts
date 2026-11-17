import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, reducer } from '../src/state/logic';
import { scoreHistory, towigoScore } from '../src/state/score';
import type { AppState, Profile } from '../src/state/types';

const make = (profile: Profile): AppState => reducer({ ...initialState(), onboarded: true, userName: 'Ana' }, { type: 'setProfile', profile });

test('el índice va de 0 a 100 en todos los perfiles y usa las áreas que tienen datos', () => {
  for (const p of ['t1', 't2', 'glp1', 't2_glp1'] as Profile[]) {
    const sc = towigoScore(make(p));
    assert.ok(sc.value >= 0 && sc.value <= 100, `${p}: ${sc.value}`);
    assert.ok(sc.areas.length >= 4, `${p}: al menos 4 áreas (${sc.areas.map((a) => a.id)})`);
    for (const a of sc.areas) assert.ok(a.score >= 0 && a.score <= 100, `${p}/${a.id}: ${a.score}`);
  }
  assert.ok(towigoScore(make('t1')).areas.some((a) => a.id === 'glucose'), 'tipo 1: cuenta la glucosa');
  assert.ok(!towigoScore(make('glp1')).areas.some((a) => a.id === 'glucose'), 'GLP-1 sin diabetes: no cuenta la glucosa');
});

test('los buenos hábitos suben el índice y una inyección olvidada lo baja', () => {
  const s = make('glp1');
  const base = towigoScore(s).value;
  const better = reducer(reducer(s, { type: 'checkin', v: 5, tags: [], share: false }), { type: 'addStrength', routine: 'base' });
  assert.ok(towigoScore(better).value >= base, 'ánimo alto y fuerza no lo bajan');
  const missed = reducer(s, { type: 'setScenario', scenario: 'missedInjection' });
  assert.ok(towigoScore(missed).value < towigoScore(reducer(s, { type: 'setScenario', scenario: 'normal' })).value, 'inyección olvidada lo baja');
});

test('hay historial de 14 días', () => {
  const h = scoreHistory(make('t1'));
  assert.equal(h.length, 14);
  assert.ok(h.every((v) => v >= 0 && v <= 100));
});
