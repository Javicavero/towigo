import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AUDIENCES, minutesFor, STEPS, stepsFor } from '../src/demo/script';
import { t } from '../src/i18n';
import { derive, initialState, reducer } from '../src/state/logic';

test('cada recorrido empieza en la portada, acaba en el cierre y dura poco', () => {
  for (const a of AUDIENCES) {
    const s = stepsFor(a);
    assert.equal(s[0].view, 'cover', `${a}: empieza en la portada`);
    assert.equal(s[s.length - 1].view, 'end', `${a}: acaba en el cierre`);
    assert.ok(minutesFor(a) <= 4, `${a}: dura como mucho 4 min (dura ${minutesFor(a)})`);
  }
  assert.ok(stepsFor('quick').length < stepsFor('full').length, 'la rápida es más corta que la completa');
  assert.ok(!stepsFor('patients').some((s) => s.view === 'pro' || s.view === 'proPatient'), 'pacientes: sin panel profesional');
  assert.ok(stepsFor('clinic').some((s) => s.view === 'pro'), 'equipo sanitario: con panel profesional');
});

test('todos los pasos tienen textos y ninguno indica dosis', () => {
  const ids = new Set<string>();
  for (const s of STEPS) {
    assert.ok(!ids.has(s.id), `id repetido: ${s.id}`);
    ids.add(s.id);
    for (const k of [`pres.s.${s.id}.title`, `pres.s.${s.id}.say`, `pres.ch.${s.chapter}`]) {
      const v = t(k);
      assert.notEqual(v, k, `falta el texto ${k}`);
      assert.doesNotMatch(v, /(ponte|aumenta|reduce|sube|baja) (la |tu )?(dosis|insulina)|\d+\s?u de/i, `${k} no puede indicar dosis`);
    }
  }
  for (const a of AUDIENCES) for (const k of [`pres.aud.${a}`, `pres.aud.${a}.sub`]) assert.notEqual(t(k), k, `falta ${k}`);
});

test('los perfiles y situaciones del guion se pueden cargar', () => {
  let s = { ...initialState(), onboarded: true, userName: 'Laura' };
  for (const st of STEPS) {
    if (st.profile && st.profile !== s.profile) s = reducer(s, { type: 'setProfile', profile: st.profile });
    if (st.scenario) s = reducer(s, { type: 'setScenario', scenario: st.scenario });
    if (st.reminder) s = reducer(s, { type: 'setDemoReminder', kind: st.reminder });
    const d = derive(s, Date.now());
    if (st.reminder) assert.ok(d.reminders.some((r) => r.kind === st.reminder), `${st.id}: aparece el aviso ${st.reminder}`);
    if (st.scenario === 'lowGlucose') assert.match(d.petMood, /Low/, `${st.id}: Owi reacciona a la glucosa baja`);
    if (st.scenario === 'sideEffects') assert.ok(d.worstSymptomToday >= 2, `${st.id}: hay efectos secundarios hoy`);
  }
});

test('la glucosa baja o alta de ejemplo es siempre la última lectura del sensor, a cualquier hora', async () => {
  const { demoCgm } = await import('../src/data/mock');
  const base = new Date(2026, 10, 17, 9, 0).getTime();
  for (let m = 0; m < 30; m++) {
    const now = base + m * 60e3 + 30e3;
    for (const [sc, v] of [['lowGlucose', 63], ['highGlucose', 248]] as const) {
      const xs = demoCgm(sc, now).sort((a, b) => a.at.localeCompare(b.at));
      assert.equal(xs[xs.length - 1].v, v, `${sc} a las 9:${m}`);
    }
  }
});
