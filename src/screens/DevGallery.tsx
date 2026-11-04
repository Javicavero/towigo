/** Galería interna (abrir con ?galeria): todas las emociones de Owi, sus niveles y variantes de avatar. */
import { ScrollView, Text, View } from 'react-native';
import Scene3D from '../components/Scene3D';
import { defaultAvatar } from '../state/store';
import type { Avatar, PetLevel, PetMood } from '../state/types';

const MOODS: PetMood[] = ['happy', 'attentive', 'caringHigh', 'worriedHigh', 'caringLow', 'worriedLow', 'celebrate', 'sleep', 'confused', 'remind', 'sport', 'missYou'];
const AVATARS: Partial<Avatar>[] = [
  {},
  { skin: 4, hair: 'rizos', hairColor: 0, top: 'camiseta', topColor: 1, bottom: 'corto', bodyType: 'delgada', eyeColor: 0 },
  { skin: 0, hair: 'calvo', facialHair: 'barba', hairColor: 5, glasses: 'cuadradas', top: 'camisa', topColor: 6, bodyType: 'grande', faceShape: 'redonda' },
  { skin: 2, hair: 'melena', hairColor: 3, top: 'camisa', topColor: 3, bottom: 'falda', bottomColor: 1, glasses: 'redondas', height: 'baja', eyeColor: 4 },
  { skin: 3, hair: 'mono', hairColor: 6, top: 'sudadera', topColor: 4, bodyType: 'robusta', faceShape: 'alargada', brows: 'gruesas' },
  { skin: 5, hair: 'rapado', facialHair: 'perilla', top: 'camiseta', topColor: 5, bottomColor: 2, height: 'alta' },
];

export default function DevGallery() {
  // El navegador limita las escenas 3D simultáneas: ?galeria=1 (Owi) y ?galeria=2 (niveles y avatares).
  const page = typeof window !== 'undefined' && window.location.search.includes('galeria=2') ? 2 : 1;
  const cell = { width: 170, alignItems: 'center' as const, margin: 4, backgroundColor: '#FFF8F1', borderRadius: 12 };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8 }}>
      {page === 1 && MOODS.map((m) => (
        <View key={m} style={cell} testID={`pet-${m}`}>
          <Scene3D mode="pet" petMood={m} petLevel={3} height={170} interactive={false} />
          <Text>{m}</Text>
        </View>
      ))}
      {page === 2 && ([1, 2, 3, 4] as PetLevel[]).map((l) => (
        <View key={l} style={cell}>
          <Scene3D mode="pet" petMood="happy" petLevel={l} height={170} interactive={false} />
          <Text>nivel {l}</Text>
        </View>
      ))}
      {page === 2 && AVATARS.map((a, i) => (
        <View key={i} style={cell}>
          <Scene3D mode="avatar" avatar={{ ...defaultAvatar, ...a }} height={230} interactive={false} />
          <Text>avatar {i + 1}</Text>
        </View>
      ))}
      {page === 2 && <View style={{ width: 350, margin: 4, backgroundColor: '#FFF8F1', borderRadius: 12 }}>
        <Scene3D mode="pair" avatar={defaultAvatar} petMood="caringLow" petLevel={2} height={260} interactive={false} />
        <Text>pareja</Text>
      </View>}
    </ScrollView>
  );
}
