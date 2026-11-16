import assert from 'node:assert/strict';
import { test } from 'node:test';
import { insights, owiLine } from '../src/owi/voice';
import { derive, initialState, reducer } from '../src/state/logic';
import type { AppState, Profile } from '../src/state/types';

const make = (profile: Profile): AppState => reducer({ ...initialState(), onboarded: true, userName: 'Ana' }, { type: 'setProfile', profile });

test('Owi cambia de frase según el día y al tocarlo', () => {
  const s = make('glp1');
  const day = (n: number) => new Date(2026, 10, 1 + n, 12).getTime();
  const d0 = derive(s, day(0));
  const week = new Set(Array.from({ length: 7 }, (_, i) => owiLine(s, derive(s, day(i)), 0, day(i)).text));
  assert.ok(week.size >= 3, `en una semana dice al menos 3 frases distintas (dijo ${week.size})`);
  assert.notEqual(owiLine(s, d0, 0, day(0)).text, owiLine(s, d0, 1, day(0)).text, 'al tocarlo cambia de tema');
});

test('cada perfil tiene temas propios y ninguna frase da dosis ni deja variables sin rellenar', () => {
  for (const p of ['t1', 't2', 'glp1', 't2_glp1'] as Profile[]) {
    const s = make(p);
    const d = derive(s, Date.now());
    const list = insights(s, d);
    assert.ok(list.length >= 4, `${p}: al menos 4 temas`);
    for (let poke = 0; poke < list.length * 3; poke++) {
      const { text } = owiLine(s, d, poke);
      assert.doesNotMatch(text, /\{\w+\}/, `${p}: variable sin rellenar en "${text}"`);
      assert.doesNotMatch(text, /voice\./, `${p}: falta el texto de "${text}"`);
      assert.doesNotMatch(text, /(ponte|aumenta|reduce|sube|baja) (la |tu )?(dosis|insulina)|\d+\s?u de/i, `${p}: no puede indicar dosis: "${text}"`);
    }
  }
  assert.ok(insights(make('t1'), derive(make('t1'), Date.now())).some((i) => i.id.startsWith('tir')), 'tipo 1 habla del tiempo en rango');
  assert.ok(insights(make('t2'), derive(make('t2'), Date.now())).some((i) => i.id.startsWith('fasting')), 'tipo 2 habla de ayunas');
  assert.ok(insights(make('glp1'), derive(make('glp1'), Date.now())).some((i) => i.id === 'injections'), 'GLP-1 habla de inyecciones');
});

test('las situaciones importantes mandan sobre el tema del día', () => {
  const s = reducer(make('glp1'), { type: 'setScenario', scenario: 'missedInjection' });
  const d = derive(s, Date.now());
  assert.equal(owiLine(s, d).id, 'missedInjection');
});
