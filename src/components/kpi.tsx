/**
 * Indicadores con tendencia: mini gráfica (sparkline), tarjeta con el cambio frente a la semana anterior,
 * tira horizontal para Hoy y cuadrícula para Progreso.
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { t } from '../i18n';
import { useNav } from '../nav';
import { fmtDelta, fmtVal, weeklyKpis, type Kpi } from '../state/kpis';
import { useStore } from '../state/store';
import type { AppState } from '../state/types';
import { colors, fonts, isDark } from '../theme';
import { Row, T } from './ui';

/** band: franja objetivo (p. ej. 70–180 mg/dL), sombreada detrás de la línea. */
export function Sparkline({ values, color, width = 120, height = 36, fill = true, band }: { values: number[]; color: string; width?: number; height?: number; fill?: boolean; band?: [number, number] }) {
  if (values.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...values, ...(band ?? []));
  const max = Math.max(...values, ...(band ?? []));
  const span = max - min || 1;
  const pad = 3;
  const xs = values.map((_, i) => pad + (i / (values.length - 1)) * (width - pad * 2));
  const ys = values.map((v) => pad + (1 - (v - min) / span) * (height - pad * 2));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const id = `sg${color.replace('#', '')}`;
  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={isDark ? 0.35 : 0.25} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      {band && (
        <Rect
          x={0}
          y={pad + (1 - (band[1] - min) / span) * (height - pad * 2)}
          width={width}
          height={((band[1] - band[0]) / span) * (height - pad * 2)}
          fill={color}
          opacity={isDark ? 0.1 : 0.08}
          rx={4}
        />
      )}
      {fill && !band && <Path d={`${d} L${xs[xs.length - 1]},${height} L${xs[0]},${height} Z`} fill={`url(#${id})`} />}
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={3.2} fill={color} />
    </Svg>
  );
}

const KPI_COLOR: Record<Kpi['id'], string> = {
  weight: isDark ? '#A58FFF' : '#6A4FE0',
  tir: isDark ? '#3DE0C8' : '#0FA394',
  glucoseAvg: isDark ? '#FF8FA3' : '#D9486A',
  glucoseCv: isDark ? '#F5B95A' : '#C77D12',
  adherence: isDark ? '#5CC8FF' : '#1E63C7',
  logDays: isDark ? '#3DE0C8' : '#5B3DE0',
  mood: isDark ? '#FF7AB6' : '#C2417F',
  strength: isDark ? '#7C6CFF' : '#4A5BD6',
};
export const kpiColor = (id: Kpi['id']) => KPI_COLOR[id];

/** Chip del cambio: verde si va en la buena dirección, rosa si no, gris si es estable. */
export function DeltaChip({ k }: { k: Kpi }) {
  const s = fmtDelta(k);
  if (!s) return null;
  const c = k.good === null ? colors.secondary : k.good ? (isDark ? '#3DE0C8' : '#0E8F7E') : isDark ? '#FF8FA3' : '#C2364F';
  const arrow = s === '=' ? '' : k.delta! > 0 ? '▲ ' : '▼ ';
  return (
    <View style={{ paddingHorizontal: 7, height: 20, borderRadius: 10, justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(27,22,48,0.05)' }}>
      <T v="small" color={c} style={{ fontSize: 11, lineHeight: 14, fontFamily: fonts.semibold }}>
        {arrow}
        {s}
      </T>
    </View>
  );
}

const panel = () => ({
  backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : colors.white,
  borderWidth: 1,
  borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)',
});

export function KpiTile({ k, width, onPress }: { k: Kpi; width?: number; onPress?: () => void }) {
  const [w, setW] = useState(width ?? 140);
  const label = t(`kpi.${k.id}`);
  const a11y = `${label}: ${fmtVal(k)} ${k.unit}${k.delta !== null ? `, ${t('kpi.a11yDelta', { d: fmtDelta(k) })}` : ''}`;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={a11y}
      onPress={onPress}
      onLayout={width ? undefined : (e) => setW(e.nativeEvent.layout.width)}
      style={({ pressed }) => [{ width, flexGrow: width ? 0 : 1, flexBasis: width ? undefined : '46%', borderRadius: 18, padding: 12, gap: 6, opacity: pressed ? 0.75 : 1 }, panel()]}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.5, flex: 1 }} numberOfLines={1}>
          {label.toUpperCase()}
        </T>
      </Row>
      <Row gap={4} style={{ alignItems: 'flex-end' }}>
        <T v="h2" style={{ fontSize: 22, lineHeight: 26 }}>
          {fmtVal(k)}
        </T>
        <T v="small" color={colors.secondary} style={{ paddingBottom: 2 }}>
          {k.unit}
        </T>
      </Row>
      <Row gap={6}>
        <DeltaChip k={k} />
        {k.delta !== null && (
          <T v="small" color={colors.secondary} style={{ fontSize: 11 }}>
            {t('kpi.vsPrev')}
          </T>
        )}
      </Row>
      {k.series.length > 1 ? <Sparkline values={k.series} color={KPI_COLOR[k.id]} width={Math.max(60, w - 24)} height={30} band={k.id === 'glucoseAvg' ? [70, 180] : undefined} /> : <View style={{ height: 30 }} />}
    </Pressable>
  );
}

const TARGET: Record<Kpi['id'], Parameters<ReturnType<typeof useNav>['go']>> = {
  weight: ['progress'],
  tir: ['progress'],
  glucoseAvg: ['progress'],
  glucoseCv: ['progress'],
  adherence: ['progress'],
  logDays: ['progress'],
  mood: ['progress'],
  strength: ['log', 'strength'],
};

/** Tira horizontal "Tu semana" para Hoy. */
export function KpiStrip() {
  const { state } = useStore();
  const { go } = useNav();
  const ks = weeklyKpis(state);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
      {ks.map((k) => (
        <KpiTile key={k.id} k={k} width={150} onPress={() => go(...TARGET[k.id])} />
      ))}
    </ScrollView>
  );
}

/** Cuadrícula de indicadores para Progreso → Datos (o para un paciente concreto en el panel profesional). */
export function KpiGrid({ of, tileWidth }: { of?: AppState; tileWidth?: number } = {}) {
  const { state } = useStore();
  const ks = weeklyKpis(of ?? state);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {ks.map((k) => (
        <KpiTile key={k.id} k={k} width={tileWidth} />
      ))}
    </View>
  );
}
