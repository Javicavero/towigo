/**
 * Guardado del estado en el dispositivo.
 * - Web: localStorage (lectura inmediata).
 * - iPhone y Android: AsyncStorage (lectura asíncrona al arrancar).
 * Pendiente (auditoría C7): cifrar estos datos y sincronizarlos con el servidor.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY = 'towigo.prototype.v1';
const web = Platform.OS === 'web';

/** Web: devuelve lo guardado (o null). Móvil: undefined, porque hay que leerlo con loadAsync. */
export function loadSync<T>(): T | null | undefined {
  if (!web) return undefined;
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function loadAsync<T>(): Promise<T | null> {
  if (web) return loadSync<T>() ?? null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(value: unknown) {
  try {
    const raw = JSON.stringify(value);
    if (web) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, raw);
    } else AsyncStorage.setItem(KEY, raw).catch(() => {});
  } catch {
    // Navegación privada o almacenamiento bloqueado: la app sigue funcionando sin guardar.
  }
}

export function clear() {
  try {
    if (web) {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
    } else AsyncStorage.removeItem(KEY).catch(() => {});
  } catch {
    /* sin almacenamiento */
  }
}
