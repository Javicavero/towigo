/** Mantiene los avisos del móvil al día con el plan: se reprograman cuando cambia algo que les afecta. */
import { useEffect } from 'react';
import { planNotifications } from '../data/notificationPlan';
import { useStore } from '../state/store';
import { notificationsSupported, syncNotifications } from './notifications';

export function useNotificationSync() {
  const { state } = useStore();
  const list = planNotifications(state);
  const key = JSON.stringify(list);
  useEffect(() => {
    if (!notificationsSupported) return;
    syncNotifications(list).catch(() => {});
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
