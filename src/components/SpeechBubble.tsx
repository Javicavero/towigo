import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors, radius } from '../theme';
import { Row, T } from './ui';

/** Bocadillo de Owi. La flecha apunta hacia quien habla. Región "viva" para lectores de pantalla. */
export default function SpeechBubble({
  text,
  name,
  icon,
  children,
  arrow = 'center',
}: {
  text: string;
  name?: string;
  icon?: string;
  children?: ReactNode;
  arrow?: 'left' | 'center' | 'right';
}) {
  const border = icon ? colors.achievement : colors.border;
  return (
    <View style={{ alignItems: arrow === 'center' ? 'center' : arrow === 'right' ? 'flex-end' : 'flex-start' }}>
      <View style={{ marginHorizontal: 48, width: 22, height: 14, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ width: 18, height: 18, backgroundColor: colors.white, borderLeftWidth: 2, borderTopWidth: 2, borderColor: border, transform: [{ rotate: '45deg' }], marginBottom: -10 }} />
      </View>
      <View
        accessibilityLiveRegion="polite"
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.l,
          paddingVertical: 14,
          paddingHorizontal: 18,
          width: '100%',
          gap: 4,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor: border,
        }}
      >
        {name ? (
          <T v="small" color={colors.purple} style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {name}
          </T>
        ) : null}
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          {icon ? <T v="title">{icon}</T> : null}
          <T v="h2" style={{ flex: 1 }}>
            {text}
          </T>
        </Row>
        {children}
      </View>
    </View>
  );
}
