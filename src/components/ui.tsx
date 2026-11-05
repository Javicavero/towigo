import { Children, isValidElement, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, MIN_TOUCH, radius } from '../theme';
import { useStore } from '../state/store';
import { FadeIn, tap, useProgress } from './motion';

type Variant = 'display' | 'title' | 'h2' | 'body' | 'small' | 'label' | 'big';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontFamily: fonts.bold, letterSpacing: -0.6 },
  big: { fontSize: 48, lineHeight: 54, fontFamily: fonts.bold, letterSpacing: -1 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.bold, letterSpacing: -0.5 },
  h2: { fontSize: 19, lineHeight: 25, fontFamily: fonts.semibold, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 23, fontFamily: fonts.regular },
  small: { fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },
  label: { fontSize: 15, lineHeight: 20, fontFamily: fonts.semibold },
};

/** Texto que respeta el tamaño de letra elegido por el usuario (accesibilidad §4.7). */
export function T({
  v = 'body',
  color = colors.ink,
  style,
  children,
  center,
  ...rest
}: {
  v?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  center?: boolean;
  accessibilityRole?: 'header' | 'text';
  numberOfLines?: number;
}) {
  const { state } = useStore();
  const base = VARIANTS[v];
  const k = state.textScale;
  return (
    <Text
      {...rest}
      style={[
        base,
        { color, fontSize: (base.fontSize ?? 16) * k, lineHeight: (base.lineHeight ?? 22) * k },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Botón plano (estilo clínico): relleno para la acción principal, tinte suave para las secundarias. */
export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  style,
  icon,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'coral' | 'blue';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  accessibilityHint?: string;
}) {
  const [bg, fg] = {
    primary: [colors.greenText, colors.white],
    coral: [colors.coralText, colors.white],
    blue: [colors.blue, colors.white],
    secondary: [colors.softGreen, colors.greenText],
    ghost: ['transparent', colors.greenText],
  }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 }, style]}
    >
      {icon}
      <T v="label" color={fg} center>
        {label}
      </T>
    </Pressable>
  );
}

type Tone = 'white' | 'green' | 'coral' | 'yellow' | 'blue' | 'purple';
/** Tonos: tarjeta blanca; los estados (aviso, alerta, logro) llevan un tinte muy suave. */
const TONES: Record<Tone, string> = {
  white: colors.white,
  green: colors.softGreen,
  coral: colors.softCoral,
  yellow: colors.softYellow,
  blue: colors.white,
  purple: colors.white,
};

/** Tarjeta limpia, sin bordes, con sombra muy suave (estilo Apple Salud). */
export function Card({ children, style, tone = 'white' }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: Tone }) {
  return <View style={[styles.card, { backgroundColor: TONES[tone] }, style]}>{children}</View>;
}

/** Opción seleccionable (control segmentado / chip): gris neutro, verde al seleccionar. */
export function Choice({
  label,
  selected,
  onPress,
  style,
  ...rest
}: { label: string; selected?: boolean; onPress: () => void; style?: StyleProp<ViewStyle> } & Omit<PressableProps, 'style'>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.choice, selected && { backgroundColor: colors.greenText }, pressed && { opacity: 0.75 }, style]}
      {...rest}
    >
      <T v="label" color={selected ? colors.white : colors.ink} center>
        {label}
      </T>
    </Pressable>
  );
}

export function Swatch({ color, selected, onPress, label }: { color: string; selected: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.swatch, { borderColor: selected ? colors.ink : 'transparent' }]}
    >
      <View style={[styles.swatchInner, { backgroundColor: color }]} />
    </Pressable>
  );
}

/** Contenedor de pantalla: centrado y con ancho máximo para que en escritorio se vea como un móvil. */
export function Screen({ children, scroll = true, padBottom = 110 }: { children: ReactNode; scroll?: boolean; padBottom?: number }) {
  const insets = useSafeAreaInsets();
  // Entrada suave y escalonada de cada bloque.
  let k = 0;
  const animated = Children.map(children, (c) => (isValidElement(c) ? <FadeIn delay={Math.min(k++, 8) * 55}>{c}</FadeIn> : c));
  const inner = <View style={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: padBottom }]}>{animated}</View>;
  if (!scroll) return <View style={styles.flex}>{inner}</View>;
  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  );
}

export function Row({ children, style, gap = 10 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function ProgressBar({ value, color = colors.owiGreen, height = 8 }: { value: number; color?: string; height?: number }) {
  const v = useProgress(Math.max(0, Math.min(100, value)));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.line, overflow: 'hidden' }}>
      <Animated.View
        style={{ width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), height: '100%', backgroundColor: color, borderRadius: height }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 16, gap: 12 },
  btn: {
    minHeight: 50,
    borderRadius: radius.m,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    borderRadius: radius.l,
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  choice: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.m,
    backgroundColor: '#EEEEF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, padding: 3 },
  swatchInner: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
});
