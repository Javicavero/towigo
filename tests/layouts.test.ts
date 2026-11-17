import assert from 'node:assert/strict';
import { test } from 'node:test';
import { t } from '../src/i18n';
import { initialState, reducer } from '../src/state/logic';
import type { HomeLayout } from '../src/state/types';

const LAYOUTS: HomeLayout[] = ['panel', 'score', 'treatment', 'program', 'diary', 'timeline', 'summary'];

test('se puede elegir cualquier diseño de Hoy y todos tienen nombre y descripción', () => {
  let s = initialState();
  for (const l of LAYOUTS) {
    s = reducer(s, { type: 'setHomeLayout', layout: l });
    assert.equal(s.homeLayout, l);
    for (const k of [`layout.${l}`, `layout.${l}.sub`]) assert.notEqual(t(k), k, `falta ${k}`);
  }
});

test('las 8 lecciones del programa están completas y no dan indicaciones de dosis', () => {
  for (let i = 1; i <= 8; i++)
    for (const p of ['title', 'p1', 'p2', 'p3']) {
      const k = `lesson.${i}.${p}`;
      assert.notEqual(t(k), k, `falta ${k}`);
      assert.doesNotMatch(t(k), /(aumenta|reduce|sube|baja) (la |tu )?dosis|\d+\s?mg/i, `${k} no puede hablar de dosis`);
    }
});
