/** Web: los avisos del móvil no existen en el navegador. La app instalada usa notifications.ts. */
import type { PlannedNotification } from '../data/notificationPlan';

export const notificationsSupported = false;
export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}
export async function syncNotifications(_list: PlannedNotification[]): Promise<void> {}
export function onNotificationOpen(_open: (url: string) => void): () => void {
  return () => {};
}
