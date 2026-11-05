/**
 * Vista previa de los widgets de Owi (tal como se verán en la pantalla de inicio y de bloqueo).
 * Los widgets reales los dibuja el sistema (WidgetKit en iOS, App Widgets en Android) con la
 * misma instantánea (src/widgets/snapshot.ts).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';
import { OWI_STICKERS } from '../components/OwiSticker';
import { t } from '../i18n';
import { fonts } from '../theme';
import type { WidgetSnapshot } from './snapshot';

const INK = '#1C1C1E';
const SUB = '#5F6670';
const GREEN = '#17785A';

function Small({ s }: { s: WidgetSnapshot }) {
  return (
    <View style={{ width: 150, height: 150, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 12, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Image source={OWI_STICKERS[s.mood]} style={{ width: 72, height: 72 }} resizeMode="contain" />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: '#D9542F' }}>{s.streak}</Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: SUB }}>{t('widget.streakLabel')}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={{ fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, color: INK }}>
        {s.message}
      </Text>
    </View>
  );
}

function Medium({ s }: { s: WidgetSnapshot }) {
  return (
    <View style={{ width: 320, height: 150, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Image source={OWI_STICKERS[s.mood]} style={{ width: 110, height: 110 }} resizeMode="contain" />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: GREEN }}>{s.owiName}</Text>
        <Text numberOfLines={2} style={{ fontFamily: fonts.semibold, fontSize: 15, lineHeight: 19, color: INK }}>
          {s.message}
        </Text>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
          <View>
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: SUB }}>{s.nextLabel}</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: INK }}>{s.nextValue}</Text>
          </View>
          <View>
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: SUB }}>{t('widget.streakLabel')}</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#D9542F' }}>{t('widget.days', { n: s.streak })}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Lock({ s }: { s: WidgetSnapshot }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      {/* circular: racha */}
      <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: '#FFFFFF' }}>{s.streak}</Text>
        <Text style={{ fontFamily: fonts.medium, fontSize: 9, color: '#FFFFFF' }}>{t('widget.streakLabel')}</Text>
      </View>
      {/* rectangular: Owi + lo siguiente */}
      <View style={{ width: 170, height: 62, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 }}>
        <Image source={OWI_STICKERS[s.mood]} style={{ width: 44, height: 44, tintColor: '#FFFFFF' }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: '#FFFFFF' }}>{s.nextLabel}</Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' }}>{s.nextValue}</Text>
        </View>
      </View>
    </View>
  );
}

export default function WidgetPreview({ s }: { s: WidgetSnapshot }) {
  const label = (txt: string) => <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.9)', alignSelf: 'flex-start' }}>{txt}</Text>;
  return (
    <LinearGradient colors={['#2E5E7E', '#3F8F7A', '#7FBF9A']} style={{ borderRadius: 20, padding: 14, gap: 10, alignItems: 'center' }}>
      {label(t('widget.lock'))}
      <Lock s={s} />
      {label(`${t('widget.small')} · ${t('widget.medium')}`)}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        <Small s={s} />
        <Medium s={s} />
      </View>
    </LinearGradient>
  );
}
