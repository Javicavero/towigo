/**
 * Anillos del día (Plan · Movimiento · Nutrición): un vistazo premium a cómo va el día.
 * Miden hábitos, nunca resultados clínicos.
 */
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { STEPS_GOAL, STEPS_TODAY } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { hasT2, isT1, usesGlp1 } from '../state/types';
import { colors, isDark } from '../theme';
import { Card, Row, T } from './ui';

export const RING = { plan: isDark ? '#3EE0C4' : '#0FA394', move: isDark ? '#7A9BFF' : '#2F5BEA', food: isDark ? '#FF8A6B' : '#F0643F' };

export function useDayRings() {
  const { state, d } = useStore();
  const tasks: boolean[] = [state.habitsToday.log, !!d.checkinToday];
  if (isT1(state.profile)) tasks.push(d.basalToday);
  if (usesGlp1(state.profile) && !d.maintenance && d.daysToInjection === 0) tasks.push(d.injectedToday);
  if (hasT2(state.profile) && d.medsToday.length) tasks.push(d.medsToday.every((m) => m.taken));
  const plan = tasks.filter(Boolean).length / tasks.length;
  const move = Math.min(1, STEPS_TODAY / STEPS_GOAL);
  const food = Math.min(1, d.proteinToday / state.goals.proteinG);
  return { plan, move, food, tasksDone: tasks.filter(Boolean).length, tasksTotal: tasks.length };
}

function Ring({ r, value, color, w }: { r: number; value: number; color: string; w: number }) {
  const c = 2 * Math.PI * r;
  return (
    <>
      <Circle cx={60} cy={60} r={r} stroke={color} strokeOpacity={0.16} strokeWidth={w} fill="none" />
      {value > 0.02 && (
        <Circle
          cx={60}
          cy={60}
          r={r}
          stroke={color}
          strokeWidth={w}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.001, value) * c} ${c}`}
          transform="rotate(-90 60 60)"
        />
      )}
    </>
  );
}

export function DayRings() {
  const { state, d } = useStore();
  const { go } = useNav();
  const r = useDayRings();
  const rows = [
    { k: 'plan', color: RING.plan, label: t('rings.plan'), value: t('rings.planValue', { a: r.tasksDone, b: r.tasksTotal }), to: () => go('log') },
    { k: 'move', color: RING.move, label: t('rings.move'), value: t('rings.moveValue', { n: STEPS_TODAY.toLocaleString('es-ES') }), to: () => go('progress') },
    {
      k: 'food',
      color: RING.food,
      label: t('rings.food'),
      value: t('rings.foodValue', { a: d.proteinToday, b: state.goals.proteinG }),
      to: () => go('log', 'intake'),
    },
  ];
  return (
    <Card>
      <Row gap={18}>
        <View accessible accessibilityLabel={t('rings.a11y', { p: Math.round(r.plan * 100), m: Math.round(r.move * 100), f: Math.round(r.food * 100) })}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Ring r={52} value={r.plan} color={RING.plan} w={12} />
            <Ring r={37} value={r.move} color={RING.move} w={12} />
            <Ring r={22} value={r.food} color={RING.food} w={12} />
          </Svg>
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          {rows.map((x) => (
            <View key={x.k} style={{ gap: 1 }}>
              <T v="small" color={x.color} style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 }}>
                {x.label.toUpperCase()}
              </T>
              <T v="label" color={colors.ink}>
                {x.value}
              </T>
            </View>
          ))}
        </View>
      </Row>
    </Card>
  );
}
