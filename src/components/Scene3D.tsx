/** Versión nativa provisional (el prototipo se publica en web). */
import { Text, View } from 'react-native';
import type { SceneProps } from './three/Scene.types';

export default function Scene3D({ height = 260, accessibilityLabel, petMood }: SceneProps) {
  const face = petMood === 'celebrate' ? '🥳' : petMood === 'sleep' ? '😴' : petMood?.startsWith('worried') ? '🤗' : '🦔';
  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ height, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: height * 0.35 }}>{face}</Text>
    </View>
  );
}
