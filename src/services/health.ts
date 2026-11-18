/**
 * Android y web: de momento sin conexión con la salud del sistema (en Android llegará con Health Connect).
 * En iPhone se usa health.ios.ts (Apple Salud).
 */
import type { HealthSnapshot } from './healthTypes';

export const healthPlatform: 'apple' | 'none' = 'none';
export const healthAvailable = (): boolean => false;
export async function connectHealth(): Promise<boolean> {
  return false;
}
export async function readHealth(_days = 30): Promise<HealthSnapshot | null> {
  return null;
}
