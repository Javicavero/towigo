/** Mantiene los widgets al día: cuando cambia lo que muestran, se actualizan. */
import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { buildWidgetSnapshot } from './snapshot';
import { updateWidgets } from './updateWidgets';

export function useWidgetSync() {
  const { state, d } = useStore();
  const last = useRef('');
  const snap = buildWidgetSnapshot(state, d);
  const key = JSON.stringify({ ...snap, updatedAt: '' });
  useEffect(() => {
    if (key === last.current) return;
    last.current = key;
    updateWidgets(snap);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
