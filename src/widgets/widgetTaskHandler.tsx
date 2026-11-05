/** Android: el sistema pide dibujar el widget (al añadirlo, al actualizar o al cambiar de tamaño). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { DEFAULT_SNAPSHOT, OwiAndroidWidget } from './OwiAndroidWidget';
import type { WidgetSnapshot } from './snapshot';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction === 'WIDGET_DELETED' || props.widgetAction === 'WIDGET_CLICK') return;
  let s: WidgetSnapshot = DEFAULT_SNAPSHOT;
  try {
    const raw = await AsyncStorage.getItem('towigo.owiWidget');
    if (raw) s = JSON.parse(raw);
  } catch {
    /* usamos el estado por defecto */
  }
  props.renderWidget(<OwiAndroidWidget s={s} />);
}
