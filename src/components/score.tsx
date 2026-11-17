/**
 * Índice Towigo: indicador circular (como la puntuación de sueño), ficha con el desglose por áreas
 * y su evolución de 14 días. Cálculo en src/state/score.ts.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { t } from '../i18n';
import { scoreHistory, towigoScore, WEIGHTS, type Score } from '../state/score';
import { useStore } from '../state/store';
import type { AppState } from '../state/types';
import { colors, fonts, isDark } from '../theme';
import { Icon, type IconName } from './icons';
import { Sparkline } from './kpi';
import { Button, Row, T } from './ui';

export const BAND_COLOR: Record<Score['band'], [string, string]> = {
  great: isDark ? ['#3DE0C8', '#7C6CFF'] : ['#14B8A6', '#5B3DE0'],
  good: isDark ? ['#7C6CFF', '#5CC8FF'] : ['#5B3DE0', '#1E63C7'],
  fair: isDark ? ['#F5B95A', '#FF8FA3'] : ['#D9921F', '#E5487F'],
  low: isDark ? ['#FF8FA3', '#FF7AB6'] : ['#D9486A', '#C2417F'],
};
const AREA_ICON: Record<keyof typeof WEIGHTS, IconName> = {
  treatment: 'syringe',
  glucose: 'drop',
  weight: 'scale',
  activity: 'dumbbell',
  consistency: 'check',
  wellbeing: 'smile',
  nutrition: 'protein',
};

export function ScoreGauge({ score, size = 124, onPress, label }: { score: Score; size?: number; onPress?: () => void; label?: boolean }) {
  const [c1, c2] = BAND_COLOR[score.band];
  const w = size * 0.085;
  const r = size / 2 - w / 2 - 1;
  const circ = 2 * Math.PI * r;
  const id = `gauge${score.band}`;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={t('score.a11y', { v: score.value, band: t(`score.band.${score.band}`) })}
      onPress={onPress}
      style={({ pressed }) => ({ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c1} />
            <Stop offset="1" stopColor={c2} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)'} strokeWidth={w} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={w}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(Math.max(2, score.value) / 100) * circ} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <T v="display" style={{ fontSize: size * 0.3, lineHeight: size * 0.34, letterSpacing: -1.2 }}>
        {score.value}
      </T>
      {label !== false && (
        <T v="small" color={colors.secondary} style={{ fontSize: Math.max(10, size * 0.085), lineHeight: size * 0.11, fontFamily: fonts.semibold, letterSpacing: 0.4 }}>
          {t('score.short').toUpperCase()}
        </T>
      )}
    </Pressable>
  );
}

function AreaRow({ id, score }: { id: keyof typeof WEIGHTS; score: number }) {
  const band = score >= 85 ? 'great' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'low';
  return (
    <Row gap={10}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={AREA_ICON[id]} size={17} color={colors.greenText} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="label">{t(`score.area.${id}`)}</T>
          <T v="label" style={{ fontFamily: fonts.semibold }}>
            {score}
          </T>
        </Row>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,22,48,0.06)', overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(3, score)}%`, height: '100%', borderRadius: 3, backgroundColor: BAND_COLOR[band][0] }} />
        </View>
      </View>
    </Row>
  );
}

/** Desglose: áreas que cuentan, evolución de 14 días y explicación. */
export function ScoreBreakdown({ of }: { of?: AppState }) {
  const { state } = useStore();
  const s = of ?? state;
  const sc = towigoScore(s);
  const hist = scoreHistory(s, 14);
  const delta = hist.length > 7 ? sc.value - hist[hist.length - 8] : 0;
  const [c1] = BAND_COLOR[sc.band];
  return (
    <View style={{ gap: 14 }}>
      <Row gap={16}>
        <ScoreGauge score={sc} size={112} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h2" color={c1}>
            {t(`score.band.${sc.band}`)}
          </T>
          <T v="small" color={colors.secondary}>
            {t(`score.bandText.${sc.band}`)}
          </T>
          <T v="small" style={{ fontFamily: fonts.semibold }} color={delta > 0 ? (isDark ? '#3DE0C8' : '#0E8F7E') : delta < 0 ? (isDark ? '#FF8FA3' : '#C2364F') : colors.secondary}>
            {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ −${-delta}` : '='} {t('score.vsWeek')}
          </T>
        </View>
      </Row>
      <View style={{ gap: 4 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.5 }}>
            {t('score.history').toUpperCase()}
          </T>
          <T v="small" color={colors.secondary} style={{ fontSize: 11 }}>
            {Math.min(...hist)}–{Math.max(...hist)}
          </T>
        </Row>
        <SparkWide values={hist} color={c1} />
      </View>
      <View style={{ gap: 12 }}>
        {sc.areas.map((a) => (
          <AreaRow key={a.id} id={a.id} score={a.score} />
        ))}
      </View>
      <T v="small" color={colors.secondary}>
        {t('score.how')}
      </T>
    </View>
  );
}

function SparkWide({ values, color }: { values: number[]; color: string }) {
  const [w, setW] = useState(300);
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
      <Sparkline values={values} color={color} width={w} height={48} />
    </View>
  );
}

/** Ficha emergente con el desglose (al tocar el indicador en Hoy). */
export function ScoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(6,10,22,0.55)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 60, alignItems: 'center', justifyContent: 'flex-end', pointerEvents: 'box-none' }}>
        <View style={{ width: '100%', maxWidth: 520, maxHeight: '100%', backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.line }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 34 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T v="h2">{t('score.title')}</T>
                <T v="small" color={colors.secondary}>
                  {t('score.sub')}
                </T>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={18} color={colors.ink} />
              </Pressable>
            </Row>
            <ScoreBreakdown />
            <Button kind="secondary" label={t('common.close')} onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
