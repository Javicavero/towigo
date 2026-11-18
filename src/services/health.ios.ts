/**
 * iPhone: Apple Salud (HealthKit) con @kingstinct/react-native-healthkit.
 * Solo lectura. HealthKit exige pedir permiso antes de cada lectura (si no, la app se cierra), por eso
 * readHealth vuelve a pedirlo: si ya está concedido, no muestra nada.
 * Nota: Dexcom envía la glucosa a Salud con 3 horas de retraso.
 */
import {
  isHealthDataAvailable,
  queryCategorySamples,
  queryQuantitySamples,
  queryStatisticsCollectionForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import type { HealthSnapshot } from './healthTypes';
import { toSnapshot } from './healthTransform';

const READ = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierLeanBodyMass',
  'HKQuantityTypeIdentifierBloodGlucose',
  'HKQuantityTypeIdentifierInsulinDelivery',
  'HKQuantityTypeIdentifierDietaryCarbohydrates',
  'HKQuantityTypeIdentifierDietaryProtein',
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

export const healthPlatform: 'apple' | 'none' = 'apple';

export function healthAvailable(): boolean {
  try {
    return isHealthDataAvailable();
  } catch {
    return false;
  }
}

/** Muestra la hoja de permisos de Salud. Devuelve true si se ha podido pedir (Apple no dice qué se concedió). */
export async function connectHealth(): Promise<boolean> {
  if (!healthAvailable()) return false;
  return requestAuthorization({ toRead: READ });
}

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function readHealth(days = 30): Promise<HealthSnapshot | null> {
  if (!healthAvailable()) return null;
  await requestAuthorization({ toRead: READ });
  const now = new Date();
  const from = startOfDay(now.getTime() - (days - 1) * 864e5);
  const fromWeights = startOfDay(now.getTime() - 365 * 864e5);
  const range = { date: { startDate: from, endDate: now } };
  const rangeWeights = { date: { startDate: fromWeights, endDate: now } };
  const src = (s: { sourceRevision?: { source?: { name?: string } } }) => s.sourceRevision?.source?.name ?? '';

  const [steps, sleep, mass, fat, lean, glucose, insulin, carbs, protein] = await Promise.all([
    queryStatisticsCollectionForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], from, { day: 1 }, { filter: range, unit: 'count' }),
    queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { limit: 0, filter: range }),
    queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', { limit: 0, filter: rangeWeights, unit: 'kg', ascending: true }),
    queryQuantitySamples('HKQuantityTypeIdentifierBodyFatPercentage', { limit: 0, filter: rangeWeights, unit: '%', ascending: true }),
    queryQuantitySamples('HKQuantityTypeIdentifierLeanBodyMass', { limit: 0, filter: rangeWeights, unit: 'kg', ascending: true }),
    queryQuantitySamples('HKQuantityTypeIdentifierBloodGlucose', { limit: 0, filter: range, unit: 'mg/dL', ascending: true }),
    queryQuantitySamples('HKQuantityTypeIdentifierInsulinDelivery', { limit: 0, filter: range, unit: 'IU', ascending: true }),
    queryQuantitySamples('HKQuantityTypeIdentifierDietaryCarbohydrates', { limit: 0, filter: range, unit: 'g', ascending: true }),
    queryQuantitySamples('HKQuantityTypeIdentifierDietaryProtein', { limit: 0, filter: range, unit: 'g', ascending: true }),
  ]);

  const q = (xs: readonly { startDate: Date; endDate: Date; quantity: number; sourceRevision?: { source?: { name?: string } } }[]) =>
    xs.map((x) => ({ startDate: x.startDate, endDate: x.endDate, quantity: x.quantity, source: src(x) }));
  return toSnapshot({
    stepsDaily: steps.filter((s) => s.startDate && s.sumQuantity).map((s) => ({ start: s.startDate as Date, sum: s.sumQuantity!.quantity })),
    sleep: sleep.map((s) => ({ start: s.startDate, end: s.endDate, value: Number(s.value) })),
    mass: q(mass),
    fat: q(fat),
    lean: q(lean),
    glucose: glucose.map((x) => ({ startDate: x.startDate, quantity: x.quantity, source: src(x), meal: Number((x.metadata as Record<string, unknown> | undefined)?.HKBloodGlucoseMealTime ?? 0) })),
    insulin: insulin.map((x) => ({ startDate: x.startDate, quantity: x.quantity, reason: Number((x.metadata as Record<string, unknown> | undefined)?.HKInsulinDeliveryReason ?? 0) })),
    carbs: q(carbs),
    protein: q(protein),
  });
}
