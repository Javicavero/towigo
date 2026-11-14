/** Avisos locales en iPhone y Android (expo-notifications). No necesitan servidor ni conexión. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PlannedNotification } from '../data/notificationPlan';

export const notificationsSupported = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Pide permiso al sistema. Devuelve true si el usuario lo concede. */
export async function requestNotificationPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Sustituye todos los avisos programados por los del plan actual. */
export async function syncNotifications(list: PlannedNotification[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!list.length) return;
  // eslint-disable-next-line import/namespace -- AndroidImportance se reexporta con export *; el plugin no lo ve
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('plan', { name: 'Avisos de tu plan', importance: Notifications.AndroidImportance.DEFAULT });
  for (const n of list) {
    const base = { channelId: 'plan', hour: n.hour, minute: n.minute };
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body, data: { url: n.link } },
      // expo-notifications usa 1 = domingo … 7 = sábado; la app usa 0 = lunes … 6 = domingo.
      trigger: n.weekday === undefined ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...base } : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: ((n.weekday + 1) % 7) + 1, ...base },
    });
  }
}

/** Al tocar un aviso se abre la sección correspondiente. */
export function onNotificationOpen(open: (url: string) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  });
  return () => sub.remove();
}
