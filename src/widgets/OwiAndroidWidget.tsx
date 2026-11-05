/**
 * Widget de Android (react-native-android-widget): Owi, su mensaje, lo siguiente y la racha.
 * Se dibuja con la misma instantánea que el widget de iOS.
 */
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { OWI_STICKERS } from '../components/OwiSticker';
import type { WidgetSnapshot } from './snapshot';

export const DEFAULT_SNAPSHOT: WidgetSnapshot = {
  v: 1,
  owiName: 'Owi',
  mood: 'happy',
  message: '¡Vamos juntos!',
  nextLabel: 'Racha',
  nextValue: '0 días',
  streak: 0,
  deepLink: 'towigo://hoy',
  updatedAt: '',
};

export function OwiAndroidWidget({ s }: { s: WidgetSnapshot }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: s.deepLink }}
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', flexGap: 10 }}
    >
      <ImageWidget image={OWI_STICKERS[s.mood] as never} imageWidth={96} imageHeight={96} />
      <FlexWidget style={{ flex: 1, flexDirection: 'column', flexGap: 4 }}>
        <TextWidget text={s.owiName} style={{ fontSize: 12, color: '#17785A', fontWeight: '600' }} />
        <TextWidget text={s.message} maxLines={2} truncate="END" style={{ fontSize: 15, color: '#1C1C1E', fontWeight: '600' }} />
        <FlexWidget style={{ flexDirection: 'row', flexGap: 14 }}>
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget text={s.nextLabel} style={{ fontSize: 11, color: '#5F6670' }} />
            <TextWidget text={s.nextValue} style={{ fontSize: 15, color: '#1C1C1E', fontWeight: '700' }} />
          </FlexWidget>
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget text="Racha" style={{ fontSize: 11, color: '#5F6670' }} />
            <TextWidget text={`${s.streak} días`} style={{ fontSize: 15, color: '#D9542F', fontWeight: '700' }} />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
