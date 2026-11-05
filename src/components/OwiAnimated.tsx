/**
 * Owi animado: animaciones tipo GIF renderizadas desde el modelo 3D (OwiSprite) + reacción al tocarlo
 * (da un salto con giro y vuelve a su emoción) y "pop" al cambiar de emoción.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import type { PetLevel, PetMood } from '../state/types';
import { tap } from './motion';
import OwiSprite from './OwiSprite';

const ND = Platform.OS !== 'web';
/** Tamaño según la evolución (crece con el vínculo). */
const LEVEL_SCALE: Record<PetLevel, number> = { 1: 0.9, 2: 0.94, 3: 0.97, 4: 1 };

export default function OwiAnimated({
  mood,
  level = 1,
  size = 180,
  onPress,
  label,
  shadow = true,
}: {
  mood: PetMood;
  level?: PetLevel;
  size?: number;
  onPress?: () => void;
  label?: string;
  shadow?: boolean;
}) {
  const pop = useRef(new Animated.Value(1)).current;
  const [reacting, setReacting] = useState(false);
  useEffect(() => {
    pop.setValue(0.9);
    Animated.spring(pop, { toValue: 1, speed: 10, bounciness: 10, useNativeDriver: ND }).start();
  }, [pop, mood]);
  useEffect(() => {
    if (!reacting) return;
    const id = setTimeout(() => setReacting(false), 2400);
    return () => clearTimeout(id);
  }, [reacting]);

  const s = size * LEVEL_SCALE[level];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        setReacting(true);
        onPress?.();
      }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {shadow && <View style={{ position: 'absolute', bottom: size * 0.035, width: s * 0.34, height: s * 0.05, borderRadius: s, backgroundColor: 'rgba(20,22,26,0.08)' }} />}
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <OwiSprite mood={reacting ? 'celebrate' : mood} size={s} />
      </Animated.View>
    </Pressable>
  );
}
