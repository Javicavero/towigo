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
import { Bouncy, FadeIn, tap, useProgress } from './motion';

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

/** Botón con relieve: se hunde al pulsarlo (sensación de juego, accesible y grande). */
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
  const palette = {
    primary: [colors.greenText, colors.greenDark, colors.white],
    coral: [colors.coralText, colors.coralShadow, colors.white],
    blue: [colors.blue, colors.blueDark, colors.white],
    secondary: [colors.white, colors.borderStrong, colors.greenText],
    ghost: ['transparent', 'transparent', colors.greenText],
  }[kind];
  const [bg, edge, fg] = palette;
  const depth = kind === 'ghost' ? 0 : 5;
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
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      {({ pressed }) => (
        <View style={{ paddingTop: pressed ? depth : 0 }}>
          <View
            style={[
              styles.btn,
              {
                backgroundColor: bg,
                borderBottomWidth: pressed ? 0 : depth,
                borderBottomColor: edge,
                marginBottom: 0,
              },
              kind === 'secondary' && { borderWidth: 2, borderColor: colors.borderStrong, borderBottomWidth: pressed ? 2 : depth },
            ]}
          >
            {icon}
            <T v="label" color={fg} center style={{ textTransform: kind === 'ghost' ? 'none' : 'uppercase', letterSpacing: kind === 'ghost' ? 0 : 0.6 }}>
              {label}
            </T>
          </View>
        </View>
      )}
    </Pressable>
  );
}

type Tone = 'white' | 'green' | 'coral' | 'yellow' | 'blue' | 'purple';
const TONES: Record<Tone, [string, string]> = {
  white: [colors.white, colors.border],
  green: [colors.softGreen, '#BFE6D6'],
  coral: [colors.softCoral, '#F8C9BA'],
  yellow: [colors.softYellow, '#F3DE9C'],
  blue: [colors.softBlue, '#C3D6FA'],
  purple: [colors.softPurple, '#D7CBFB'],
};

/** Tarjeta con borde inferior marcado (aspecto de "pieza" que se puede tocar). */
export function Card({ children, style, tone = 'white' }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: Tone }) {
  const [bg, border] = TONES[tone];
  return <View style={[styles.card, { backgroundColor: bg, borderColor: border }, style]}>{children}</View>;
}

/** Opción seleccionable grande (chips de respuesta, selectores), con relieve y rebote. */
export function Choice({
  label,
  selected,
  onPress,
  style,
  ...rest
}: { label: string; selected?: boolean; onPress: () => void; style?: StyleProp<ViewStyle> } & Omit<PressableProps, 'style'>) {
  return (
    <Bouncy
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.choice,
        selected && { backgroundColor: colors.softGreen, borderColor: colors.greenText, borderBottomColor: colors.greenDark },
        style,
      ]}
      {...rest}
    >
      <T v="label" color={selected ? colors.greenDark : colors.ink} center>
        {label}
      </T>
    </Bouncy>
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
  // Cada bloque entra escalonado (sensación de app viva).
  let k = 0;
  const animated = Children.map(children, (c) => (isValidElement(c) ? <FadeIn delay={Math.min(k++, 8) * 55}>{c}</FadeIn> : c));
  const inner = <View style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: padBottom }]}>{animated}</View>;
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

export function ProgressBar({ value, color = colors.owiGreen, height = 14 }: { value: number; color?: string; height?: number }) {
  const v = useProgress(Math.max(0, Math.min(100, value)));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.line, overflow: 'hidden' }}>
      <Animated.View
        style={{ width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), height: '100%', backgroundColor: color, borderRadius: height }}
      >
        {/* brillo superior, como una pieza de juego */}
        <View style={{ position: 'absolute', left: 6, right: 6, top: 3, height: Math.max(2, height / 4), borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.cream },
  inner: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 16, gap: 14 },
  btn: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.m,
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
    borderWidth: 2,
    borderBottomWidth: 5,
  },
  choice: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.m,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, padding: 3 },
  swatchInner: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
});
