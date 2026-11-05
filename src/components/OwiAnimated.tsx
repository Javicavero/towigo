/**
 * Owi animado en 2D: las 12 ilustraciones del diseño con movimiento según la emoción
 * (respira, salta, se balancea, tiembla, flota dormido...) y reacción al tocarlo.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import type { PetLevel, PetMood } from '../state/types';
import { tap } from './motion';
import { OWI_STICKERS } from './OwiSticker';

const ND = Platform.OS !== 'web';

type Motion = 'breathe' | 'bounce' | 'jump' | 'rock' | 'tremble' | 'float' | 'run';
const MOTION: Record<PetMood, Motion> = {
  happy: 'bounce',
  attentive: 'rock',
  caringHigh: 'breathe',
  worriedHigh: 'tremble',
  caringLow: 'breathe',
  worriedLow: 'tremble',
  celebrate: 'jump',
  sleep: 'float',
  confused: 'rock',
  remind: 'bounce',
  sport: 'run',
  missYou: 'bounce',
};

/** Tamaño según la evolución (crece con el vínculo). */
const LEVEL_SCALE: Record<PetLevel, number> = { 1: 0.82, 2: 0.9, 3: 0.96, 4: 1 };
const LEVEL_BADGE: Record<PetLevel, string | null> = { 1: null, 2: '🧣', 3: '🧢', 4: '🏅' };

export default function OwiAnimated({
  mood,
  level = 1,
  size = 180,
  onPress,
  label,
}: {
  mood: PetMood;
  level?: PetLevel;
  size?: number;
  onPress?: () => void;
  label?: string;
}) {
  const t = useRef(new Animated.Value(0)).current; // bucle 0→1
  const pop = useRef(new Animated.Value(1)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const motion = MOTION[mood];

  useEffect(() => {
    t.setValue(0);
    const dur = { breathe: 2600, bounce: 900, jump: 600, rock: 2200, tremble: 300, float: 3200, run: 380 }[motion];
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: ND }));
    loop.start();
    return () => loop.stop();
  }, [t, motion]);

  // "Pop" al cambiar de emoción
  useEffect(() => {
    pop.setValue(0.82);
    Animated.spring(pop, { toValue: 1, speed: 12, bounciness: 14, useNativeDriver: ND }).start();
  }, [pop, mood]);

  const wave = (a: number, b: number) => t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, a, 0, b, 0] });
  const hop = (h: number) => t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -h, 0], easing: Easing.out(Easing.quad) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transforms: any[] = [];
  switch (motion) {
    case 'breathe':
      transforms.push({ scaleY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.035, 1] }) });
      break;
    case 'bounce':
      transforms.push({ translateY: hop(size * 0.04) });
      break;
    case 'jump':
      transforms.push({ translateY: hop(size * 0.14) }, { rotate: wave(0.06, -0.06).interpolate({ inputRange: [-1, 1], outputRange: ['-57deg', '57deg'] }) });
      break;
    case 'rock':
      transforms.push({ rotate: wave(0.05, -0.05).interpolate({ inputRange: [-1, 1], outputRange: ['-57deg', '57deg'] }) });
      break;
    case 'tremble':
      transforms.push({ translateX: wave(1.5, -1.5) });
      break;
    case 'float':
      transforms.push({ translateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, size * 0.025, 0] }) }, { scaleY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.97, 1] }) });
      break;
    case 'run':
      transforms.push({ translateY: hop(size * 0.03) }, { translateX: wave(2, -2) });
      break;
  }
  transforms.push({ scale: pop });
  transforms.push({ rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] }) });

  const s = size * LEVEL_SCALE[level];
  const badge = LEVEL_BADGE[level];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={() => {
        tap();
        Animated.sequence([
          Animated.timing(wiggle, { toValue: 1, duration: 90, useNativeDriver: ND }),
          Animated.timing(wiggle, { toValue: -1, duration: 120, useNativeDriver: ND }),
          Animated.timing(wiggle, { toValue: 0.5, duration: 100, useNativeDriver: ND }),
          Animated.timing(wiggle, { toValue: 0, duration: 90, useNativeDriver: ND }),
        ]).start();
        onPress?.();
      }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {/* sombra en el suelo */}
      <View style={{ position: 'absolute', bottom: size * 0.02, width: s * 0.55, height: s * 0.07, borderRadius: s, backgroundColor: 'rgba(30,42,50,0.10)' }} />
      <Animated.Image key={mood} source={OWI_STICKERS[mood]} resizeMode="contain" style={{ width: s, height: s, transform: transforms }} />
      {badge && (
        <View style={{ position: 'absolute', right: size * 0.06, bottom: size * 0.06, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2, borderColor: '#EFE9FF' }}>
          <Animated.Text style={{ fontSize: size * 0.1 }}>{badge}</Animated.Text>
        </View>
      )}
    </Pressable>
  );
}
