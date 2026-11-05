/**
 * Cabecera de pantalla con Owi siempre presente (animado, pequeño) y una frase contextual.
 * Al tocar a Owi se abre el chat.
 */
import { Pressable, View } from 'react-native';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import type { PetMood } from '../state/types';
import { colors, fonts } from '../theme';
import OwiSprite from './OwiSprite';
import { Row, T } from './ui';

export default function ScreenHeader({ title, subtitle, mood, line }: { title: string; subtitle?: string; mood?: PetMood; line?: string }) {
  const { state, d } = useStore();
  const { go } = useNav();
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="display" accessibilityRole="header">
            {title}
          </T>
          {subtitle ? <T color={colors.secondary}>{subtitle}</T> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${state.pet.name}. ${line ?? ''}`} onPress={() => go('owi')} style={{ marginBottom: -10, marginTop: -8 }}>
          <OwiSprite mood={mood ?? d.petMood} size={96} />
        </Pressable>
      </Row>
      {line ? (
        <View style={{ backgroundColor: colors.softGreen, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8 }}>
          <T v="small" color={colors.greenText} style={{ fontFamily: fonts.semibold }}>
            {state.pet.name}
          </T>
          <T v="small" style={{ flex: 1 }}>
            {line}
          </T>
        </View>
      ) : null}
    </View>
  );
}
