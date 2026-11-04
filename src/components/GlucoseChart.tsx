import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { DEFAULT_TARGET } from '../config';
import type { Reading } from '../data/mock';
import { colors, fonts } from '../theme';

const MIN = 40;
const MAX = 300;

/** Gráfica de las últimas 24 h con la franja del rango objetivo. Solo muestra datos (Fase 1). */
export default function GlucoseChart({ series, height = 170, label }: { series: Reading[]; height?: number; label: string }) {
  const [w, setW] = useState(320);
  if (!series.length) return null;
  const padL = 32;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const end = Date.now();
  const start = end - 24 * 3600e3;
  const x = (t: number) => padL + ((t - start) / (end - start)) * (w - padL - padR);
  const y = (v: number) => padT + (1 - (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * (height - padT - padB);
  const d = series.map((r, i) => `${i ? 'L' : 'M'}${x(r.t).toFixed(1)},${y(r.v).toFixed(1)}`).join(' ');
  const last = series[series.length - 1];
  const lastColor = last.v < DEFAULT_TARGET.low ? colors.low : last.v > DEFAULT_TARGET.high ? colors.coralText : colors.greenText;
  const hours = [0, 6, 12, 18, 24].map((h) => start + h * 3600e3);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={label}>
      <Svg width={w} height={height}>
        <Rect
          x={padL}
          y={y(DEFAULT_TARGET.high)}
          width={w - padL - padR}
          height={y(DEFAULT_TARGET.low) - y(DEFAULT_TARGET.high)}
          fill={colors.softGreen}
          rx={6}
        />
        {[DEFAULT_TARGET.low, DEFAULT_TARGET.high].map((v) => (
          <SvgText key={v} x={padL - 6} y={y(v) + 4} fontSize={11} fill={colors.secondary} textAnchor="end" fontFamily={fonts.semibold}>
            {v}
          </SvgText>
        ))}
        {hours.map((t, i) => (
          <SvgText
            key={i}
            x={x(t)}
            y={height - 5}
            fontSize={11}
            fill={colors.secondary}
            textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}
            fontFamily={fonts.semibold}
          >
            {`${new Date(t).getHours()}h`}
          </SvgText>
        ))}
        <Line x1={padL} x2={w - padR} y1={height - padB} y2={height - padB} stroke={colors.line} strokeWidth={1} />
        <Path d={d} stroke={colors.ink} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {series
          .filter((r) => r.v < DEFAULT_TARGET.low)
          .map((r) => (
            <Circle key={r.t} cx={x(r.t)} cy={y(r.v)} r={3} fill={colors.low} />
          ))}
        <Circle cx={x(last.t)} cy={y(last.v)} r={7} fill={lastColor} stroke={colors.white} strokeWidth={3} />
      </Svg>
    </View>
  );
}
