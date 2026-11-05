/**
 * Tipo 1 (inspirado en lo mejor de Gluroo): el día entero en una sola gráfica —glucosa del sensor,
 * insulina y carbohidratos— y un registro rapidísimo. Fase 1: solo datos; nunca bolos ni dosis.
 */
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';
import { Glyph, Icon } from './icons';
import { Button, Card, Row, T } from './ui';

const HOUR = 3600e3;
const hhmm = (x: string | number) => new Date(x).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
export const TREND_ARROW = { up2: '⇈', up: '↑', flat: '→', down: '↓', down2: '⇊' } as const;
export const glucoseColor = (v: number) => (v < 70 ? colors.low : v > 180 ? colors.coralText : colors.greenText);

/** Gráfica del día: glucosa (sensor), franja 70–180, insulina (abajo) y carbohidratos (arriba). */
export function DayTimeline({ hours = 24, height = 210 }: { hours?: number; height?: number }) {
  const { state } = useStore();
  const [w, setW] = useState(340);
  const now = Date.now();
  const from = now - hours * HOUR;
  const g = state.glucose.filter((x) => new Date(x.at).getTime() >= from).sort((a, b) => a.at.localeCompare(b.at));
  const ins = state.insulin.filter((x) => new Date(x.at).getTime() >= from);
  const carbs = state.carbs.filter((x) => new Date(x.at).getTime() >= from);
  const padL = 30;
  const padR = 8;
  const top = 26; // carbohidratos
  const bottom = 30; // insulina + horas
  const lo = 40;
  const hi = 300;
  const x = (tt: number) => padL + ((tt - from) / (now - from)) * (w - padL - padR);
  const y = (v: number) => top + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (height - top - bottom);
  const path = g.map((p, i) => `${i ? 'L' : 'M'}${x(new Date(p.at).getTime()).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const ticks = [6, 12, 18].map((k) => now - k * HOUR).filter((tt) => tt > from);
  const last = g[g.length - 1];
  const a11y = last ? t('t1.chartA11y', { v: last.v, n: ins.length, c: carbs.length }) : t('glu.none');
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={a11y}>
      <Svg width={w} height={height}>
        <Rect x={padL} y={y(180)} width={w - padL - padR} height={y(70) - y(180)} fill={colors.softGreen} />
        {[70, 180].map((v) => (
          <SvgText key={v} x={padL - 4} y={y(v) + 4} fontSize={10} fill={colors.secondary} textAnchor="end" fontFamily={fonts.medium}>
            {v}
          </SvgText>
        ))}
        {ticks.map((tt) => (
          <Line key={tt} x1={x(tt)} x2={x(tt)} y1={top} y2={height - bottom} stroke={colors.line} strokeDasharray="3 4" />
        ))}
        {ticks.map((tt) => (
          <SvgText key={`l${tt}`} x={x(tt)} y={height - 4} fontSize={10} fill={colors.secondary} textAnchor="middle" fontFamily={fonts.medium}>
            {hhmm(tt)}
          </SvgText>
        ))}
        <Path d={path} stroke={colors.ink} strokeWidth={2} fill="none" strokeLinejoin="round" />
        {g
          .filter((p) => p.v < 70)
          .map((p) => (
            <Circle key={p.id} cx={x(new Date(p.at).getTime())} cy={y(p.v)} r={3} fill={colors.low} />
          ))}
        {last && <Circle cx={x(new Date(last.at).getTime())} cy={y(last.v)} r={5} fill={glucoseColor(last.v)} stroke={colors.white} strokeWidth={2} />}
        {/* Carbohidratos: círculos naranjas arriba */}
        {carbs.map((c) => {
          const cx = x(new Date(c.at).getTime());
          return (
            <G key={c.id}>
              <Circle cx={cx} cy={12} r={10} fill={colors.coral} />
              <SvgText x={cx} y={15.5} fontSize={9} fill={colors.white} textAnchor="middle" fontFamily={fonts.bold}>
                {c.g}
              </SvgText>
            </G>
          );
        })}
        {/* Insulina: triángulos abajo (azul rápida, morado lenta) */}
        {ins.map((i) => {
          const cx = x(new Date(i.at).getTime());
          const by = height - bottom + 2;
          const col = i.kind === 'basal' ? colors.purple : colors.blue;
          return (
            <G key={i.id}>
              <Polygon points={`${cx - 7},${by} ${cx + 7},${by} ${cx},${by + 11}`} fill={col} />
              <SvgText x={i.kind === 'basal' ? cx + 9 : cx} y={i.kind === 'basal' ? by + 10 : by - 3} fontSize={9} fill={col} textAnchor={i.kind === 'basal' ? 'start' : 'middle'} fontFamily={fonts.bold}>
                {i.units}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <Row gap={14} style={{ flexWrap: 'wrap', marginTop: 4 }}>
        <Legend color={colors.coral} label={t('t1.legendCarbs')} />
        <Legend color={colors.blue} label={t('t1.legendRapid')} />
        <Legend color={colors.purple} label={t('t1.legendBasal')} />
      </Row>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <T v="small" color={colors.secondary}>
        {label}
      </T>
    </Row>
  );
}

/** Barra de tiempo en rango (bajo / en rango / alto), estándar de los sensores. */
export function TirBar({ days = 7 }: { days?: number }) {
  const { state } = useStore();
  const now = Date.now();
  const g = state.glucose.filter((x) => x.context === 'sensor' && now - new Date(x.at).getTime() < days * 24 * HOUR);
  if (!g.length) return null;
  const pct = (f: (v: number) => boolean) => Math.round((g.filter((x) => f(x.v)).length / g.length) * 100);
  const vlow = pct((v) => v < 54);
  const low = pct((v) => v >= 54 && v < 70);
  const inR = pct((v) => v >= 70 && v <= 180);
  const high = pct((v) => v > 180 && v <= 250);
  const vhigh = Math.max(0, 100 - vlow - low - inR - high);
  const segs = [
    { k: 'vhigh', v: vhigh, c: '#E8A13A' },
    { k: 'high', v: high, c: '#F5C76B' },
    { k: 'in', v: inR, c: colors.owiGreen },
    { k: 'low', v: low, c: '#E5483A' },
    { k: 'vlow', v: vlow, c: '#8E1B14' },
  ];
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={t('t1.tirA11y', { n: inR, low: low + vlow, high: high + vhigh, days })}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="label">{t('t1.tirTitle', { days })}</T>
        <T v="label" color={colors.greenText}>
          {inR} %
        </T>
      </Row>
      <View style={{ flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden' }}>
        {segs.map((s) => (s.v > 0 ? <View key={s.k} style={{ flex: s.v, backgroundColor: s.c }} /> : null))}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="small" color={colors.secondary}>
          {t('t1.tirLow', { n: low + vlow })}
        </T>
        <T v="small" color={colors.secondary}>
          {t('t1.tirIn', { n: inR })}
        </T>
        <T v="small" color={colors.secondary}>
          {t('t1.tirHigh', { n: high + vhigh })}
        </T>
      </Row>
    </View>
  );
}

/** Tarjeta principal de tipo 1: glucosa ahora con tendencia, el día en una gráfica y accesos rápidos. */
export function T1Card() {
  const { state, d } = useStore();
  const { go } = useNav();
  const g = d.lastGlucose;
  const mins = g ? Math.round((Date.now() - new Date(g.at).getTime()) / 60e3) : 0;
  return (
    <Card>
      <Row gap={10}>
        <Glyph name="signal" bg="#C8372D" />
        <T v="h2" style={{ flex: 1 }}>
          {t('t1.title')}
        </T>
        <T v="label" color={colors.greenText}>
          {t('t1.tirToday', { n: d.tir24 })}
        </T>
      </Row>
      {g ? (
        <Row gap={10} style={{ alignItems: 'flex-end' }}>
          <T v="big" color={glucoseColor(g.v)}>
            {g.v}
          </T>
          {d.trend && (
            <View accessible accessibilityLabel={t(`trend.${d.trend}`)}>
              <T v="title" color={glucoseColor(g.v)} style={{ paddingBottom: 8 }}>
                {TREND_ARROW[d.trend]}
              </T>
            </View>
          )}
          <T v="small" color={colors.secondary} style={{ paddingBottom: 12, flex: 1 }}>
            mg/dL · {mins <= 1 ? t('t1.now') : t('t1.minsAgo', { n: mins })}
          </T>
        </Row>
      ) : (
        <T color={colors.secondary}>{t('glu.none')}</T>
      )}
      {(d.glucoseStatus === 'low' || d.glucoseStatus === 'veryLow') && (
        <T v="label" color={colors.low}>
          {t('glu.lowNote')}
        </T>
      )}
      <DayTimeline />
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Chip icon="syringe" color={colors.blue} text={t('t1.rapidToday', { n: d.rapidTodayU })} />
        <Chip icon="clock" color={colors.purple} text={d.basalToday ? t('t1.basalDone') : t('t1.basalPending', { time: state.insulinPlan.basalTime })} />
        <Chip icon="meal" color={colors.coralText} text={t('t1.carbsToday', { n: d.carbsToday })} />
      </Row>
      <Row gap={8}>
        <Button style={{ flex: 1 }} kind="secondary" label={t('t1.logInsulin')} onPress={() => go('log', 'insulin')} />
        <Button style={{ flex: 1 }} kind="secondary" label={t('t1.logCarbs')} onPress={() => go('log', 'carbs')} />
      </Row>
    </Card>
  );
}

function Chip({ icon, color, text }: { icon: 'syringe' | 'clock' | 'meal'; color: string; text: string }) {
  return (
    <Row gap={6} style={{ backgroundColor: colors.cream, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Icon name={icon} size={16} color={color} />
      <T v="small">{text}</T>
    </Row>
  );
}

/** Lista del día al estilo "mensajes": todo lo apuntado, en orden. */
export function DayLog() {
  const { state } = useStore();
  const today = new Date().toDateString();
  const items = [
    ...state.insulin.filter((i) => new Date(i.at).toDateString() === today).map((i) => ({ at: i.at, icon: 'syringe' as const, c: i.kind === 'basal' ? colors.purple : colors.blue, text: t(i.kind === 'basal' ? 't1.logBasal' : 't1.logRapid', { n: i.units }) })),
    ...state.carbs.filter((c) => new Date(c.at).toDateString() === today).map((c) => ({ at: c.at, icon: 'meal' as const, c: colors.coralText, text: t('t1.logCarb', { n: c.g, label: c.label ?? '' }).trim() })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  if (!items.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{t('t1.dayLog')}</T>
      {items.map((it, k) => (
        <Row key={k} gap={10}>
          <T v="small" color={colors.secondary} style={{ width: 44 }}>
            {hhmm(it.at)}
          </T>
          <Icon name={it.icon} size={16} color={it.c} />
          <T v="small" style={{ flex: 1 }}>
            {it.text}
          </T>
        </Row>
      ))}
    </View>
  );
}
