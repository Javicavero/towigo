/**
 * Versión nativa (iOS/Android) provisional de Owi.
 * El prototipo se publica en web; en la app nativa se usará el modelo glTF
 * definitivo con @react-three/fiber/native + expo-gl.
 */
import { Text, View } from 'react-native';
import type { OwiProps } from './Owi3D.types';
import { SKIN_TONES, HOODIE_COLORS } from '../data/avatarOptions';

export default function Owi3D({ avatar, mood, height = 260, accessibilityLabel }: OwiProps) {
  const face = mood === 'celebrate' || mood === 'sport' ? '😄' : mood === 'sleep' ? '😴' : mood === 'confused' ? '🤔' : mood.startsWith('worried') || mood.startsWith('caring') ? '🤗' : '🙂';
  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ height, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: height * 0.45, height: height * 0.45, borderRadius: height, backgroundColor: SKIN_TONES[avatar.skin], borderWidth: 8, borderColor: HOODIE_COLORS[avatar.hoodie], alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: height * 0.2 }}>{face}</Text>
      </View>
    </View>
  );
}
