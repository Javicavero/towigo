import type { ReactNode } from 'react';
import {
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

type Variant = 'display' | 'title' | 'h2' | 'body' | 'small' | 'label' | 'big';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: 40, lineHeight: 46, fontFamily: fonts.black },
  big: { fontSize: 56, lineHeight: 60, fontFamily: fonts.black },
  title: { fontSize: 26, lineHeight: 32, fontFamily: fonts.black },
  h2: { fontSize: 19, lineHeight: 25, fontFamily: fonts.bold },
  body: { fontSize: 16, lineHeight: 23, fontFamily: fonts.regular },
  small: { fontSize: 13, lineHeight: 18, fontFamily: fonts.semibold },
  label: { fontSize: 15, lineHeight: 20, fontFamily: fonts.bold },
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
  kind?: 'primary' | 'secondary' | 'ghost' | 'coral';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  accessibilityHint?: string;
}) {
  const bg = { primary: colors.greenText, secondary: colors.white, ghost: 'transparent', coral: colors.coralText }[kind];
  const fg = kind === 'primary' || kind === 'coral' ? colors.white : colors.greenText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        kind === 'secondary' && { borderWidth: 2, borderColor: colors.greenText },
        style,
      ]}
    >
      {icon}
      <T v="label" color={fg} center>
        {label}
      </T>
    </Pressable>
  );
}

export function Card({ children, style, tone = 'white' }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'white' | 'green' | 'coral' | 'yellow' }) {
  const bg = { white: colors.white, green: colors.softGreen, coral: colors.softCoral, yellow: colors.softYellow }[tone];
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

/** Opción seleccionable grande (chips de respuesta, selectores). */
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
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && { backgroundColor: colors.greenText, borderColor: colors.greenText },
        pressed && { opacity: 0.85 },
        style,
      ]}
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
  const inner = <View style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: padBottom }]}>{children}</View>;
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

export function ProgressBar({ value, color = colors.owiGreen, height = 12 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.line, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 16, gap: 14 },
  btn: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.xl,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    borderRadius: radius.l,
    padding: 18,
    gap: 10,
    shadowColor: '#1E2A32',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  choice: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, padding: 3 },
  swatchInner: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
});
