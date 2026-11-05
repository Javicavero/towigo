/** Ilustraciones 2D de Owi (las 12 visualizaciones del diseño). Para chat, avisos y miniaturas. */
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import type { PetMood } from '../state/types';

export const OWI_STICKERS: Record<PetMood, number> = {
  happy: require('../../assets/owi/happy.png'),
  attentive: require('../../assets/owi/attentive.png'),
  caringHigh: require('../../assets/owi/caringHigh.png'),
  worriedHigh: require('../../assets/owi/worriedHigh.png'),
  caringLow: require('../../assets/owi/caringLow.png'),
  worriedLow: require('../../assets/owi/worriedLow.png'),
  celebrate: require('../../assets/owi/celebrate.png'),
  sleep: require('../../assets/owi/sleep.png'),
  confused: require('../../assets/owi/confused.png'),
  remind: require('../../assets/owi/remind.png'),
  sport: require('../../assets/owi/sport.png'),
  missYou: require('../../assets/owi/missYou.png'),
};

export default function OwiSticker({ mood, size = 48, style, label }: { mood: PetMood; size?: number; style?: StyleProp<ImageStyle>; label?: string }) {
  return (
    <Image
      source={OWI_STICKERS[mood]}
      style={[{ width: size, height: size }, style]}
      accessibilityLabel={label}
      accessibilityIgnoresInvertColors
      resizeMode="contain"
    />
  );
}
