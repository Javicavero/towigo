/**
 * Escenario de Owi (cabecera de "Hoy"): Owi animado y protagonista, dentro de los anillos del día
 * (plan · movimiento · proteína), con un fondo que cambia con su emoción y su frase con tus datos.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { PetMood } from '../state/types';
import { fonts, isDark } from '../theme';
import { T } from './ui';
import OwiAnimated from './OwiAnimated';
import { RING } from './rings';

const ND = Platform.OS !== 'web';

/** Atmósfera por emoción: [arriba, abajo, halo]. */
const SKY: Record<PetMood, [string, string, string]> = isDark
  ? {
      happy: ['#1A1F45', '#0A0F1E', '#7C6CFF'],
      attentive: ['#102233', '#0A0F1E', '#7A9BFF'],
      caringHigh: ['#2A1620', '#0A0F1E', '#FF8FA3'],
      worriedHigh: ['#2B1C10', '#0A0F1E', '#F5B95A'],
      caringLow: ['#2A1620', '#0A0F1E', '#FF8FA3'],
      worriedLow: ['#2B1C10', '#0A0F1E', '#F5B95A'],
      celebrate: ['#2B2410', '#0A0F1E', '#FFD166'],
      sleep: ['#141634', '#0A0F1E', '#A58FFF'],
      confused: ['#1E1934', '#0A0F1E', '#A58FFF'],
      remind: ['#2B2410', '#0A0F1E', '#FFD166'],
      sport: ['#0F2433', '#0A0F1E', '#5CC8FF'],
      missYou: ['#2A1620', '#0A0F1E', '#FF8FA3'],
    }
  : {
      happy: ['#E4DBFF', '#F4F1FA', '#A893FF'],
      attentive: ['#DCE8FF', '#F4F1FA', '#8FB0FF'],
      caringHigh: ['#FFE1E6', '#F4F1FA', '#FF9CB0'],
      worriedHigh: ['#FFEBCF', '#F4F1FA', '#FFC56B'],
      caringLow: ['#FFE1E6', '#F4F1FA', '#FF9CB0'],
      worriedLow: ['#FFEBCF', '#F4F1FA', '#FFC56B'],
      celebrate: ['#FFF0BF', '#F4F1FA', '#FFD166'],
      sleep: ['#E3E1FF', '#F4F1FA', '#B2A5FF'],
      confused: ['#E9E3FF', '#F4F1FA', '#B2A5FF'],
      remind: ['#FFF0BF', '#F4F1FA', '#FFD166'],
      sport: ['#D6F0FF', '#F4F1FA', '#7CD4FF'],
      missYou: ['#FFE1E6', '#F4F1FA', '#FF9CB0'],
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

/**
 * Evolución visible: a partir del nivel 2 aparecen "chispas" que orbitan alrededor de Owi
 * (2, 4 o 6 según el nivel), y en el nivel 4 un aro dorado.
 */
const ORBITS: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 2, 3: 4, 4: 6 };

function Orbit({ size, level, color }: { size: number; level: 1 | 2 | 3 | 4; color: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: ND }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const n = ORBITS[level];
  if (!n) return null;
  const r = size * 0.37;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const d = i % 2 ? 6 : 9;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: size / 2 + Math.cos(a) * r - d / 2,
              top: size / 2 + Math.sin(a) * r - d / 2,
              width: d,
              height: d,
              borderRadius: d,
              backgroundColor: color,
              shadowColor: color,
              shadowOpacity: 0.9,
              shadowRadius: 8,
              opacity: i % 2 ? 0.7 : 1,
            }}
          />
        );
      })}
    </Animated.View>
  );
}

export default function OwiStage({
  mood,
  level,
  rings,
  levelInfo,
  reactKey,
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
  /** Nivel visible bajo Owi: nombre y progreso al siguiente (0–1). */
  levelInfo?: { label: string; progress: number; a11y: string };
  /** Cambia cuando el usuario registra algo: Owi lo celebra. */
  reactKey?: number;
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
        <Orbit size={size} level={level} color={halo} />
        {level === 4 && <View pointerEvents="none" style={{ position: 'absolute', width: size * 0.8, height: size * 0.8, borderRadius: size, borderWidth: 2, borderColor: isDark ? 'rgba(255,209,102,0.55)' : 'rgba(217,146,31,0.45)' }} />}
        <View style={{ marginTop: size * 0.02 }}>
          <OwiAnimated mood={mood} level={level} size={size * 0.84} onPress={onPressOwi} label={label} shadow={false} reactKey={reactKey} />
        </View>
      </View>
      {levelInfo && (
        <View accessible accessibilityLabel={levelInfo.a11y} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 6, paddingHorizontal: 12, height: 28, borderRadius: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)' }}>
          <T v="small" style={{ fontFamily: fonts.semibold, fontSize: 12 }}>
            {levelInfo.label}
          </T>
          <View style={{ width: 54, height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(27,22,48,0.10)', overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(Math.max(0.04, Math.min(1, levelInfo.progress)) * 100)}%`, height: '100%', backgroundColor: halo }} />
          </View>
        </View>
      )}
      {children}
    </LinearGradient>
  );
}
