/**
 * Movimiento de la interfaz: entradas escalonadas, pulsaciones con rebote, contadores,
 * latidos y lluvia de confeti. Respeta "reducir movimiento" del sistema.
 */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const ND = Platform.OS !== 'web'; // useNativeDriver: no disponible en web

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => (reduceMotion = v))
  .catch(() => {});

export function tap(kind: 'light' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Aparece deslizándose hacia arriba. `delay` para escalonar tarjetas. */
export function FadeIn({ children, delay = 0, style, from = 18 }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; from?: number }) {
  const v = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.back(1.4)), useNativeDriver: ND }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Pulsable que se encoge y rebota al tocarlo. */
export function Bouncy({
  children,
  style,
  outerStyle,
  scaleTo = 0.95,
  onPress,
  ...rest
}: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle>; outerStyle?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: ND, speed: 40, bounciness: 10 }).start();
  return (
    <Pressable
      {...rest}
      style={outerStyle}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        tap();
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Número que cuenta hasta su valor. */
export function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(reduceMotion ? target : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduceMotion) return setV(target);
    const start = Date.now();
    const a = from.current;
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(a + (target - a) * e));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/** Valor animado 0→1 (barras, anillos). */
export function useProgress(value: number, duration = 900) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: value, duration: reduceMotion ? 0 : duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, value, duration]);
  return v;
}

/** Latido continuo suave (llama de la racha, avisos). */
export function Pulse({ children, active = true, scale = 1.12 }: { children: ReactNode; active?: boolean; scale?: number }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: scale, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
        Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, active, scale]);
  return <Animated.View style={{ transform: [{ scale: v }] }}>{children}</Animated.View>;
}

/** "Pop" cada vez que cambia `trigger` (bocadillos, contadores). */
export function Pop({ children, trigger, style }: { children: ReactNode; trigger: unknown; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion) return;
    v.setValue(0.85);
    Animated.spring(v, { toValue: 1, useNativeDriver: ND, speed: 14, bounciness: 14 }).start();
  }, [v, trigger]);
  return <Animated.View style={[style, { transform: [{ scale: v }] }]}>{children}</Animated.View>;
}

const BURST_COLORS = ['#2BB58A', '#FF7A59', '#FFD166', '#4C8DFF', '#B57BFF'];

/** Lluvia de confeti a pantalla completa. Se lanza cambiando `fire`. */
export function Burst({ fire }: { fire: number }) {
  const [pieces, setPieces] = useState<{ id: number; x: number; c: string; r: number; d: number; s: number; v: Animated.Value }[]>([]);
  useEffect(() => {
    if (!fire || reduceMotion) return;
    tap('success');
    const list = Array.from({ length: 44 }, (_, i) => ({
      id: fire * 100 + i,
      x: Math.random(),
      c: BURST_COLORS[i % BURST_COLORS.length],
      r: (Math.random() - 0.5) * 720,
      d: 900 + Math.random() * 900,
      s: 6 + Math.random() * 8,
      v: new Animated.Value(0),
    }));
    setPieces(list);
    Animated.parallel(list.map((p) => Animated.timing(p.v, { toValue: 1, duration: p.d, easing: Easing.in(Easing.quad), useNativeDriver: ND }))).start(() =>
      setPieces([]),
    );
  }, [fire]);
  if (!pieces.length) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top: -20,
            width: p.s,
            height: p.s * 1.6,
            borderRadius: 2,
            backgroundColor: p.c,
            opacity: p.v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (p.x - 0.5) * 60, (p.x - 0.5) * 30] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.r}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
