/** Tu avatar como foto de perfil (círculo), estilo apps profesionales. */
import { Pressable, View } from 'react-native';
import type { Avatar } from '../state/types';
import { colors } from '../theme';
import AvatarFace from './AvatarFace';

export default function AvatarBadge({ avatar, size = 44, onPress, label }: { avatar: Avatar; size?: number; onPress?: () => void; label?: string }) {
  const inner = (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: colors.softGreen, alignItems: 'center' }}>
      {/* Encuadre de busto: mostramos la cara centrada dentro del círculo */}
      <View style={{ marginTop: size * 0.02 }}>
        <AvatarFace avatar={avatar} size={size * 1.1} expression="smile" />
      </View>
    </View>
  );
  if (!onPress) return <View accessibilityRole="image" accessibilityLabel={label}>{inner}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {inner}
    </Pressable>
  );
}
