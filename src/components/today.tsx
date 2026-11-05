/**
 * Pantalla "Hoy", versión clara:
 * - "Para hoy": lista corta de tareas (lo que toca hacer hoy), con casilla.
 * - "Resumen": cuadrícula de datos clave; el detalle y las gráficas están en Progreso.
 */
import { View } from 'react-native';
import { STEPS_TODAY, TEAM } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { hasDiabetes, isT1, usesGlp1 } from '../state/types';
import { colors, radius } from '../theme';
import { Pressable } from 'react-native';
import { Glyph } from './icons';
import { tap } from './motion';
import { ListGroup, ListRow, T } from './ui';

const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');

export function TodayList() {
  const { state, d } = useStore();
  const { go } = useNav();
  const glp1 = usesGlp1(state.profile);
  const t2 = hasDiabetes(state.profile);
  const weekday = (new Date().getDay() + 6) % 7;
  const today = new Date().toISOString().slice(0, 10);
  const unread = state.messages.find((m) => !m.read && m.kind === 'audio' && m.from !== 'patient' && m.from !== 'owi');
  const rows: React.ReactNode[] = [];

  if (glp1 && (d.daysToInjection === 0 || d.injectionOverdue || d.injectedToday))
    rows.push(
      <ListRow
        key="inj"
        icon={<Glyph name="syringe" bg="#1E63C7" />}
        title={d.injectedToday ? t('today.injDone') : d.injectionOverdue ? t('today.injOverdue') : t('today.inj')}
        subtitle={d.injectedToday ? undefined : t('inj.nextSite', { site: t(`site.${d.suggestedSite}`) })}
        done={d.injectedToday}
        onPress={d.injectedToday ? undefined : () => go('log', 'injection')}
      />,
    );
  if (t2 && d.medsToday.length) {
    const taken = d.medsToday.filter((m) => m.taken).length;
    rows.push(
      <ListRow
        key="meds"
        icon={<Glyph name="pill" bg="#17785A" />}
        title={t('today.meds')}
        subtitle={t('today.medsSub', { a: taken, b: d.medsToday.length })}
        done={taken === d.medsToday.length}
        onPress={() => go('log', 'meds')}
      />,
    );
  }
  if (isT1(state.profile))
    rows.push(
      <ListRow
        key="basal"
        icon={<Glyph name="clock" bg="#5B4BC4" />}
        title={t('today.basal', { name: state.insulinPlan.basalName })}
        subtitle={d.basalToday ? undefined : t('today.basalSub', { time: state.insulinPlan.basalTime })}
        done={d.basalToday}
        onPress={d.basalToday ? undefined : () => go('log', 'insulin')}
      />,
    );
  if (t2 && !isT1(state.profile)) {
    const measured = state.glucose.some((g) => g.at.slice(0, 10) === today);
    rows.push(
      <ListRow key="glu" icon={<Glyph name="drop" bg="#C8372D" />} title={t('today.glucose')} done={measured} onPress={() => go('log', 'glucose')} />,
    );
  }
  if (glp1)
    rows.push(
      <ListRow
        key="se"
        icon={<Glyph name="heart" bg="#B7791F" />}
        title={t('today.feel')}
        subtitle={d.sideEffectsToday.length ? undefined : t('today.feelSub')}
        done={d.sideEffectsToday.length > 0}
        onPress={() => go('log', 'effects')}
      />,
    );
  if (state.plan.weigh.enabled && state.plan.weigh.weekday === weekday) {
    const weighed = state.weights.some((w) => w.at.slice(0, 10) === today);
    rows.push(<ListRow key="w" icon={<Glyph name="scale" bg="#5B4BC4" />} title={t('today.weigh')} done={weighed} onPress={() => go('log', 'weight')} />);
  }
  if (glp1)
    rows.push(
      <ListRow
        key="p"
        icon={<Glyph name="protein" bg="#D9542F" />}
        title={t('today.protein')}
        subtitle={t('today.proteinSub', {
          a: d.proteinToday,
          b: state.goals.proteinG,
        })}
        done={d.proteinToday >= state.goals.proteinG}
        onPress={() => go('log', 'intake')}
      />,
    );
  if (glp1 && d.nextPhase && d.phaseChangeSoon)
    rows.push(
      <ListRow
        key="tit"
        icon={<Glyph name="steps" bg="#1E63C7" />}
        title={t('today.titration', { dose: String(d.nextPhase.dose).replace('.', ',') })}
        subtitle={t('today.titrationSub', { date: new Date(d.nextPhase.at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }) })}
        onPress={() => go('progress')}
      />,
    );
  rows.push(
    <ListRow
      key="str"
      icon={<Glyph name="dumbbell" bg="#5B4BC4" />}
      title={t('today.strength')}
      subtitle={t('today.strengthSub', { a: d.strengthThisWeek, b: state.goals.strengthPerWeek })}
      done={d.strengthThisWeek >= state.goals.strengthPerWeek}
      onPress={() => go('log', 'strength')}
    />,
  );
  if (unread)
    rows.push(
      <ListRow
        key="a"
        icon={<Glyph name="headphones" bg="#1E63C7" />}
        title={t('today.audio', {
          who: TEAM[unread.from as keyof typeof TEAM].short,
        })}
        subtitle={`${unread.durationSec} s`}
        onPress={() => go('team')}
      />,
    );
  return <ListGroup>{rows}</ListGroup>;
}

function Tile({ label, color, value, unit, sub, onPress }: { label: string; color: string; value: string; unit?: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value} ${unit ?? ''}. ${sub ?? ''}`}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        flexBasis: '47%',
        flexGrow: 1,
        backgroundColor: colors.white,
        borderRadius: radius.l,
        padding: 14,
        gap: 6,
        opacity: pressed ? 0.75 : 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      })}
    >
      <T v="small" color={color}>
        {label}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        <T v="title">{value}</T>
        {unit ? (
          <T v="small" color={colors.secondary} style={{ paddingBottom: 5 }}>
            {unit}
          </T>
        ) : null}
      </View>
      {sub ? (
        <T v="small" color={colors.secondary}>
          {sub}
        </T>
      ) : null}
    </Pressable>
  );
}

export function SummaryGrid() {
  const { state, d } = useStore();
  const { go } = useNav();
  const glp1 = usesGlp1(state.profile);
  const t2 = hasDiabetes(state.profile);
  const tiles: React.ReactNode[] = [];
  if (isT1(state.profile)) {
    tiles.push(<Tile key="tir" label={t('sum.tir')} color={colors.greenText} value={`${d.tir24}`} unit="%" sub={t('sum.tirSub', { avg: d.avg24 ?? '—' })} onPress={() => go('progress')} />);
    tiles.push(<Tile key="ins" label={t('sum.insulin')} color={colors.blue} value={String(d.rapidTodayU)} unit="u" sub={d.basalToday ? t('sum.basalDone') : t('sum.basalPending')} onPress={() => go('log', 'insulin')} />);
    tiles.push(<Tile key="carb" label={t('sum.carbs')} color={colors.coralText} value={String(d.carbsToday)} unit="g" sub={t('sum.carbsSub')} onPress={() => go('log', 'carbs')} />);
  }
  if (t2 && d.lastGlucose && !isT1(state.profile))
    tiles.push(
      <Tile
        key="glu"
        label={t('sum.glucose')}
        color={colors.coralText}
        value={String(d.lastGlucose.v)}
        unit="mg/dL"
        sub={`${t(`ctx.${d.lastGlucose.context}`)} · ${t(`gstatus.${d.glucoseStatus}`)}`}
        onPress={() => go('progress')}
      />,
    );
  if (glp1 && d.nextInjectionAt)
    tiles.push(
      <Tile
        key="inj"
        label={t('sum.injection')}
        color={colors.blue}
        value={d.injectedToday ? '✓' : d.daysToInjection === 0 ? t('sum.today') : `${d.daysToInjection} d`}
        sub={
          d.injectedToday
            ? t('sum.injDone')
            : new Date(d.nextInjectionAt).toLocaleDateString('es-ES', {
                weekday: 'long',
              })
        }
        onPress={() => go('log', 'injection')}
      />,
    );
  if (d.weightNow !== null)
    tiles.push(
      <Tile
        key="w"
        label={t('sum.weight')}
        color={colors.purple}
        value={fmt1(d.weightNow)}
        unit="kg"
        sub={d.lostKg > 0 ? t('sum.lost', { kg: fmt1(d.lostKg) }) : undefined}
        onPress={() => go('progress')}
      />,
    );
  if (t2 && d.hba1cNow !== null)
    tiles.push(
      <Tile
        key="hb"
        label={t('sum.hba1c')}
        color={colors.yellowDark}
        value={fmt1(d.hba1cNow)}
        unit="%"
        sub={d.hba1cPrev !== null ? t('sum.prev', { v: fmt1(d.hba1cPrev) }) : undefined}
        onPress={() => go('progress')}
      />,
    );
  if (glp1 && d.musclePct !== null)
    tiles.push(<Tile key="mus" label={t('sum.muscle')} color={colors.blue} value={fmt1(d.musclePct)} unit="%" sub={t('sum.muscleSub')} onPress={() => go('progress')} />);
  tiles.push(
    <Tile
      key="steps"
      label={t('sum.steps')}
      color={colors.greenText}
      value={STEPS_TODAY.toLocaleString('es-ES')}
      sub={t('sum.stepsSub')}
      onPress={() => go('progress')}
    />,
  );
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{tiles.slice(0, 4)}</View>;
}
