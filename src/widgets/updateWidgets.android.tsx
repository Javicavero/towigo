/** Android: guarda la instantánea (para el redibujado en segundo plano) y actualiza el widget. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { OwiAndroidWidget } from './OwiAndroidWidget';
import type { WidgetSnapshot } from './snapshot';

export const SNAPSHOT_KEY = 'towigo.owiWidget';

export async function updateWidgets(s: WidgetSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s));
    await requestWidgetUpdate({ widgetName: 'Owi', renderWidget: () => <OwiAndroidWidget s={s} />, widgetNotFound: () => {} });
  } catch {
    // Sin el widget añadido no pasa nada.
  }
}
