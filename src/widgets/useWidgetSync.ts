/** Mantiene los widgets al día: cuando cambia lo que muestran, se actualizan. */
import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { buildWidgetSnapshot } from './snapshot';
import { endLiveActivity, startOrUpdateLiveActivity } from '../../modules/owi-live-activity';
import { buildLiveActivity } from './liveActivity';
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

  // Live Activity (iOS): se inicia, actualiza o termina según el momento del día.
  const la = buildLiveActivity(state, d);
  const laKey = JSON.stringify(la);
  const lastLa = useRef('');
  useEffect(() => {
    if (laKey === lastLa.current) return;
    lastLa.current = laKey;
    (la ? startOrUpdateLiveActivity(state.pet.name, la.kind, la.state) : endLiveActivity()).catch(() => {});
  }, [laKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
