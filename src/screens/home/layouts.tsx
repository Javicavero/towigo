/**
 * Diseños de la pantalla Hoy (el paciente elige el que prefiera; Owi está en todos como asistente).
 * Cada uno toma un FORMATO conocido, con la identidad y los datos de Towigo:
 *  - treatment  Tratamiento primero (formato registro de dosis)
 *  - score      Índice del día (formato anillo de recuperación)
 *  - program    Programa diario (formato curso con lecciones)
 *  - diary      Diario (formato registro de comidas)
 *  - timeline   Línea del día (formato muro cronológico)
 *  - summary    Resumen en tarjetas (formato app de salud del móvil)
 * Regla de limpieza: a la vista, solo lo esencial; el detalle se abre en subventanas (components/sheet.tsx).
 * El diseño "panel" (por defecto) está en Home.tsx.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { MoodFace } from '../../components/checkin';
import { Icon, type IconName } from '../../components/icons';
import { Sparkline } from '../../components/kpi';
import OwiSticker from '../../components/OwiSticker';
import { BAND_COLOR, ScoreGauge } from '../../components/score';
import { DrillGroup, DrillRow, Sheet } from '../../components/sheet';
import { T1Card } from '../../components/t1';
import { TodayList } from '../../components/today';
import { Button, Row, T } from '../../components/ui';
import { STEPS_GOAL, STEPS_TODAY } from '../../data/mock';
import { t } from '../../i18n';
import { useNav } from '../../nav';
import { dayKey } from '../../state/dates';
import { scoreHistory, towigoScore } from '../../state/score';
import { useStore } from '../../state/store';
import { hasDiabetes, isT1, usesGlp1, type HomeLayout } from '../../state/types';
import { colors, fonts, isDark } from '../../theme';

export const HOME_LAYOUTS: HomeLayout[] = ['panel', 'score', 'treatment', 'program', 'diary', 'timeline', 'summary'];
const LAYOUT_ICON: Record<HomeLayout, IconName> = { panel: 'home', score: 'trophy', treatment: 'syringe', program: 'check', diary: 'meal', timeline: 'clock', summary: 'widget' };

const f1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const panelBg = isDark ? 'rgba(255,255,255,0.045)' : colors.white;
const border = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)';
const box = { backgroundColor: panelBg, borderWidth: 1, borderColor: border, borderRadius: 22, padding: 16, gap: 12 } as const;
const label = { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6 } as const;
const good = isDark ? '#3DE0C8' : '#0E8F7E';
const isToday = (at: string) => dayKey(new Date(at).getTime()) === dayKey(Date.now());
const hhmm = (at: string) => new Date(at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const fmtDose = (x: number) => String(x).replace('.', ',');

/** Botón "Diseño" (cabecera de Hoy): abre la subventana para elegir cómo se ve Hoy. */
export function LayoutButton() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const cur = state.homeLayout ?? 'panel';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('layout.a11y')}: ${t(`layout.${cur}`)}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: panelBg, borderWidth: 1, borderColor: border, opacity: pressed ? 0.7 : 1 })}
      >
        <Icon name="widget" size={17} color={colors.ink} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('layout.a11y')} subtitle={t('layout.sheetSub')}>
        <DrillGroup>
          {HOME_LAYOUTS.map((l, i) => {
            const on = l === cur;
            return (
              <Pressable
                key={l}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t(`layout.${l}`)}: ${t(`layout.${l}.sub`)}`}
                onPress={() => {
                  dispatch({ type: 'setHomeLayout', layout: l });
                  setOpen(false);
                }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: i < HOME_LAYOUTS.length - 1 ? 1 : 0, borderBottomColor: border, backgroundColor: on ? colors.softGreen : pressed ? 'rgba(27,22,48,0.03)' : 'transparent' })}
              >
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: on ? colors.greenText : colors.softGreen, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={LAYOUT_ICON[l]} size={17} color={on ? colors.onAccent : colors.greenText} />
                </View>
                <View style={{ flex: 1 }}>
                  <T v="label" style={{ fontFamily: fonts.semibold }}>
                    {t(`layout.${l}`)}
                  </T>
                  <T v="small" color={colors.secondary}>
                    {t(`layout.${l}.sub`)}
                  </T>
                </View>
                {on && <Icon name="check" size={18} color={colors.greenText} stroke={3} />}
              </Pressable>
            );
          })}
        </DrillGroup>
      </Sheet>
    </>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.white }}>
      <T v="small">{text}</T>
    </View>
  );
}

// ---------------------------------------------------------------- A · Tratamiento primero
function useDoses() {
  const { state } = useStore();
  const now = Date.now();
  const inj = [...state.injections].sort((a, b) => a.at.localeCompare(b.at));
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = now - (11 - i) * 7 * 864e5;
    const hit = inj.find((x) => {
      const tt = new Date(x.at).getTime();
      return tt <= end && end - tt < 7 * 864e5;
    });
    return hit ? hit.dose : null;
  });
  const ws = [...state.weights].sort((a, b) => a.at.localeCompare(b.at));
  const kgAt = (tt: number) => [...ws].reverse().find((w) => new Date(w.at).getTime() <= tt)?.kg ?? ws[0]?.kg ?? null;
  const doses = [...new Set(inj.map((x) => x.dose))];
  const byDose = doses.map((dose, i) => {
    const from = new Date(inj.find((x) => x.dose === dose)!.at).getTime();
    const nextDose = doses[i + 1];
    const to = nextDose !== undefined ? new Date(inj.find((x) => x.dose === nextDose)!.at).getTime() : now;
    const a = kgAt(from);
    const b = kgAt(to);
    return { dose, delta: a !== null && b !== null ? b - a : 0 };
  });
  const effectWeeks = new Set(state.sideEffects.map((e) => Math.floor((now - new Date(e.at).getTime()) / (7 * 864e5)))).size;
  return { weeks, byDose, effectWeeks };
}

export function TreatmentLayout() {
  const { state, d } = useStore();
  const { go } = useNav();
  const [open, setOpen] = useState<null | 'calendar' | 'dose'>(null);
  const { weeks, byDose, effectWeeks } = useDoses();
  if (!usesGlp1(state.profile) || d.maintenance) {
    return (
      <View style={{ gap: 12 }}>
        {isT1(state.profile) ? <T1Card compact /> : null}
        <DrillGroup>
          <DrillRow icon="syringe" title={t('layout.treatment.title')} value={isT1(state.profile) ? `${d.rapidTodayU} u` : `${d.medsToday.filter((m) => m.taken).length}/${d.medsToday.length}`} onPress={() => setOpen('calendar')} last />
        </DrillGroup>
        <Sheet open={open !== null} onClose={() => setOpen(null)} title={t('layout.treatment.title')}>
          {isT1(state.profile) ? <T1Card /> : <TodayList />}
        </Sheet>
      </View>
    );
  }
  const days = d.injectedToday ? 7 : Math.max(0, d.daysToInjection ?? 0);
  const frac = d.injectedToday ? 1 : 1 - Math.min(7, days) / 7;
  const next = d.nextInjectionAt ? new Date(d.nextInjectionAt) : null;
  const ring = 2 * Math.PI * 50;
  const maxLoss = Math.max(0.1, ...byDose.map((x) => -x.delta));
  const total = byDose.reduce((a, x) => a + x.delta, 0);
  return (
    <View style={{ gap: 12 }}>
      <View style={[box, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
        <Svg width={116} height={116} accessibilityLabel={t('layout.treatment.ringA11y', { n: days })}>
          <Circle cx={58} cy={58} r={50} stroke={isDark ? 'rgba(255,255,255,0.09)' : '#ECE7F8'} strokeWidth={10} fill="none" />
          <Circle cx={58} cy={58} r={50} stroke={d.injectionOverdue ? colors.coralText : colors.greenText} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${Math.max(0.02, frac) * ring} ${ring}`} transform="rotate(-90 58 58)" />
          <SvgText x={58} y={58} textAnchor="middle" fontFamily={fonts.bold} fontSize={28} fill={colors.ink}>
            {d.injectedToday ? '✓' : `${days} d`}
          </SvgText>
          <SvgText x={58} y={78} textAnchor="middle" fontFamily={fonts.regular} fontSize={11} fill={colors.secondary}>
            {d.injectedToday ? t('home.injDone') : t('layout.treatment.toNext')}
          </SvgText>
        </Svg>
        <View style={{ flex: 1, gap: 4 }}>
          <T v="small" color={colors.secondary} style={label}>
            {t('sum.injection').toUpperCase()}
          </T>
          <T v="h2">{next ? `${next.toLocaleDateString('es-ES', { weekday: 'long' })} · ${next.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : '—'}</T>
          <Button style={{ minHeight: 40, marginTop: 4 }} label={t('layout.treatment.log')} onPress={() => go('log', 'injection')} />
        </View>
      </View>
      <DrillGroup>
        <DrillRow icon="clock" title={t('layout.treatment.calendar')} value={t('layout.treatment.weeks', { a: weeks.filter((w) => w !== null).length, b: 12 })} onPress={() => setOpen('calendar')} />
        <DrillRow icon="scale" title={t('layout.treatment.byDose')} value={`${total <= 0 ? '−' : '+'}${f1(Math.abs(total))} kg`} onPress={() => setOpen('dose')} last />
      </DrillGroup>

      <Sheet open={open === 'calendar'} onClose={() => setOpen(null)} title={t('layout.treatment.calendar')} subtitle={t('layout.treatment.weeks', { a: weeks.filter((w) => w !== null).length, b: 12 })}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {weeks.map((w, i) => (
            <View
              key={i}
              accessible
              accessibilityLabel={w === null ? t('layout.treatment.gap') : `${fmtDose(w)} mg`}
              style={{ width: '14.7%', height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: w === null ? (isDark ? 'rgba(255,122,182,0.16)' : '#FDE3E8') : isDark ? 'rgba(124,108,255,0.25)' : '#E2DAFB' }}
            >
              <T v="small" style={{ fontFamily: fonts.semibold, fontSize: 12 }} color={w === null ? colors.coralText : colors.greenText}>
                {w === null ? '—' : fmtDose(w)}
              </T>
            </View>
          ))}
        </View>
        {d.lastInjection && <T color={colors.secondary}>{t('layout.treatment.last', { site: t(`site.${d.lastInjection.site}`).toLowerCase(), dose: fmtDose(d.lastInjection.dose) })}</T>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip text={t('layout.treatment.nextSite', { site: t(`site.${d.suggestedSite}`).toLowerCase() })} />
          <Chip text={t('layout.treatment.effects', { n: effectWeeks })} />
        </View>
      </Sheet>
      <Sheet open={open === 'dose'} onClose={() => setOpen(null)} title={t('layout.treatment.byDose')}>
        <View style={box}>
          {byDose.map((x) => (
            <Row key={x.dose} gap={10}>
              <T v="small" color={colors.secondary} style={{ width: 58 }}>
                {fmtDose(x.dose)} mg
              </T>
              <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ECE7F8' }}>
                <View style={{ width: `${Math.max(4, Math.min(100, (-x.delta / maxLoss) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: colors.greenText }} />
              </View>
              <T v="label" style={{ width: 70, textAlign: 'right', fontFamily: fonts.semibold }}>
                {x.delta <= 0 ? '−' : '+'}
                {f1(Math.abs(x.delta))} kg
              </T>
            </Row>
          ))}
        </View>
        <T v="small" color={colors.secondary}>
          {t('layout.treatment.byDoseNote')}
        </T>
      </Sheet>
    </View>
  );
}

// ---------------------------------------------------------------- B · Índice del día
export function ScoreLayout({ onOpenScore }: { onOpenScore: () => void }) {
  const { state } = useStore();
  const [open, setOpen] = useState<null | 'counts' | 'days'>(null);
  const sc = towigoScore(state);
  const hist = scoreHistory(state, 8);
  const delta = sc.value - hist[0];
  const [c1] = BAND_COLOR[sc.band];
  const best = [...sc.areas].sort((a, b) => b.score * b.weight - a.score * a.weight)[0];
  const worst = [...sc.areas].sort((a, b) => a.score - b.score)[0];
  const last7 = hist.slice(1);
  const max = Math.max(...last7, 1);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 4 }}>
        <ScoreGauge score={sc} size={210} onPress={onOpenScore} />
        <T v="title" color={c1}>
          {t(`score.band.${sc.band}`)}
        </T>
        <T v="small" color={colors.secondary}>
          {delta >= 0 ? `+${delta}` : `−${-delta}`} {t('score.vsWeek')}
        </T>
      </View>
      <DrillGroup>
        <DrillRow icon="trophy" title={t('layout.score.areas')} value={t('layout.score.areasValue', { n: sc.areas.length })} onPress={onOpenScore} />
        <DrillRow icon="flag" title={t('layout.score.counts')} value={best ? t(`score.area.${best.id}`) : ''} onPress={() => setOpen('counts')} />
        <DrillRow icon="clock" title={t('layout.score.last7')} value={`${Math.min(...last7)}–${Math.max(...last7)}`} onPress={() => setOpen('days')} last />
      </DrillGroup>

      <Sheet open={open === 'counts'} onClose={() => setOpen(null)} title={t('layout.score.counts')}>
        {best && (
          <View style={[box, { flexDirection: 'row', alignItems: 'flex-start' }]}>
            <T v="h2" color={good}>
              +
            </T>
            <T style={{ flex: 1 }}>{t('layout.score.best', { area: t(`score.area.${best.id}`).toLowerCase(), n: best.score })}</T>
          </View>
        )}
        {worst && worst.id !== best?.id && (
          <View style={[box, { flexDirection: 'row', alignItems: 'flex-start' }]}>
            <T v="h2" color="#B7791F">
              !
            </T>
            <T style={{ flex: 1 }}>{t('layout.score.worst', { area: t(`score.area.${worst.id}`).toLowerCase(), n: worst.score })}</T>
          </View>
        )}
      </Sheet>
      <Sheet open={open === 'days'} onClose={() => setOpen(null)} title={t('layout.score.last7')}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 160 }} accessible accessibilityLabel={t('layout.score.last7a11y', { list: last7.join(', ') })}>
          {last7.map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <T v="small" color={colors.secondary} style={{ fontSize: 11 }}>
                {v}
              </T>
              <View style={{ width: '100%', height: `${Math.max(8, (v / max) * 82)}%`, borderRadius: 6, backgroundColor: i === last7.length - 1 ? c1 : isDark ? 'rgba(124,108,255,0.45)' : '#CFC4F7' }} />
            </View>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

// ---------------------------------------------------------------- C · Programa diario
const LESSONS = 8;
const readLessons = new Set<string>();

export function ProgramLayout() {
  const { state, d } = useStore();
  const { go } = useNav();
  const [open, setOpen] = useState<null | 'lesson' | 'plan'>(null);
  const [, force] = useState(0);
  const today = dayKey(Date.now());
  const lesson = (Math.floor(Date.now() / 864e5) % LESSONS) + 1;
  const read = readLessons.has(`${today}|${lesson}`);
  const total = usesGlp1(state.profile) ? 16 : 12;
  const week = Math.min(d.treatmentWeek, total);
  const phase = week <= 4 ? 1 : week <= 8 ? 2 : week <= 12 ? 3 : 4;
  const weighed = state.weights.some((w) => isToday(w.at));
  const strength = state.strength.some((x) => isToday(x.at));
  const tasks: { done: boolean; text: string; meta: string; onPress: () => void }[] = [
    { done: weighed, text: t('layout.program.weigh'), meta: d.weightNow !== null ? `${f1(d.weightNow)} kg` : '', onPress: () => go('log', 'weight') },
    { done: !!d.checkinToday, text: t('checkin.pill'), meta: d.checkinToday ? t(`checkin.v${d.checkinToday.v}`) : '', onPress: () => go('progress') },
    { done: d.proteinToday >= state.goals.proteinG, text: t('layout.program.protein', { g: state.goals.proteinG }), meta: `${d.proteinToday} / ${state.goals.proteinG} g`, onPress: () => go('log', 'intake') },
    { done: strength, text: t('layout.program.strength'), meta: t('layout.program.strengthMeta'), onPress: () => go('log', 'strength') },
    { done: read, text: t('layout.program.lesson'), meta: t('layout.program.min'), onPress: () => setOpen('lesson') },
  ];
  const team = [...state.messages].filter((m) => m.from !== 'patient' && m.from !== 'owi').sort((a, b) => b.at.localeCompare(a.at))[0];
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="small" color={colors.secondary} style={label}>
            {t('layout.program.week', { n: week, total }).toUpperCase()}
          </T>
          <T v="small" color={colors.secondary}>
            {t(`layout.program.phase${phase}`)}
          </T>
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E4DFF3' }}>
          <View style={{ width: `${Math.round((week / total) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: colors.greenText }} />
        </View>
      </View>
      <View style={{ borderRadius: 22, backgroundColor: colors.greenText, padding: 18, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="small" color={colors.onAccent} style={[label, { opacity: 0.9 }]}>
            {t('layout.program.today').toUpperCase()}
          </T>
          {!read && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)' }}>
              <T v="small" color={colors.onAccent} style={{ fontSize: 11, fontFamily: fonts.semibold }}>
                {t('layout.program.new')}
              </T>
            </View>
          )}
        </Row>
        <T v="h2" color={colors.onAccent} style={{ fontSize: 20, lineHeight: 26 }}>
          {t(`lesson.${lesson}.title`)}
        </T>
        <Pressable accessibilityRole="button" onPress={() => setOpen('lesson')} style={({ pressed }) => ({ alignSelf: 'flex-start', height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
          <T v="label" color={isDark ? '#0A0F1E' : colors.greenText}>
            {read ? t('layout.program.again') : t('layout.program.start')}
          </T>
        </Pressable>
      </View>
      <DrillGroup>
        <DrillRow icon="check" title={t('layout.program.plan')} value={t('layout.program.planValue', { a: tasks.filter((x) => x.done).length, b: tasks.length })} onPress={() => setOpen('plan')} />
        <DrillRow icon="steth" title={t('layout.program.fromTeam')} value={team ? hhmm(team.at) : ''} onPress={() => go('team')} last />
      </DrillGroup>

      <Sheet open={open === 'plan'} onClose={() => setOpen(null)} title={t('layout.program.plan')} subtitle={t('layout.program.planValue', { a: tasks.filter((x) => x.done).length, b: tasks.length })}>
        <DrillGroup>
          {tasks.map((x, i) => (
            <Pressable
              key={i}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: x.done }}
              accessibilityLabel={x.text}
              onPress={() => {
                setOpen(null);
                x.onPress();
              }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: i < tasks.length - 1 ? 1 : 0, borderBottomColor: border, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: x.done ? colors.greenText : 'transparent', borderWidth: x.done ? 0 : 2, borderColor: colors.borderStrong }}>
                {x.done && <Icon name="check" size={14} color={colors.onAccent} stroke={3} />}
              </View>
              <T style={{ flex: 1, fontSize: 15, textDecorationLine: x.done ? 'line-through' : 'none' }} color={x.done ? colors.secondary : colors.ink}>
                {x.text}
              </T>
              <T v="small" color={colors.secondary}>
                {x.meta}
              </T>
            </Pressable>
          ))}
        </DrillGroup>
      </Sheet>
      <Modal visible={open === 'lesson'} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(6,10,22,0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: colors.white, borderRadius: 26, borderWidth: 1, borderColor: colors.line }}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Row gap={10}>
                <OwiSticker mood="happy" size={44} />
                <View style={{ flex: 1 }}>
                  <T v="small" color={colors.secondary} style={label}>
                    {t('layout.program.today').toUpperCase()}
                  </T>
                  <T v="h2">{t(`lesson.${lesson}.title`)}</T>
                </View>
              </Row>
              {[1, 2, 3].map((p) => (
                <T key={p} style={{ fontSize: 15, lineHeight: 23 }}>
                  {t(`lesson.${lesson}.p${p}`)}
                </T>
              ))}
              <T v="small" color={colors.secondary}>
                {t('layout.program.note')}
              </T>
              <Button
                label={t('layout.program.done')}
                onPress={() => {
                  readLessons.add(`${today}|${lesson}`);
                  force((x) => x + 1);
                  setOpen(null);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------- D · Diario
export function DiaryLayout() {
  const { state, d } = useStore();
  const { go } = useNav();
  const [open, setOpen] = useState<null | 'meals' | 'more'>(null);
  const goal = state.goals.proteinG;
  const left = Math.max(0, goal - d.proteinToday);
  const carbs = state.carbs.filter((c) => isToday(c.at)).sort((a, b) => a.at.localeCompare(b.at));
  const meal = (h: number) => (h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 19 ? 'snack' : 'dinner');
  const effects = state.sideEffects.filter((e) => isToday(e.at)).flatMap((e) => e.symptoms);
  const worst = [...effects].sort((a, b) => b.level - a.level)[0];
  const logTarget = isT1(state.profile) ? 'carbs' : 'intake';
  return (
    <View style={{ gap: 12 }}>
      <View style={box}>
        <T v="small" color={colors.secondary} style={label}>
          {t('layout.diary.left').toUpperCase()}
        </T>
        <Row style={{ justifyContent: 'space-between' }}>
          <Num v={`${goal}`} l={t('layout.diary.goal')} />
          <T v="h2" color={colors.secondary}>
            −
          </T>
          <Num v={`${d.proteinToday}`} l={t('layout.diary.eaten')} />
          <T v="h2" color={colors.secondary}>
            =
          </T>
          <Num v={`${left} g`} l={t('layout.diary.remaining')} accent />
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ECE7F8' }}>
          <View style={{ width: `${Math.min(100, Math.round((d.proteinToday / goal) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: colors.greenText }} />
        </View>
        <Row gap={8}>
          <Button style={{ flex: 1, minHeight: 42 }} label={t('layout.diary.photo')} icon={<Icon name="camera" size={18} color={colors.onAccent} />} onPress={() => go('log', logTarget)} />
          <Button style={{ flex: 1, minHeight: 42 }} kind="secondary" label={t('layout.diary.write')} onPress={() => go('owi')} />
        </Row>
      </View>
      <DrillGroup>
        <DrillRow icon="meal" title={t('layout.diary.meals')} value={carbs.length ? t('layout.diary.mealsValue', { n: carbs.length }) : t('layout.diary.mealsNone')} onPress={() => setOpen('meals')} />
        <DrillRow icon="drop" title={t('layout.diary.more')} value={`${f1(d.waterToday / 4)} L · ${worst ? t(`sym.${worst.id}`) : t('layout.diary.none')}`} onPress={() => setOpen('more')} last />
      </DrillGroup>

      <Sheet open={open === 'meals'} onClose={() => setOpen(null)} title={t('layout.diary.meals')}>
        <DrillGroup>
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((m, i) => {
            const items = carbs.filter((c) => meal(new Date(c.at).getHours()) === m);
            return (
              <View key={m} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: border }}>
                <Row style={{ justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }}>
                  <T v="label" style={{ fontFamily: fonts.semibold }}>
                    {t(`layout.diary.${m}`)}
                  </T>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('layout.diary.add')} · ${t(`layout.diary.${m}`)}`}
                    onPress={() => {
                      setOpen(null);
                      go('log', logTarget);
                    }}
                    hitSlop={8}
                  >
                    <T v="label" color={colors.greenText}>
                      + {t('layout.diary.add')}
                    </T>
                  </Pressable>
                </Row>
                {items.map((c) => (
                  <Row key={c.id} style={{ justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 }}>
                    <T v="small" style={{ fontSize: 14 }}>
                      {c.label ?? t('layout.diary.meal')} · {hhmm(c.at)}
                    </T>
                    <T v="small" color={colors.secondary}>
                      {c.g} g HC{c.protein ? ` · ${c.protein} g prot.` : ''}
                    </T>
                  </Row>
                ))}
              </View>
            );
          })}
        </DrillGroup>
      </Sheet>
      <Sheet open={open === 'more'} onClose={() => setOpen(null)} title={t('layout.diary.more')}>
        <Row gap={8}>
          <Mini v={`${f1(d.waterToday / 4)} L`} l={t('layout.diary.water')} />
          <Mini v={isT1(state.profile) ? `${d.carbsToday} g` : `${STEPS_TODAY.toLocaleString('es-ES')}`} l={isT1(state.profile) ? t('sum.carbs') : t('rings.move')} />
          <Mini v={worst ? t(`layout.diary.level${worst.level}`) : t('layout.diary.none')} l={worst ? t(`sym.${worst.id}`) : t('layout.diary.effects')} />
        </Row>
        <Button
          kind="secondary"
          label={t('layout.diary.logEffects')}
          onPress={() => {
            setOpen(null);
            go('log', 'effects');
          }}
        />
      </Sheet>
    </View>
  );
}

function Num({ v, l, accent }: { v: string; l: string; accent?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <T v="h2" color={accent ? colors.greenText : colors.ink} style={{ fontSize: accent ? 22 : 20 }}>
        {v}
      </T>
      <T v="small" color={colors.secondary} style={{ fontSize: 11 }}>
        {l}
      </T>
    </View>
  );
}
function Mini({ v, l }: { v: string; l: string }) {
  return (
    <View style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: panelBg, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
      <T v="label" style={{ fontFamily: fonts.semibold }}>
        {v}
      </T>
      <T v="small" color={colors.secondary} style={{ fontSize: 11 }} center numberOfLines={1}>
        {l}
      </T>
    </View>
  );
}

// ---------------------------------------------------------------- E · Línea del día
type Ev = { at: string; icon: IconName; kicker: string; text: string; tone?: 'people' | 'team' | 'owi'; onPress?: () => void };

function useDayEvents(owiMessage: string): Ev[] {
  const { state } = useStore();
  const { go } = useNav();
  const ev: Ev[] = [];
  for (const w of state.weights.filter((x) => isToday(x.at))) ev.push({ at: w.at, icon: 'scale', kicker: t('sum.weight'), text: `${f1(w.kg)} kg`, onPress: () => go('progress') });
  for (const x of state.injections.filter((y) => isToday(y.at))) ev.push({ at: x.at, icon: 'syringe', kicker: t('layout.timeline.injection'), text: `${fmtDose(x.dose)} mg · ${t(`site.${x.site}`).toLowerCase()}` });
  for (const g of state.glucose.filter((y) => isToday(y.at) && y.context !== 'sensor')) ev.push({ at: g.at, icon: 'drop', kicker: t('sum.glucose'), text: `${g.v} mg/dL · ${t(`ctx.${g.context}`)}` });
  for (const x of state.insulin.filter((y) => isToday(y.at))) ev.push({ at: x.at, icon: 'syringe', kicker: t(x.kind === 'basal' ? 'layout.timeline.basal' : 'layout.timeline.rapid'), text: `${String(x.units).replace('.', ',')} u` });
  for (const x of state.carbs.filter((y) => isToday(y.at))) ev.push({ at: x.at, icon: 'meal', kicker: t('layout.timeline.meal'), text: `${x.label ?? t('layout.diary.meal')} · ${x.g} g HC` });
  for (const x of state.sideEffects.filter((y) => isToday(y.at)))
    ev.push({ at: x.at, icon: 'alert', kicker: t('layout.timeline.feel'), text: x.symptoms.map((s) => `${t(`sym.${s.id}`)} (${t(`layout.diary.level${s.level}`).toLowerCase()})`).join(', ') });
  for (const x of state.strength.filter((y) => isToday(y.at))) ev.push({ at: x.at, icon: 'dumbbell', kicker: t('layout.timeline.strength'), text: t('layout.timeline.strengthDone') });
  for (const c of state.cheers.filter((y) => isToday(y.at))) ev.push({ at: c.at, icon: 'heart', kicker: t('layout.timeline.people', { who: state.crew.find((m) => m.id === c.from)?.name ?? t('crew.someone') }), text: c.text, tone: 'people' });
  for (const m of state.messages.filter((y) => isToday(y.at) && y.from !== 'patient' && y.from !== 'owi'))
    ev.push({ at: m.at, icon: m.kind === 'audio' ? 'headphones' : 'chat', kicker: t('layout.timeline.team'), text: m.text ? t(m.text) : t('layout.program.audio', { s: m.durationSec ?? 0 }), tone: 'team', onPress: () => go('team') });
  ev.sort((a, b) => a.at.localeCompare(b.at));
  ev.push({ at: new Date().toISOString(), icon: 'smile', kicker: t('layout.timeline.owi', { owi: state.pet.name }), text: owiMessage, tone: 'owi' });
  return ev;
}

function EventRow({ e }: { e: Ev }) {
  const { d } = useStore();
  const bg = e.tone === 'people' ? (isDark ? 'rgba(255,154,107,0.12)' : '#FFF6F1') : e.tone === 'team' ? (isDark ? 'rgba(61,224,200,0.08)' : '#F0FBF8') : e.tone === 'owi' ? (isDark ? 'rgba(124,108,255,0.14)' : '#EFEAFE') : panelBg;
  return (
    <Row gap={12} style={{ alignItems: 'flex-start' }}>
      <T v="small" color={colors.secondary} style={{ width: 44, textAlign: 'right', paddingTop: 12 }}>
        {e.tone === 'owi' ? t('layout.timeline.now') : hhmm(e.at)}
      </T>
      <Pressable accessibilityRole={e.onPress ? 'button' : 'text'} onPress={e.onPress} style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 12 }}>
        {e.tone === 'owi' ? <OwiSticker mood={d.petMood} size={30} /> : <Icon name={e.icon} size={18} color={colors.greenText} />}
        <View style={{ flex: 1 }}>
          <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, fontSize: 12 }}>
            {e.kicker}
          </T>
          <T style={{ fontSize: 15 }} numberOfLines={3}>
            {e.text}
          </T>
        </View>
      </Pressable>
    </Row>
  );
}

export function TimelineLayout({ owiMessage }: { owiMessage: string }) {
  const { go } = useNav();
  const [open, setOpen] = useState(false);
  const ev = useDayEvents(owiMessage);
  const recent = ev.slice(-3);
  return (
    <View style={{ gap: 10 }}>
      {recent.map((e, i) => (
        <EventRow key={i} e={e} />
      ))}
      {ev.length > 3 && (
        <DrillGroup>
          <DrillRow icon="clock" title={t('layout.timeline.all')} value={t('layout.diary.mealsValue', { n: ev.length - 1 })} onPress={() => setOpen(true)} last />
        </DrillGroup>
      )}
      <Pressable accessibilityRole="button" accessibilityLabel={t('layout.timeline.compose')} onPress={() => go('owi')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 24, paddingLeft: 16, paddingRight: 4, backgroundColor: panelBg, borderWidth: 1, borderColor: border, opacity: pressed ? 0.8 : 1 })}>
        <T color={colors.secondary} style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
          {t('layout.timeline.compose')}
        </T>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenText, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="mic" size={18} color={colors.onAccent} />
        </View>
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('layout.timeline.all')}>
        {ev.map((e, i) => (
          <EventRow key={i} e={e} />
        ))}
      </Sheet>
    </View>
  );
}

// ---------------------------------------------------------------- F · Resumen en tarjetas
export function SummaryLayout({ onOpenScore }: { onOpenScore: () => void }) {
  const { state, d } = useStore();
  const { go } = useNav();
  const [open, setOpen] = useState<null | 'more' | 'weight'>(null);
  const sc = towigoScore(state);
  const hist = scoreHistory(state, 8);
  const [w, setW] = useState(300);
  const ws = [...state.weights].sort((a, b) => a.at.localeCompare(b.at)).slice(-12).map((x) => x.kg);
  const glp1 = usesGlp1(state.profile) && !d.maintenance && d.nextInjectionAt;
  const g = d.lastGlucose;
  const lastMood = [...state.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  return (
    <View style={{ gap: 12 }}>
      <Tile title={t('score.title')} color={BAND_COLOR[sc.band][0]} right={t('layout.summary.today')} onPress={onOpenScore}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <T>
            <T v="display" style={{ fontSize: 28 }}>
              {sc.value}
            </T>
            <T v="small" color={colors.secondary}>
              {' '}/100 · {t(`score.band.${sc.band}`)}
            </T>
          </T>
          <Sparkline values={hist} color={BAND_COLOR[sc.band][0]} width={90} height={30} fill={false} />
        </Row>
      </Tile>
      {glp1 ? (
        <Tile title={t('sum.injection')} color={colors.blue} right={d.lastInjection ? `${fmtDose(d.lastInjection.dose)} mg` : ''} onPress={() => go('log', 'injection')}>
          <T>
            <T v="display" style={{ fontSize: 28 }}>
              {d.injectedToday ? '✓' : `${d.daysToInjection ?? 0}`}
            </T>
            <T v="small" color={colors.secondary}>
              {' '}
              {d.injectedToday ? t('sum.injDone') : `${t('layout.summary.days')} · ${new Date(d.nextInjectionAt!).toLocaleDateString('es-ES', { weekday: 'long' })}`}
            </T>
          </T>
        </Tile>
      ) : g && (isT1(state.profile) || hasDiabetes(state.profile)) ? (
        <Tile title={t('sum.glucose')} color={colors.coralText} right={hhmm(g.at)} onPress={() => go('progress')}>
          <T>
            <T v="display" style={{ fontSize: 28 }}>
              {g.v}
            </T>
            <T v="small" color={colors.secondary}>
              {' '}mg/dL{isT1(state.profile) ? ` · ${t('home.tirShort').toLowerCase()} ${d.tir24} %` : ''}
            </T>
          </T>
        </Tile>
      ) : null}
      <DrillGroup>
        <DrillRow icon="scale" title={t('layout.summary.highlight')} value={d.weightNow !== null ? `${f1(d.weightNow)} kg` : ''} onPress={() => setOpen('weight')} />
        <DrillRow icon="widget" title={t('layout.summary.more')} value={t('layout.summary.moreValue')} onPress={() => setOpen('more')} last />
      </DrillGroup>

      <Sheet open={open === 'more'} onClose={() => setOpen(null)} title={t('layout.summary.more')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <HalfTile title={t('sum.weight')} color={isDark ? '#A58FFF' : '#6A4FE0'} value={d.weightNow !== null ? f1(d.weightNow) : '—'} unit="kg" sub={d.lostKg > 0 ? t('sum.lost', { kg: f1(d.lostKg) }) : ''} />
          <HalfTile title={t('rings.food')} color="#D9542F" value={`${d.proteinToday}`} unit={`/ ${state.goals.proteinG} g`} bar={d.proteinToday / state.goals.proteinG} />
          <HalfTile title={t('layout.summary.steps')} color={good} value={STEPS_TODAY.toLocaleString('es-ES')} unit="" sub={t('layout.summary.stepsGoal', { n: STEPS_GOAL.toLocaleString('es-ES') })} />
          <HalfTile title={t('layout.summary.mood')} color="#C2417F" value={lastMood ? t(`checkin.v${lastMood.v}`) : '—'} unit="" face={lastMood?.v} />
        </View>
      </Sheet>
      <Sheet open={open === 'weight'} onClose={() => setOpen(null)} title={t('layout.summary.highlight')}>
        <View style={box} onLayout={(e) => setW(e.nativeEvent.layout.width - 32)}>
          <T v="label" style={{ fontFamily: fonts.semibold }}>
            {d.lostKg > 0 ? t('layout.summary.lost', { kg: f1(d.lostKg), m: d.musclePct !== null ? f1(d.musclePct) : '—' }) : t('layout.summary.stable')}
          </T>
          {ws.length > 2 && <Sparkline values={ws} color={isDark ? '#A58FFF' : '#6A4FE0'} width={Math.max(120, w)} height={80} />}
        </View>
      </Sheet>
    </View>
  );
}

function Tile({ title, color, right, onPress, children }: { title: string; color: string; right?: string; onPress?: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [box, { borderRadius: 18, padding: 14, gap: 4, opacity: pressed ? 0.8 : 1 }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="small" color={color} style={{ fontFamily: fonts.semibold, fontSize: 13 }}>
          {title}
        </T>
        {!!right && (
          <T v="small" color={colors.secondary}>
            {right}
          </T>
        )}
      </Row>
      {children}
    </Pressable>
  );
}
function HalfTile({ title, color, value, unit, sub, bar, face }: { title: string; color: string; value: string; unit: string; sub?: string; bar?: number; face?: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <View accessible accessibilityLabel={`${title}: ${value} ${unit}`} style={[box, { flexBasis: '46%', flexGrow: 1, borderRadius: 18, padding: 14, gap: 4 }]}>
      <T v="small" color={color} style={{ fontFamily: fonts.semibold, fontSize: 13 }}>
        {title}
      </T>
      <Row gap={6} style={{ alignItems: 'center' }}>
        {face && <MoodFace v={face} size={30} />}
        <T>
          <T v="h2" style={{ fontSize: 22 }}>
            {value}
          </T>
          {!!unit && (
            <T v="small" color={colors.secondary}>
              {' '}
              {unit}
            </T>
          )}
        </T>
      </Row>
      {bar !== undefined && (
        <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F6E3DA' }}>
          <View style={{ width: `${Math.max(3, Math.min(100, bar * 100))}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
        </View>
      )}
      {!!sub && (
        <T v="small" color={colors.secondary} style={{ fontSize: 12 }}>
          {sub}
        </T>
      )}
    </View>
  );
}
