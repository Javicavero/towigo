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

/** Título de sección (estilo iOS agrupado). */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 }}>
      <T v="h2" accessibilityRole="header">
        {children}
      </T>
      {action}
    </View>
  );
}

/** Grupo de filas dentro de una tarjeta blanca, separadas por líneas finas. */
export function ListGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.card, { padding: 0, gap: 0 }]}>
      {items.map((c, i) => (
        <View key={i} style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, marginLeft: 60 } : undefined}>
          <View style={i > 0 ? { marginLeft: -60 } : undefined}>{c}</View>
        </View>
      ))}
    </View>
  );
}

/** Fila de lista: icono, título, subtítulo y a la derecha una marca de hecho o una flecha. */
export function ListRow({
  icon,
  tint,
  title,
  subtitle,
  done,
  right,
  onPress,
}: {
  icon: ReactNode;
  tint?: string;
  title: string;
  subtitle?: string;
  done?: boolean;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}${done ? '. Hecho' : ''}`}
      disabled={!onPress}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 60, backgroundColor: pressed ? '#F5F5F7' : 'transparent' })}
    >
      <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: tint ?? 'transparent', alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <T v="label" color={done ? colors.secondary : colors.ink} style={done ? { textDecorationLine: 'line-through' } : undefined}>
          {title}
        </T>
        {subtitle ? (
          <T v="small" color={colors.secondary}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right ??
        (done ? (
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.greenText, alignItems: 'center', justifyContent: 'center' }}>
            <T v="small" color={colors.white}>
              ✓
            </T>
          </View>
        ) : onPress ? (
          <T v="h2" color={colors.borderStrong}>
            ›
          </T>
        ) : null)}
    </Pressable>
  );
}

/** Control segmentado (como en iOS). */
export function Segmented<K extends string>({ options, value, onChange }: { options: { id: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: '#E4E4E9', borderRadius: 10, padding: 2 }}>
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            onPress={() => {
              tap();
              onChange(o.id);
            }}
            style={{ flex: 1, minHeight: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? colors.white : 'transparent', shadowColor: '#000', shadowOpacity: sel ? 0.08 : 0, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }}
          >
            <T v="label" color={sel ? colors.ink : colors.secondary}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Sección desplegable (ajustes): solo se abre lo que el usuario quiere ver. */
export function Disclosure({ icon, tint, title, subtitle, open, onToggle, children }: { icon: ReactNode; tint?: string; title: string; subtitle?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <View style={[styles.card, { padding: 0, gap: 0, overflow: 'hidden' }]}>
      <ListRow icon={icon} tint={tint} title={title} subtitle={subtitle} onPress={onToggle} right={<T v="h2" color={colors.secondary}>{open ? '⌃' : '⌄'}</T>} />
      {open && <View style={{ paddingHorizontal: 14, paddingBottom: 16, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingTop: 12 }}>{children}</View>}
    </View>
  );
}
