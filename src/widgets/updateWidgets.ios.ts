/** iOS: guarda la instantánea en el App Group y pide a WidgetKit que redibuje a Owi. */
import { ExtensionStorage } from '@bacons/apple-targets';
import type { WidgetSnapshot } from './snapshot';

const storage = new ExtensionStorage('group.app.towigo');

export async function updateWidgets(s: WidgetSnapshot): Promise<void> {
  try {
    storage.set('owiWidget', JSON.stringify(s));
    ExtensionStorage.reloadWidget('OwiWidget');
  } catch {
    // Sin el widget instalado no pasa nada.
  }
}
