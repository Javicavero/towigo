/**
 * Cabecera de pantalla: título limpio. La frase del asistente (Owi), si la hay, va en una línea discreta
 * con su icono pequeño; al tocarla se abre el chat.
 */
import { Pressable, View } from 'react-native';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import type { PetMood } from '../state/types';
import { colors, fonts, isDark } from '../theme';
import OwiSticker from './OwiSticker';
import { T } from './ui';

export default function ScreenHeader({ title, subtitle, mood, line }: { title: string; subtitle?: string; mood?: PetMood; line?: string }) {
  const { state, d } = useStore();
  const { go } = useNav();
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <T v="display" accessibilityRole="header">
          {title}
        </T>
        {subtitle ? <T color={colors.secondary}>{subtitle}</T> : null}
      </View>
      {line ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${state.pet.name}: ${line}`}
          onPress={() => go('owi')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <OwiSticker mood={mood ?? d.petMood} size={30} />
          </View>
          <T v="small" style={{ flex: 1 }}>
            <T v="small" color={colors.greenText} style={{ fontFamily: fonts.semibold }}>
              {state.pet.name}{'  '}
            </T>
            {line}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
