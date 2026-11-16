import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors, radius } from '../theme';
import type { PetMood } from '../state/types';
import OwiSticker from './OwiSticker';
import { Row, T } from './ui';

/** Bocadillo de Owi. La flecha apunta hacia quien habla. Región "viva" para lectores de pantalla. */
export default function SpeechBubble({
  text,
  name,
  icon,
  children,
  arrow = 'center',
  mood,
}: {
  text: string;
  name?: string;
  icon?: ReactNode;
  children?: ReactNode;
  arrow?: 'left' | 'center' | 'right';
  /** Emoción de Owi: muestra su ilustración junto al nombre. */
  mood?: PetMood;
}) {
  // Burbuja sobre la superficie de la tarjeta; los avisos llevan el tinte de acento.
  const bg = icon ? colors.softGreen : colors.white;
  return (
    <View style={{ alignItems: arrow === 'center' ? 'center' : arrow === 'right' ? 'flex-end' : 'flex-start' }}>
      <View style={{ marginHorizontal: 48, width: 22, height: 14, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ width: 18, height: 18, backgroundColor: bg, transform: [{ rotate: '45deg' }], marginBottom: -10 }} />
      </View>
      <View
        accessibilityLiveRegion="polite"
        style={{
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.l,
          paddingVertical: 14,
          paddingHorizontal: 18,
          width: '100%',
          gap: 4,
        }}
      >
        {name ? (
          <Row gap={6}>
            {mood && <OwiSticker mood={mood} size={26} />}
            <T v="small" color={colors.greenText}>
              {name}
            </T>
          </Row>
        ) : null}
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          {icon ?? null}
          <T v="h2" style={{ flex: 1 }}>
            {text}
          </T>
        </Row>
        {children}
      </View>
    </View>
  );
}
