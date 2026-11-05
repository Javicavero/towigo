/** Gráfica de evolución (peso, glucosa...): línea animada, franja objetivo opcional y último punto destacado. */
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type Point = { t: number; v: number };

export default function TrendChart({
  points,
  height = 150,
  band,
  color = colors.greenText,
  unit = '',
  decimals = 0,
  label,
}: {
  points: Point[];
  height?: number;
  band?: [number, number];
  color?: string;
  unit?: string;
  decimals?: number;
  label: string;
}) {
  const [w, setW] = useState(320);
  const draw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    draw.setValue(0);
    Animated.timing(draw, { toValue: 1, duration: 900, useNativeDriver: false }).start();
  }, [draw, points.length]);
  if (points.length < 2) return null;
  const pts = [...points].sort((a, b) => a.t - b.t);
  const padL = 38;
  const padR = 14;
  const padT = 18;
  const padB = 22;
  const vs = pts.map((p) => p.v).concat(band ?? []);
  let min = Math.min(...vs);
  let max = Math.max(...vs);
  const span = Math.max(1, max - min);
  min -= span * 0.12;
  max += span * 0.12;
  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t;
  const x = (t: number) => padL + ((t - t0) / Math.max(1, t1 - t0)) * (w - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (height - padT - padB);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const len = pts.reduce((acc, p, i) => (i ? acc + Math.hypot(x(p.t) - x(pts[i - 1].t), y(p.v) - y(pts[i - 1].v)) : 0), 0);
  const last = pts[pts.length - 1];
  const fmt = (v: number) => v.toFixed(decimals).replace('.', ',');
  const ticks = [min + (max - min) * 0.15, (min + max) / 2, max - (max - min) * 0.15];
  const fmtX = (t: number) => new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={label}>
      <Svg width={w} height={height}>
        {band && <Rect x={padL} y={y(band[1])} width={w - padL - padR} height={Math.max(0, y(band[0]) - y(band[1]))} fill={colors.softGreen} rx={6} />}
        {ticks.map((v) => (
          <SvgText key={v} x={padL - 6} y={y(v) + 4} fontSize={11} fill={colors.secondary} textAnchor="end" fontFamily={fonts.semibold}>
            {fmt(v)}
          </SvgText>
        ))}
        <Line x1={padL} x2={w - padR} y1={height - padB} y2={height - padB} stroke={colors.line} strokeWidth={1} />
        {[t0, (t0 + t1) / 2, t1].map((tt, i) => (
          <SvgText key={i} x={x(tt)} y={height - 5} fontSize={11} fill={colors.secondary} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontFamily={fonts.semibold}>
            {fmtX(tt)}
          </SvgText>
        ))}
        <AnimatedPath
          d={d}
          stroke={color}
          strokeWidth={3.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [len, 0] }) as unknown as number}
        />
        {pts.map((p, i) => (
          <Circle key={`${p.t}-${i}`} cx={x(p.t)} cy={y(p.v)} r={3} fill={color} opacity={0.5} />
        ))}
        <Circle cx={x(last.t)} cy={y(last.v)} r={7} fill={color} stroke={colors.white} strokeWidth={3} />
        <SvgText x={x(last.t) - 10} y={y(last.v) - 12} fontSize={12} fill={color} textAnchor="end" fontFamily={fonts.bold}>
          {fmt(last.v)}
          {unit}
        </SvgText>
      </Svg>
    </View>
  );
}
