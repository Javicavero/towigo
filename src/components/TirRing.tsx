/** Anillo animado de tiempo en rango (verde) con lo que queda por debajo (rojo) y por encima (coral). */
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';
import { useCountUp } from './motion';
import { T } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TirRing({ inRange, low, high, size = 128, label }: { inRange: number; low: number; high: number; size?: number; label: string }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1100, useNativeDriver: false }).start();
  }, [v, inRange]);
  const n = useCountUp(inRange);
  const seg = (pct: number) => (pct / 100) * c;
  const arc = (len: number, offset: number, color: string) => (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={`${Math.max(0.01, len - 4)} ${c}`}
      strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [len, -offset] }) as unknown as number}
      transform={`rotate(-90 ${size / 2} ${size / 2})`}
    />
  );
  return (
    <View accessible accessibilityLabel={label} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        {low > 0 && arc(seg(low), 0, colors.low)}
        {arc(seg(inRange), seg(low), colors.owiGreen)}
        {high > 0 && arc(seg(high), seg(low + inRange), colors.coral)}
      </Svg>
      <T v="title" color={colors.greenText}>
        {n}%
      </T>
      <T v="small" color={colors.secondary} style={{ marginTop: -4 }}>
        en rango
      </T>
    </View>
  );
}
