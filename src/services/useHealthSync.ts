/**
 * Sincroniza con Apple Salud al abrir la app y cada vez que vuelve a primer plano (como mucho cada 5 minutos).
 * Solo si la persona la ha conectado en Yo → Apple Salud.
 */
import { useCallback, useEffect, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { useStore } from '../state/store';
import { readHealth } from './health';

export function useHealthSync() {
  const { state, dispatch } = useStore();
  const connected = !!state.health?.connected;
  const busy = useRef(false);
  const last = useRef(0);

  const sync = useCallback(async () => {
    if (!connected || busy.current || Date.now() - last.current < 5 * 60e3) return;
    busy.current = true;
    try {
      const snapshot = await readHealth(30);
      if (snapshot) {
        last.current = Date.now();
        dispatch({ type: 'healthSync', snapshot, at: new Date().toISOString() });
      }
    } catch {
      /* sin permiso o Salud no disponible: se reintenta la próxima vez */
    } finally {
      busy.current = false;
    }
  }, [connected, dispatch]);

  // Al cambiar de perfil o de escenario se cargan los datos de ejemplo: se vuelve a leer Salud enseguida.
  const dataKey = `${state.profile}|${state.scenario}`;
  const prevKey = useRef(dataKey);
  useEffect(() => {
    if (prevKey.current === dataKey) return;
    prevKey.current = dataKey;
    last.current = 0;
    void sync();
  }, [dataKey, sync]);

  useEffect(() => {
    void sync();
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') void sync();
    });
    return () => sub.remove();
  }, [sync]);
}
