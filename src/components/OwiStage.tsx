/**
 * Escenario de Owi (cabecera de "Hoy"): Owi animado y protagonista, dentro de los anillos del día
 * (plan · movimiento · proteína), con un fondo que cambia con su emoción y su frase con tus datos.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { PetMood } from '../state/types';
import { isDark } from '../theme';
import OwiAnimated from './OwiAnimated';
import { RING } from './rings';

const ND = Platform.OS !== 'web';

/** Atmósfera por emoción: [arriba, abajo, halo]. */
const SKY: Record<PetMood, [string, string, string]> = isDark
  ? {
      happy: ['#0E2A27', '#0B0C0F', '#2DD4BF'],
      attentive: ['#102233', '#0B0C0F', '#7A9BFF'],
      caringHigh: ['#2A1620', '#0B0C0F', '#FF8FA3'],
      worriedHigh: ['#2B1C10', '#0B0C0F', '#F5B95A'],
      caringLow: ['#2A1620', '#0B0C0F', '#FF8FA3'],
      worriedLow: ['#2B1C10', '#0B0C0F', '#F5B95A'],
      celebrate: ['#2B2410', '#0B0C0F', '#FFD166'],
      sleep: ['#141634', '#0B0C0F', '#A58FFF'],
      confused: ['#1E1934', '#0B0C0F', '#A58FFF'],
      remind: ['#2B2410', '#0B0C0F', '#FFD166'],
      sport: ['#0F2433', '#0B0C0F', '#5CC8FF'],
      missYou: ['#2A1620', '#0B0C0F', '#FF8FA3'],
    }
  : {
      happy: ['#CFF1EA', '#F4F3EF', '#5EEAD4'],
      attentive: ['#DCE8FF', '#F4F3EF', '#8FB0FF'],
      caringHigh: ['#FFE1E6', '#F4F3EF', '#FF9CB0'],
      worriedHigh: ['#FFEBCF', '#F4F3EF', '#FFC56B'],
      caringLow: ['#FFE1E6', '#F4F3EF', '#FF9CB0'],
      worriedLow: ['#FFEBCF', '#F4F3EF', '#FFC56B'],
      celebrate: ['#FFF0BF', '#F4F3EF', '#FFD166'],
      sleep: ['#E3E1FF', '#F4F3EF', '#B2A5FF'],
      confused: ['#E9E3FF', '#F4F3EF', '#B2A5FF'],
      remind: ['#FFF0BF', '#F4F3EF', '#FFD166'],
      sport: ['#D6F0FF', '#F4F3EF', '#7CD4FF'],
      missYou: ['#FFE1E6', '#F4F3EF', '#FF9CB0'],
    };

function Arc({ r, value, color, w, c0 }: { r: number; value: number; color: string; w: number; c0: number }) {
  const c = 2 * Math.PI * r;
  return (
    <>
      <Circle cx={c0} cy={c0} r={r} stroke={color} strokeOpacity={isDark ? 0.18 : 0.16} strokeWidth={w} fill="none" />
      {value > 0.02 && (
        <Circle cx={c0} cy={c0} r={r} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray={`${Math.min(1, value) * c} ${c}`} transform={`rotate(-90 ${c0} ${c0})`} />
      )}
    </>
  );
}

export default function OwiStage({
  mood,
  level,
  rings,
  size = 300,
  onPressOwi,
  label,
  children,
  top = 0,
}: {
  mood: PetMood;
  level: 1 | 2 | 3 | 4;
  rings: { plan: number; move: number; food: number };
  size?: number;
  onPressOwi?: () => void;
  label: string;
  children?: React.ReactNode;
  top?: number;
}) {
  const [a, b, halo] = SKY[mood];
  const glow = useRef(new Animated.Value(0)).current;
  const ringIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
        Animated.timing(glow, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      ]),
    );
    loop.start();
    Animated.timing(ringIn, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
    return () => loop.stop();
  }, [glow, ringIn]);

  const c0 = size / 2;
  const w = size * 0.035;
  return (
    <LinearGradient colors={[a, b]} style={{ paddingTop: top, alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
        {/* Halo que respira */}
        <Animated.View style={{ position: 'absolute', opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }] }}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="halo" cx="50%" cy="52%" r="50%">
                <Stop offset="0" stopColor={halo} stopOpacity={isDark ? 0.42 : 0.55} />
                <Stop offset="0.6" stopColor={halo} stopOpacity={0.12} />
                <Stop offset="1" stopColor={halo} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={c0} cy={c0} r={c0} fill="url(#halo)" />
          </Svg>
        </Animated.View>
        {/* Anillos del día alrededor de Owi */}
        <Animated.View style={{ position: 'absolute', opacity: ringIn, transform: [{ rotate: ringIn.interpolate({ inputRange: [0, 1], outputRange: ['-40deg', '0deg'] }) }] }}>
          <Svg width={size} height={size}>
            <Arc c0={c0} r={c0 - w * 0.6} value={rings.plan} color={RING.plan} w={w} />
            <Arc c0={c0} r={c0 - w * 1.85} value={rings.move} color={RING.move} w={w} />
            <Arc c0={c0} r={c0 - w * 3.1} value={rings.food} color={RING.food} w={w} />
          </Svg>
        </Animated.View>
        <View style={{ marginTop: size * 0.02 }}>
          <OwiAnimated mood={mood} level={level} size={size * 0.84} onPress={onPressOwi} label={label} shadow={false} />
        </View>
      </View>
      {children}
    </LinearGradient>
  );
}
