import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors, radius } from '../theme';
import { Row, T } from './ui';

/** Bocadillo de Owi. Se anuncia a los lectores de pantalla como región "viva". */
export default function SpeechBubble({ text, name, icon, children }: { text: string; name?: string; icon?: string; children?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.white }} />
      <View
        accessibilityLiveRegion="polite"
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.l,
          paddingVertical: 16,
          paddingHorizontal: 20,
          width: '100%',
          gap: 4,
          borderWidth: icon ? 2 : 0,
          borderColor: colors.achievement,
        }}
      >
        {name ? (
          <T v="small" color={colors.greenText}>
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
