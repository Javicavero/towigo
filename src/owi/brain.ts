/**
 * "Cerebro" local de Owi para el chat (funciona sin conexión y es la red de seguridad de la IA).
 * - Entiende registros en lenguaje natural (al estilo Gluroo): "4 u de rápida hace 15 min", "45 g de carbos", "peso 98,5".
 * - Responde con TUS datos en lenguaje sencillo y prepara preguntas para la consulta.
 * - Límites de la Fase 1: nunca dice qué dosis ponerse ni da indicaciones clínicas; ante urgencias, 112.
 * Con el backend activado, las preguntas abiertas van a la IA (supabase/functions/owi-chat) con las mismas reglas.
 */
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import type { Derived } from '../state/store';
import { hasDiabetes, isT1, usesGlp1, type AppState, type InsulinKind } from '../state/types';

export type OwiAction =
  | { type: 'addInsulin'; units: number; kind: InsulinKind; minutesAgo?: number }
  | { type: 'addCarbs'; g: number; minutesAgo?: number }
  | { type: 'addIntake'; protein?: number; water?: number }
  | { type: 'addWeight'; entry: { kg: number } }
  | { type: 'addGlucose'; v: number; context: 'antesComer' }
  | { type: 'askTeam'; text: string }
  | { type: 'saveQuestions'; questions: string[] };

export type Chip = { label: string; send?: string; action?: OwiAction; open?: 'injection' | 'effects' | 'team' | 'checkin' };
export type OwiReply = { text: string; chips?: Chip[]; confirm?: OwiAction; mood?: 'happy' | 'attentive' | 'caringHigh' | 'celebrate' | 'remind' };

const num = (s: string) => parseFloat(s.replace(',', '.'));
const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** "hace 15 min", "hace media hora", "hace una hora", "hace 2 horas" → minutos. */
function minutesAgo(s: string): number | undefined {
  if (/hace media hora/.test(s)) return 30;
  if (/hace (una|1) hora/.test(s)) return 60;
  const h = s.match(/hace (\d+) ?h/);
  if (h) return Number(h[1]) * 60;
  const m = s.match(/hace (\d+) ?m/);
  return m ? Number(m[1]) : undefined;
}
const agoText = (m?: number) => (m ? t('chat.agoMin', { n: m }) : t('chat.agoNow'));

export const SUGGESTIONS = (p: AppState['profile']): string[] =>
  [
    t('chat.sug.how'),
    ...(isT1(p) ? [t('chat.sug.insulin'), t('chat.sug.carbs')] : []),
    ...(usesGlp1(p) ? [t('chat.sug.nausea')] : []),
    t('chat.sug.questions'),
    t('chat.sug.feel'),
  ].slice(0, 5);

export function owiThink(input: string, state: AppState, d: Derived): OwiReply {
  const s = norm(input.trim());
  const name = state.userName || t('common.friend');
  const askTeamChip = (text: string): Chip => ({ label: t('chat.askTeam'), action: { type: 'askTeam', text } });

  // 1) Urgencias: siempre lo primero.
  if (/(no puedo respirar|dolor (fuerte|en el pecho|de pecho)|me desmay|desmayo|inconscien|convulsi|urgencia|112)/.test(s))
    return { text: t('chat.emergency'), mood: 'caringHigh' };

  // 2) Preguntas de dosis: Owi no calcula ni sugiere.
  if (/(cuant[ao]s? (unidades|u\b|insulina|mg)|que dosis|cuanto me (pongo|pincho)|debo (ponerme|pincharme|subir|bajar)|subo la dosis|bajo la dosis|bolo|correccion|corregir|ratio|factor de sensibilidad)/.test(s))
    return {
      text: t('chat.noDose', { who: TEAM.endo.short }),
      chips: [askTeamChip(t('chat.doseQuestionMsg', { q: input.trim() }))],
      mood: 'attentive',
    };

  // 3) Bajadas: acompañar y remitir al plan del equipo.
  if (/(estoy bajo|estoy baja|hipo\b|hipoglucemia|me noto baj|tengo una bajada)/.test(s))
    return { text: t('chat.low'), chips: hasDiabetes(state.profile) ? [{ label: t('chat.logGlucose'), send: t('chat.glucoseExample') }] : undefined, mood: 'caringHigh' };

  // 4) Registros en lenguaje natural.
  const ins = s.match(/(\d+(?:[.,]\d+)?)\s*(u|ui|unidades|unidad)\b/);
  if (ins && /(insulina|rapida|lenta|basal|bolo|u\b|ui|unidad)/.test(s)) {
    if (!isT1(state.profile)) return { text: t('chat.noInsulinPlan') };
    const kind: InsulinKind = /(lenta|basal)/.test(s) ? 'basal' : 'rapid';
    const units = num(ins[1]);
    const m = minutesAgo(s);
    return { text: t('chat.confirmInsulin', { n: fmt(units), kind: t(kind === 'basal' ? 'chat.basal' : 'chat.rapid'), when: agoText(m) }), confirm: { type: 'addInsulin', units, kind, minutesAgo: m } };
  }
  const carb = s.match(/(\d+)\s*(g|gr|gramos)?\s*(de\s*)?(carbohidratos|carbos|hidratos|hc|ch)\b/) ?? s.match(/(\d+(?:[.,]\d+)?)\s*raciones?/);
  if (carb) {
    const g = /racion/.test(carb[0]) ? Math.round(num(carb[1]) * 10) : Number(carb[1]);
    const m = minutesAgo(s);
    return { text: t('chat.confirmCarbs', { n: g, when: agoText(m) }), confirm: { type: 'addCarbs', g, minutesAgo: m } };
  }
  const prot = s.match(/(\d+)\s*(g|gr|gramos)\s*(de\s*)?prote/);
  if (prot) return { text: t('chat.confirmProtein', { n: prot[1] }), confirm: { type: 'addIntake', protein: Number(prot[1]) } };
  const kg = s.match(/(peso|pese|pesado|bascula)\D{0,12}(\d{2,3}(?:[.,]\d)?)/) ?? s.match(/(\d{2,3}[.,]\d)\s*(kg|kilos)/) ?? s.match(/\b(\d{2,3})\s*(kg|kilos)\b/);
  if (kg) {
    const v = num(kg[2] && /\d/.test(kg[2]) ? kg[2] : kg[1]);
    if (v > 30 && v < 300) return { text: t('chat.confirmWeight', { n: fmt(v) }), confirm: { type: 'addWeight', entry: { kg: v } } };
  }
  const glu = s.match(/(glucosa|azucar|glucemia|me he medido|tengo)\D{0,12}(\d{2,3})\b/) ?? s.match(/\b(\d{2,3})\s*(mg)/);
  if (glu && hasDiabetes(state.profile)) {
    const v = Number(/\d/.test(glu[2] ?? '') ? glu[2] : glu[1]);
    if (v >= 20 && v <= 600) return { text: t('chat.confirmGlucose', { n: v }), confirm: { type: 'addGlucose', v, context: 'antesComer' } };
  }
  if (/(vaso de agua|he bebido agua|agua)/.test(s) && !/\?/.test(s)) return { text: t('chat.confirmWater'), confirm: { type: 'addIntake', water: 1 } };
  if (/(me he pinchado|me he puesto la inyeccion|ya me he inyectado|inyeccion hecha)/.test(s) && usesGlp1(state.profile))
    return { text: t('chat.injection'), chips: [{ label: t('chat.openInjection'), open: 'injection' }] };

  // 5) Cómo me siento.
  if (/(me siento|estoy) (mal|triste|cansad|agobiad|desanimad|harto|harta|sin ganas|sin energia|fatal)/.test(s) || /(ansiedad|ansios)/.test(s))
    return {
      text: t('chat.feelBad', { name }),
      chips: [{ label: t('chat.doCheckin'), open: 'checkin' }, askTeamChip(t('chat.feelBadMsg'))],
      mood: 'caringHigh',
    };
  if (/(me siento|estoy) (bien|genial|contento|contenta|mejor|fenomenal)/.test(s)) return { text: t('chat.feelGood', { name }), mood: 'celebrate' };

  // 6) Efectos secundarios: consejos generales de la nutricionista (no clínicos).
  const sym = (['nausea', 'estrenimiento', 'ardor', 'fatiga'] as const).find((k) => s.includes(k === 'fatiga' ? 'cansanc' : k === 'ardor' ? 'ardor' : k));
  if (sym) return { text: t('chat.symptom', { tip: t(`tip.${sym}`), who: TEAM.nutri.short }), chips: [{ label: t('chat.logEffects'), open: 'effects' }] };

  // 7) ¿Cómo voy?
  if (/(como voy|resumen|que tal voy|mis datos|como estoy|como va)/.test(s)) return { text: summary(state, d, name), mood: 'happy', chips: [{ label: t('chat.sug.questions'), send: t('chat.sug.questions') }] };

  // 8) Preguntas para la consulta.
  if (/(pregunta|consulta|cita|medico|endocrin)/.test(s)) {
    const qs = consultQuestions(state, d);
    return {
      text: t('chat.questions') + '\n\n' + qs.map((q, i) => `${i + 1}. ${q}`).join('\n'),
      chips: [{ label: t('chat.saveQuestions'), action: { type: 'saveQuestions', questions: qs } }],
    };
  }

  // 9) Explicaciones sencillas.
  for (const k of ['tir', 'hba1c', 'meseta', 'proteina', 'musculo', 'glp1', 'sensor'] as const) {
    const re = { tir: /(tiempo en rango|\btir\b|en rango)/, hba1c: /(hba1c|hemoglobina)/, meseta: /(meseta|no bajo|estancad)/, proteina: /proteina/, musculo: /musculo/, glp1: /(glp|ozempic|wegovy|mounjaro|semaglutida|tirzepatida)/, sensor: /(sensor|dexcom|libre)/ }[k];
    if (re.test(s)) return { text: t(`chat.explain.${k}`) };
  }

  // 10) Saludos y gracias.
  if (/^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches)/.test(s)) return { text: t('chat.hello', { name }), mood: 'happy' };
  if (/(gracias|genial|guay|vale)/.test(s)) return { text: t('chat.thanks'), mood: 'celebrate' };

  return { text: t('chat.unknown'), chips: SUGGESTIONS(state.profile).slice(0, 3).map((x) => ({ label: x, send: x })) };
}

function summary(state: AppState, d: Derived, name: string) {
  const parts: string[] = [t('chat.sum.streak', { name, n: d.streak })];
  if (isT1(state.profile)) parts.push(t('chat.sum.t1', { tir: d.tir24, avg: d.avg24 ?? '—', lows: d.lows24 }));
  else if (hasDiabetes(state.profile) && d.lastGlucose) parts.push(t('chat.sum.t2', { pct: d.glucoseInTargetPct }));
  if (usesGlp1(state.profile)) parts.push(t('chat.sum.glp1', { weeks: d.injectionWeeks }));
  if (d.lostKg >= 1) parts.push(t('chat.sum.weight', { kg: fmt(d.lostKg), pct: fmt(d.lostPct) }));
  if (d.musclePct !== null && usesGlp1(state.profile)) parts.push(t('chat.sum.muscle', { n: fmt(d.musclePct) }));
  parts.push(t('chat.sum.strength', { a: d.strengthThisWeek, b: state.goals.strengthPerWeek }));
  return parts.join(' ');
}

/** Preguntas útiles para la próxima consulta, a partir de lo que ha pasado (sin interpretar). */
export function consultQuestions(state: AppState, d: Derived): string[] {
  const q: string[] = [];
  if (usesGlp1(state.profile) && d.nextPhase) q.push(t('chat.q.phase', { dose: fmt(d.nextPhase.dose) }));
  if (d.plateau) q.push(t('chat.q.plateau'));
  if (state.sideEffects.length) q.push(t('chat.q.effects'));
  if (isT1(state.profile) && d.lows24 > 0) q.push(t('chat.q.lows'));
  if (isT1(state.profile)) q.push(t('chat.q.tir'));
  if (hasDiabetes(state.profile) && d.hba1cNow !== null) q.push(t('chat.q.hba1c'));
  q.push(t('chat.q.strength'));
  return q.slice(0, 5);
}
