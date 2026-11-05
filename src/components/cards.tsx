/**
 * Tarjetas de la pantalla "Hoy" para tipo 2 y GLP-1.
 * Solo muestran datos, tendencias y hábitos (Fase 1): nunca indican qué dosis tomar.
 */
import { View } from 'react-native';
import { Icon, type IconName } from './icons';
import { Bouncy, Pop, useCountUp } from './motion';
import TrendChart from './TrendChart';
import { Button, Card, ProgressBar, Row, T } from './ui';
import { STEPS_GOAL, STEPS_TODAY, TEAM } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore, type HabitId } from '../state/store';
import { colors, radius } from '../theme';

const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');
const dateShort = (t0: number | string) => new Date(t0).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const hhmm = (t0: string) => new Date(t0).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function Header({ icon, tone, title, right }: { icon: IconName | string; tone: string; title: string; right?: React.ReactNode }) {
  return (
    <Row gap={10}>
      <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: tone, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon as IconName} size={22} color={colors.white} stroke={2.3} />
      </View>
      <T v="h2" style={{ flex: 1 }}>
        {title}
      </T>
      {right}
    </Row>
  );
}

// ---------- GLP-1: inyección semanal ----------
export function InjectionCard() {
  const { state, d } = useStore();
  const { go } = useNav();
  const days = d.daysToInjection ?? 0;
  const done = d.injectedToday;
  const title = done ? t('inj.doneToday') : d.injectionOverdue ? t('inj.overdueTitle') : days === 0 ? t('inj.today') : days === 1 ? t('inj.tomorrow') : t('inj.inDays', { n: days });
  return (
    <Card tone={done ? 'green' : days === 0 || d.injectionOverdue ? 'yellow' : 'white'}>
      <Header icon="syringe" tone="#1E63C7" title={t('inj.title')} />
      <T v="small" color={colors.blue}>
        {t('inj.weeks', { n: d.injectionWeeks })}
      </T>
      <Pop trigger={title}>
        <T v="title">{title}</T>
      </Pop>
      {!done && d.nextInjectionAt && !d.injectionOverdue && (
        <T v="small" color={colors.secondary}>
          {t('inj.next', { date: dateShort(d.nextInjectionAt), time: state.glp1.time })}
        </T>
      )}
      {d.injectionOverdue && (
        <T v="small" color={colors.ink}>
          {t('inj.overdueText')}
        </T>
      )}
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: colors.softCoral, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
          <T v="small">{t('inj.nextSite', { site: t(`site.${d.suggestedSite}`) })}</T>
        </View>
        {d.lastInjection && (
          <View style={{ backgroundColor: colors.line, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
            <T v="small">{t('inj.last', { site: t(`site.${d.lastInjection.site}`), dose: fmt1(d.lastInjection.dose) })}</T>
          </View>
        )}
      </Row>
      {!done && <Button kind={days === 0 || d.injectionOverdue ? 'primary' : 'secondary'} label={t('inj.log')} onPress={() => go('log', 'injection')} />}
    </Card>
  );
}

// ---------- Peso y composición ----------
export function WeightCard({ compact }: { compact?: boolean }) {
  const { state, d } = useStore();
  const { go } = useNav();
  const lost = useCountUp(Math.round(d.lostKg * 10)) / 10;
  if (d.weightNow === null) return null;
  const pts = state.weights.map((w) => ({ t: new Date(w.at).getTime(), v: w.kg }));
  const toGoal = d.toGoalKg ?? 0;
  const startToGoal = (d.weightStart ?? 0) - state.goals.weightKg;
  const progress = startToGoal > 0 ? Math.min(100, ((startToGoal - Math.max(0, toGoal)) / startToGoal) * 100) : 0;
  return (
    <Card>
      <Header icon="scale" tone="#5B4BC4" title={t('weight.title')} right={<T v="h2">{fmt1(d.weightNow)} kg</T>} />
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: colors.softGreen, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
          <T v="label" color={colors.greenText}>
            {d.lostKg > 0 ? t('weight.lost', { kg: fmt1(lost), pct: fmt1(d.lostPct) }) : t('weight.stable')}
          </T>
        </View>
        {d.musclePct !== null && !compact && (
          <View style={{ backgroundColor: colors.softBlue, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
            <T v="small">{t('weight.muscle', { n: fmt1(d.musclePct) })}</T>
          </View>
        )}
      </Row>
      {d.plateau && (
        <T v="small" color={colors.ink}>
          {t('weight.plateau')}
        </T>
      )}
      {!compact && (
        <>
          <TrendChart points={pts} unit=" kg" decimals={1} color={colors.purple} label={t('weight.chartA11y', { kg: fmt1(d.weightNow) })} />
          <View style={{ gap: 4 }}>
            <ProgressBar value={progress} color={colors.purple} />
            <T v="small" color={colors.secondary}>
              {toGoal > 0 ? t('weight.toGoal', { kg: fmt1(toGoal), goal: state.goals.weightKg }) : t('weight.goalReached')}
            </T>
          </View>
        </>
      )}
      <Button kind="secondary" label={t('weight.log')} onPress={() => go('log', 'weight')} />
    </Card>
  );
}

// ---------- Tipo 2: glucosa y HbA1c ----------
const STATUS_COLOR = { none: colors.secondary, veryLow: colors.low, low: colors.low, in: colors.greenText, high: colors.coralText, veryHigh: colors.coralText } as const;

export function GlucoseCard() {
  const { state, d } = useStore();
  const { go } = useNav();
  const g = d.lastGlucose;
  const v = useCountUp(g?.v ?? 0);
  const pts = state.glucose.filter((x) => x.context === 'ayunas').map((x) => ({ t: new Date(x.at).getTime(), v: x.v }));
  const c = STATUS_COLOR[d.glucoseStatus];
  return (
    <Card>
      <Header icon="drop" tone="#C8372D" title={t('glu.title')} right={<T v="label" color={colors.greenText}>{t('glu.inTarget', { n: d.glucoseInTargetPct })}</T>} />
      {g ? (
        <View accessible accessibilityLabel={t('glu.a11y', { v: g.v, ctx: t(`ctx.${g.context}`), status: t(`gstatus.${d.glucoseStatus}`) })} style={{ gap: 6 }}>
          <Row gap={8} style={{ alignItems: 'flex-end' }}>
            <T v="big" color={c}>
              {v}
            </T>
            <T v="small" color={colors.secondary} style={{ paddingBottom: 10 }}>
              mg/dL · {t(`ctx.${g.context}`)} · {hhmm(g.at)}
            </T>
          </Row>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: d.glucoseStatus === 'in' ? colors.softGreen : d.glucoseStatus.includes('ow') ? '#FDE7E5' : colors.softCoral }}>
            <T v="label" color={c}>
              {t(`gstatus.${d.glucoseStatus}`)}
            </T>
          </View>
          {(d.glucoseStatus === 'low' || d.glucoseStatus === 'veryLow') && (
            <T v="label" color={colors.low}>
              {t('glu.lowNote')}
            </T>
          )}
        </View>
      ) : (
        <T color={colors.secondary}>{t('glu.none')}</T>
      )}
      {pts.length > 1 && <TrendChart points={pts} band={state.goals.fastingRange} color={colors.coralText} label={t('glu.chartA11y')} />}
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="small" color={colors.secondary}>
          {t('glu.targets', { a: state.goals.fastingRange[0], b: state.goals.fastingRange[1], c: state.goals.postMealMax, who: TEAM.endo.name })}
        </T>
      </Row>
      {d.hba1cNow !== null && (
        <Row gap={10} style={{ backgroundColor: colors.softYellow, borderRadius: 14, padding: 10 }}>
          <View style={{ flex: 1 }}>
            <T v="label">{t('glu.hba1c', { v: fmt1(d.hba1cNow) })}</T>
            {d.hba1cPrev !== null && (
              <T v="small" color={colors.secondary}>
                {t('glu.hba1cPrev', { v: fmt1(d.hba1cPrev) })}
              </T>
            )}
          </View>
        </Row>
      )}
      <Button kind="secondary" label={t('glu.log')} onPress={() => go('log', 'glucose')} />
    </Card>
  );
}

// ---------- Tipo 2: medicación del día ----------
export function MedsCard() {
  const { dispatch, d } = useStore();
  if (!d.medsToday.length) return null;
  const taken = d.medsToday.filter((m) => m.taken).length;
  return (
    <Card>
      <Header icon="pill" tone="#17785A" title={t('meds.title')} right={<T v="label" color={colors.greenText}>{taken}/{d.medsToday.length}</T>} />
      {d.medsToday.map((m) => (
        <Bouncy
          key={`${m.med.id}${m.time}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: m.taken }}
          accessibilityLabel={`${m.med.name} ${m.med.dose}, ${m.time}`}
          onPress={() => dispatch({ type: 'takeMed', medId: m.med.id, time: m.time })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 12, borderRadius: radius.m, backgroundColor: m.taken ? colors.softGreen : colors.cream, borderWidth: 2, borderColor: m.taken ? colors.greenText : colors.border }}
        >
          <View style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: colors.greenText, backgroundColor: m.taken ? colors.greenText : colors.white, alignItems: 'center', justifyContent: 'center' }}>
            {m.taken && <Icon name="check" size={20} color={colors.white} stroke={3} />}
          </View>
          <View style={{ flex: 1 }}>
            <T v="label">
              {m.med.name} {m.med.dose}
            </T>
            <T v="small" color={colors.secondary}>
              {m.time}
            </T>
          </View>
        </Bouncy>
      ))}
      <T v="small" color={colors.secondary}>
        {t('meds.note')}
      </T>
    </Card>
  );
}

// ---------- GLP-1: efectos secundarios ----------
export function SideEffectsCard() {
  const { d } = useStore();
  const { go } = useNav();
  const today = d.sideEffectsToday[0];
  return (
    <Card tone={d.worstSymptomToday >= 2 ? 'coral' : 'white'}>
      <Header icon="heart" tone="#B7791F" title={t('se.title')} />
      {today ? (
        <>
          <T>{t('se.todayYouSaid', { list: today.symptoms.map((s) => t(`sym.${s.id}`).toLowerCase()).join(', ') })}</T>
          <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 12, gap: 4 }}>
            <T v="label">{t('se.tipTitle')}</T>
            <T v="small">{t(`tip.${today.symptoms[0].id}`)}</T>
            <T v="small" color={colors.secondary}>
              {t('se.tipFrom', { who: TEAM.nutri.name })}
            </T>
          </View>
          {d.worstSymptomToday >= 3 && (
            <T v="label" color={colors.coralText}>
              {t('se.severe')}
            </T>
          )}
        </>
      ) : (
        <T color={colors.secondary}>{t('se.ask')}</T>
      )}
      <Button kind={today ? 'secondary' : 'primary'} label={today ? t('se.update') : t('se.log')} onPress={() => go('log', 'effects')} />
    </Card>
  );
}

// ---------- Proteína y agua ----------
export function IntakeCard() {
  const { state, dispatch, d } = useStore();
  const p = Math.min(100, (d.proteinToday / state.goals.proteinG) * 100);
  const w = Math.min(100, (d.waterToday / state.goals.waterGlasses) * 100);
  return (
    <Card>
      <Header icon="protein" tone="#D9542F" title={t('intake.title')} />
      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="label">{t('intake.protein')}</T>
          <T v="label" color={colors.coralText}>
            {d.proteinToday} / {state.goals.proteinG} g
          </T>
        </Row>
        <ProgressBar value={p} color={colors.coral} />
        <Row gap={8}>
          {[10, 20, 30].map((g) => (
            <Button key={g} style={{ flex: 1 }} kind="secondary" label={`+${g} g`} onPress={() => dispatch({ type: 'addIntake', protein: g })} />
          ))}
        </Row>
      </View>
      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="label">{t('intake.water')}</T>
          <T v="label" color={colors.blue}>
            {t('intake.glasses', { n: d.waterToday, goal: state.goals.waterGlasses })}
          </T>
        </Row>
        <ProgressBar value={w} color={colors.blue} />
        <Button kind="blue" label={t('intake.addWater')} onPress={() => dispatch({ type: 'addIntake', water: 1 })} />
      </View>
      <T v="small" color={colors.secondary}>
        {t('intake.note', { who: TEAM.nutri.name })}
      </T>
    </Card>
  );
}

// ---------- Hábitos ----------
const HABIT: Record<HabitId, { icon: IconName; tone: string; bg: string; to: 'log' | 'team' | 'progress' }> = {
  log: { icon: 'plus', tone: colors.coralText, bg: colors.softCoral, to: 'log' },
  walk: { icon: 'walk', tone: colors.blue, bg: colors.softBlue, to: 'progress' },
  listen: { icon: 'headphones', tone: colors.purple, bg: colors.softPurple, to: 'team' },
};

export function HabitsCard() {
  const { d } = useStore();
  const { go } = useNav();
  const done = Object.values(d.habitsToday).filter(Boolean).length;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="h2">{t('home.habitsTitle')}</T>
        <T v="label" color={colors.greenText}>
          {done}/3
        </T>
      </Row>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(Object.keys(d.habitsToday) as HabitId[]).map((h) => {
          const ok = d.habitsToday[h];
          const hb = HABIT[h];
          return (
            <Bouncy
              key={h}
              accessibilityRole="button"
              accessibilityLabel={`${t(`habit.${h}`)}: ${ok ? t('common.done') : t('common.pending')}`}
              onPress={() => go(hb.to)}
              outerStyle={{ flex: 1 }}
              style={{ alignItems: 'center', gap: 6, padding: 10, borderRadius: radius.m, backgroundColor: ok ? hb.tone : hb.bg}}
            >
              <Pop trigger={ok}>
                <Icon name={ok ? 'check' : hb.icon} size={28} color={ok ? colors.white : hb.tone} stroke={ok ? 3 : 2.2} />
              </Pop>
              <T v="small" color={ok ? colors.white : colors.ink} center>
                {t(`habit.${h}`)}
              </T>
            </Bouncy>
          );
        })}
      </View>
      <View style={{ gap: 4 }}>
        <ProgressBar value={(STEPS_TODAY / STEPS_GOAL) * 100} color={colors.blue} height={12} />
        <T v="small" color={colors.secondary}>
          {t('home.steps', { n: STEPS_TODAY.toLocaleString('es-ES'), goal: STEPS_GOAL.toLocaleString('es-ES') })}
        </T>
      </View>
      <T v="small" color={colors.secondary}>
        {t('home.habitsNote')}
      </T>
    </Card>
  );
}
