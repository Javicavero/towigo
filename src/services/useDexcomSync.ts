/**
 * Sincronización con Dexcom: al abrir la app y cada 5 minutos.
 * La sincronización es crítica (§4.1): si falla, reintenta con espera creciente
 * y la app lo muestra con claridad (Owi "confundido" y aviso en Hoy).
 */
import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { backendConfigured, consumeDexcomReturn, dexcomReadings } from './backend';

const EVERY_MS = 5 * 60 * 1000;

export function useDexcomSync() {
  const { state, dispatch } = useStore();
  const failures = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = state.dataSource === 'dexcom' && backendConfigured;

  const sync = useCallback(async () => {
    try {
      const r = await dexcomReadings(24);
      failures.current = 0;
      dispatch({
        type: 'dexcom',
        patch: { connected: r.connected, readings: r.readings ?? [], lastSyncAt: new Date().toISOString(), error: null },
      });
      if (!r.connected) dispatch({ type: 'setDataSource', source: 'demo' });
      return true;
    } catch (e) {
      failures.current += 1;
      dispatch({ type: 'dexcom', patch: { error: String((e as Error).message ?? e) } });
      return false;
    }
  }, [dispatch]);

  // Vuelta desde la pantalla de permiso de Dexcom.
  useEffect(() => {
    const r = consumeDexcomReturn();
    if (r === 'connected') {
      dispatch({ type: 'dexcom', patch: { connected: true, error: null } });
      dispatch({ type: 'setDataSource', source: 'dexcom' });
      dispatch({ type: 'setSensor', sensor: 'dexcom' });
    } else if (r) dispatch({ type: 'dexcom', patch: { error: `connect_${r}` } });
  }, [dispatch]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const loop = async () => {
      const ok = await sync();
      if (cancelled) return;
      // Reintento: 30 s, 1 min, 2 min… hasta 5 min.
      const wait = ok ? EVERY_MS : Math.min(EVERY_MS, 30000 * 2 ** (failures.current - 1));
      timer.current = setTimeout(loop, wait);
    };
    loop();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, sync]);

  return { syncNow: sync };
}
