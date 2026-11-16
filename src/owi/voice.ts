/**
 * Voz de Owi: la frase que dice en "Hoy", calculada a partir de TUS datos.
 * - Cada día elige un tema distinto (racha, peso, inyección, tiempo en rango, proteína, fuerza, ánimo, hito…)
 *   y una de varias formas de decirlo, así no repite lo mismo cada mañana.
 * - Al tocar a Owi, pasa al siguiente tema.
 * - Fase 1: solo describe datos y hábitos. Nunca recomienda dosis ni da indicaciones clínicas.
 * Función pura: se prueba en tests/voice.test.ts.
 */
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { dayKey, dayKeyAgo, DAY_MS } from '../state/dates';
import type { Derived } from '../state/logic';
import { hasT2, isT1, usesGlp1, type AppState } from '../state/types';

const f1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');

/** Hash estable de una cadena (para elegir tema y variante por día). */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

type Insight = { id: string; key: string; vars: Record<string, string | number>; variants: number };

/** Temas posibles hoy, solo los que tienen datos que contar. */
export function insights(state: AppState, d: Derived, now = Date.now()): Insight[] {
  const out: Insight[] = [];
  const name = state.userName || t('common.friend');
  const add = (id: string, vars: Record<string, string | number>, variants = 3) => out.push({ id, key: `voice.${id}`, vars: { name, ...vars }, variants });

  if (d.streak >= 2) add('streak', { n: d.streak });

  // Peso: cambio en las últimas 4 semanas (solo si hay datos suficientes y va a la baja).
  const ws = [...state.weights].sort((a, b) => a.at.localeCompare(b.at)).filter((w) => now - new Date(w.at).getTime() < 29 * DAY_MS);
  if (ws.length >= 2 && ws[0].kg - ws[ws.length - 1].kg >= 0.3) add('weight4w', { kg: f1(ws[0].kg - ws[ws.length - 1].kg) });
  if (d.lostKg >= 1 && !d.maintenance) add('weightTotal', { kg: f1(d.lostKg), pct: f1(d.lostPct) }, 2);
  if (d.musclePct !== null && usesGlp1(state.profile)) add('muscle', { n: f1(d.musclePct) }, 2);

  if (usesGlp1(state.profile) && !d.maintenance && d.injectionWeeks >= 2) add('injections', { n: d.injectionWeeks });
  if (d.maintenance) add('maintenance', { n: d.maintWeeks }, 2);

  // Tipo 1: tiempo en rango de hoy frente a ayer (lecturas del sensor).
  if (isT1(state.profile) && d.tir24 > 0) {
    const yday = state.glucose.filter((g) => g.context === 'sensor' && dayKey(g.at) === dayKeyAgo(1, now));
    const tirY = yday.length ? Math.round((yday.filter((g) => g.v >= 70 && g.v <= 180).length / yday.length) * 100) : null;
    if (tirY !== null && d.tir24 > tirY) add('tirUp', { n: d.tir24, diff: d.tir24 - tirY }, 2);
    else add('tir', { n: d.tir24 }, 2);
  }

  // Tipo 2: media en ayunas de esta semana frente a la anterior.
  if (hasT2(state.profile)) {
    const fasting = (from: number, to: number) => {
      const xs = state.glucose.filter((g) => g.context === 'ayunas').filter((g) => {
        const t0 = now - new Date(g.at).getTime();
        return t0 >= from * DAY_MS && t0 < to * DAY_MS;
      });
      return xs.length ? Math.round(xs.reduce((a, g) => a + g.v, 0) / xs.length) : null;
    };
    const a = fasting(0, 7);
    const b = fasting(7, 14);
    if (a !== null && b !== null && a < b) add('fastingDown', { a, b }, 2);
    else if (a !== null) add('fasting', { a }, 2);
  }

  if (d.proteinToday >= state.goals.proteinG) add('proteinDone', { g: state.goals.proteinG }, 2);
  else if (d.proteinToday > 0) add('proteinLeft', { g: state.goals.proteinG - d.proteinToday }, 2);

  if (d.strengthThisWeek >= state.goals.strengthPerWeek) add('strengthDone', { n: d.strengthThisWeek }, 2);
  else add('strength', { a: d.strengthThisWeek, b: state.goals.strengthPerWeek }, 2);

  // Ánimo: media de esta semana frente a la anterior (check-ins).
  const mood = (from: number, to: number) => {
    const xs = state.checkins.filter((c) => c.date <= dayKeyAgo(from, now) && c.date > dayKeyAgo(to, now));
    return xs.length >= 2 ? xs.reduce((a, c) => a + c.v, 0) / xs.length : null;
  };
  const m1 = mood(0, 7);
  const m0 = mood(7, 14);
  if (m1 !== null && m0 !== null && m1 > m0 + 0.2) add('moodUp', {}, 2);

  if (d.nextMilestone && d.nextMilestone > d.treatmentWeek) add('milestone', { n: d.nextMilestone - d.treatmentWeek, label: t(`journey.m${d.nextMilestone}`) }, 2);

  const unread = state.messages.find((m) => !m.read && m.kind === 'audio' && m.from !== 'patient' && m.from !== 'owi');
  if (unread) add('audio', { who: TEAM[unread.from as keyof typeof TEAM]?.short ?? '' }, 2);

  return out;
}

/** Frase del día. `poke` avanza al siguiente tema cuando tocas a Owi. */
export function owiLine(state: AppState, d: Derived, poke = 0, now = Date.now()): { text: string; id: string } {
  const name = state.userName || t('common.friend');
  const vars = {
    name,
    streak: d.streak,
    who: TEAM.nutri.short,
    lost: f1(d.lostKg),
    pct: f1(d.lostPct),
    weeks: d.injectionWeeks,
    v: d.lastGlucose?.v ?? 0,
    tir: d.tir24,
  };
  // Situaciones que mandan sobre el tema del día (de más a menos importante).
  // Glucosa, sueño o sensor sin datos: lo dice la emoción de Owi.
  const moodFirst = ['worriedLow', 'caringLow', 'worriedHigh', 'confused', 'sleep'];
  if (moodFirst.includes(d.petMood) && !(d.petMood === 'caringHigh' && d.worstSymptomToday >= 2)) return { text: t(`owi.say.${d.petMood}`, vars), id: d.petMood };
  if (d.petMood === 'caringHigh' && d.worstSymptomToday < 2) return { text: t('owi.say.caringHigh', vars), id: 'caringHigh' };
  if (d.worstSymptomToday >= 2) return { text: t('owi.say.sideEffects', vars), id: 'sideEffects' };
  if (d.injectionOverdue) return { text: t('owi.say.missedInjection', vars), id: 'missedInjection' };
  if (d.plateau) return { text: t('owi.say.plateau', vars), id: 'plateau' };
  if (d.petMood === 'celebrate') return { text: t('owi.say.milestone', vars), id: 'milestone' };
  if (d.petMood === 'missYou' || d.petMood === 'attentive') return { text: t(`owi.say.${d.petMood}`, vars), id: d.petMood };
  const list = insights(state, d, now);
  if (!list.length) return { text: t('voice.fallback', { name }), id: 'fallback' };
  const seed = hash(`${dayKey(now)}|${state.userName}`);
  const ins = list[(seed + poke) % list.length];
  const variant = (Math.floor(seed / 7) + poke) % ins.variants;
  return { text: t(`${ins.key}.${variant}`, ins.vars), id: ins.id };
}
