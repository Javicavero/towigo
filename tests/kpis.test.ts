import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, reducer } from '../src/state/logic';
import { fmtDelta, weeklyKpis } from '../src/state/kpis';
import type { AppState, Profile } from '../src/state/types';

const make = (profile: Profile): AppState => reducer({ ...initialState(), onboarded: true, userName: 'Ana' }, { type: 'setProfile', profile });

test('cada perfil tiene sus indicadores de la semana', () => {
  const ids = (p: Profile) => weeklyKpis(make(p)).map((k) => k.id);
  assert.ok(ids('t1').includes('tir') && ids('t1').includes('glucoseAvg'), 'tipo 1: tiempo en rango y glucosa media');
  assert.ok(!ids('glp1').includes('tir'), 'GLP-1 sin diabetes: sin glucosa');
  assert.ok(ids('glp1').includes('adherence') && ids('glp1').includes('weight'), 'GLP-1: adherencia y peso');
  assert.ok(ids('t2').includes('glucoseAvg'), 'tipo 2: glucosa media');
});

test('los cambios se comparan con la semana anterior y tienen buena o mala dirección', () => {
  const k = weeklyKpis(make('glp1'));
  const w = k.find((x) => x.id === 'weight')!;
  assert.notEqual(w.delta, null, 'hay peso de la semana anterior');
  assert.equal(w.good, w.delta! < 0 ? true : w.delta! > 0 ? false : null, 'bajar peso cuenta como buena dirección');
  const t1 = weeklyKpis(make('t1'));
  const tir = t1.find((x) => x.id === 'tir')!;
  assert.notEqual(tir.delta, null, 'el sensor tiene dos semanas para comparar');
  assert.ok(tir.value >= 0 && tir.value <= 100);
  for (const x of [...k, ...t1]) {
    assert.ok(Number.isFinite(x.value), `${x.id}: valor numérico`);
    assert.match(fmtDelta(x), /^([+−]\d+(,\d)?|=|)$/, `${x.id}: cambio con formato "${fmtDelta(x)}"`);
  }
});
