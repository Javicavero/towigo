/** Gráficas clínicas del panel profesional (SVG, claro/oscuro). */
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { MoodFace } from '../components/checkin';
import { Row, T } from '../components/ui';
import { t } from '../i18n';
import type { AppState } from '../state/types';
import { colors, fonts, isDark } from '../theme';
import { agp } from './cohort';

/** AGP: mediana y bandas 25–75 y 5–95 por hora del día, con rango objetivo 70–180. */
export function AgpChart({ s, height = 220 }: { s: AppState; height?: number }) {
  const [w, setW] = useState(600);
  const rows = agp(s).filter((r) => !Number.isNaN(r.p50));
  if (rows.length < 6) return <T color={colors.secondary}>{t('pro.noCgm')}</T>;
  const padL = 34;
  const padB = 22;
  const lo = 40;
  const hi = 320;
  const x = (h: number) => padL + (h / 23) * (w - padL - 24);
  const y = (v: number) => 8 + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (height - 8 - padB);
  const band = (a: 'p5' | 'p25', b: 'p95' | 'p75') =>
    rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.h)},${y(r[b])}`).join(' ') +
    ' ' +
    [...rows]
      .reverse()
      .map((r) => `L${x(r.h)},${y(r[a])}`)
      .join(' ') +
    ' Z';
  const median = rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.h)},${y(r.p50)}`).join(' ');
  const accent = isDark ? '#7A9BFF' : '#2F5BEA';
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={t('pro.agpA11y')}>
      <Svg width={w} height={height}>
        <Rect x={padL} y={y(180)} width={w - padL - 8} height={y(70) - y(180)} fill={colors.softGreen} />
        {[54, 70, 180, 250].map((v) => (
          <SvgText key={v} x={padL - 5} y={y(v) + 4} fontSize={10} fill={colors.secondary} textAnchor="end" fontFamily={fonts.medium}>
            {v}
          </SvgText>
        ))}
        {[70, 180].map((v) => (
          <Line key={v} x1={padL} x2={w - 8} y1={y(v)} y2={y(v)} stroke={colors.greenText} strokeOpacity={0.4} strokeDasharray="4 4" />
        ))}
        <Path d={band('p5', 'p95')} fill={accent} fillOpacity={0.12} />
        <Path d={band('p25', 'p75')} fill={accent} fillOpacity={0.28} />
        <Path d={median} stroke={accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        {[0, 6, 12, 18, 23].map((h) => (
          <SvgText key={h} x={x(h)} y={height - 5} fontSize={10} fill={colors.secondary} textAnchor="middle" fontFamily={fonts.medium}>
            {`${String(h).padStart(2, '0')}:00`}
          </SvgText>
        ))}
      </Svg>
      <Row gap={14} style={{ flexWrap: 'wrap' }}>
        <T v="small" color={colors.secondary}>
          {t('pro.agpLegend')}
        </T>
      </Row>
    </View>
  );
}

/** Barra de tiempo en rangos (consenso internacional): <54, 54–69, 70–180, 181–250, >250. */
export function TirStack({ s, days = 14 }: { s: AppState; days?: number }) {
  const now = Date.now();
  const g = s.glucose.filter((x) => x.context === 'sensor' && now - new Date(x.at).getTime() < days * 86400e3);
  if (!g.length) return null;
  const pc = (f: (v: number) => boolean) => Math.round((g.filter((x) => f(x.v)).length / g.length) * 100);
  const segs = [
    { k: 'vhigh', v: pc((v) => v > 250), c: '#E8A13A' },
    { k: 'high', v: pc((v) => v > 180 && v <= 250), c: '#F5C76B' },
    { k: 'in', v: pc((v) => v >= 70 && v <= 180), c: colors.owiGreen },
    { k: 'low', v: pc((v) => v >= 54 && v < 70), c: '#E5483A' },
    { k: 'vlow', v: pc((v) => v < 54), c: '#8E1B14' },
  ];
  return (
    <Row gap={14} style={{ alignItems: 'stretch' }}>
      <View style={{ width: 26, height: 150, borderRadius: 8, overflow: 'hidden' }}>
        {segs.map((x) => (x.v > 0 ? <View key={x.k} style={{ flex: x.v, backgroundColor: x.c }} /> : null))}
      </View>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {segs.map((x) => (
          <Row key={x.k} style={{ justifyContent: 'space-between' }}>
            <T v="small" color={colors.secondary}>
              {t(`pro.range.${x.k}`)}
            </T>
            <T v="label">{x.v} %</T>
          </Row>
        ))}
      </View>
    </Row>
  );
}

/** Adherencia a la inyección semanal: 12 semanas, con la dosis registrada. */
export function InjectionStrip({ s }: { s: AppState }) {
  const now = Date.now();
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = now - (11 - i) * 7 * 86400e3;
    const start = end - 7 * 86400e3;
    return s.injections.find((x) => {
      const tt = new Date(x.at).getTime();
      return tt > start && tt <= end;
    });
  });
  return (
    <Row gap={4} style={{ flexWrap: 'wrap' }}>
      {weeks.map((inj, i) => (
        <View
          key={i}
          accessible
          accessibilityLabel={inj ? `${t('pro.week')} ${i + 1}: ${inj.dose} mg` : `${t('pro.week')} ${i + 1}: ${t('pro.noInjection')}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: inj ? colors.softBlue : colors.softCoral,
            borderWidth: 1,
            borderColor: inj ? colors.blue : colors.coralText,
          }}
        >
          <T v="small" color={inj ? colors.blue : colors.coralText} style={{ fontFamily: fonts.semibold, fontSize: 11 }}>
            {inj ? String(inj.dose).replace('.', ',') : '—'}
          </T>
        </View>
      ))}
    </Row>
  );
}

/** Ánimo de los últimos 14 días (check-ins del paciente). */
export function MoodStrip({ s }: { s: AppState }) {
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 86400e3).toISOString().slice(0, 10));
  const by = Object.fromEntries(s.checkins.map((c) => [c.date, c]));
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      {days.map((d) => (
        <View key={d} style={{ alignItems: 'center', gap: 2 }}>
          {by[d] ? <MoodFace v={by[d].v} size={18} /> : <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.line }} />}
          <T v="small" style={{ fontSize: 9 }} color={colors.secondary}>
            {new Date(d).getDate()}
          </T>
        </View>
      ))}
    </Row>
  );
}
