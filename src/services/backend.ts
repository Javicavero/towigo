/**
 * Conexión con el backend (Supabase, región UE).
 * Se configura con variables de entorno en tiempo de compilación:
 *   EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 * (la "anon key" es pública por diseño; los secretos de Dexcom viven solo en el servidor).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Reading } from '../data/mock';

const URL_ = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const backendConfigured = Boolean(URL_ && KEY);

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!backendConfigured) throw new Error('backend_not_configured');
  if (!client) client = createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}

/** Sesión del usuario. En el prototipo usamos una cuenta anónima; después llegará el registro con email. */
async function ensureSession() {
  const { data } = await sb().auth.getSession();
  if (data.session) return data.session;
  const { data: signed, error } = await sb().auth.signInAnonymously();
  if (error) throw error;
  return signed.session;
}

async function call<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  await ensureSession();
  const { data, error } = await sb().functions.invoke(fn, { body });
  if (error) throw error;
  return data as T;
}

/** URL a la que vuelve Dexcom tras dar permiso: la propia app web. */
export function appReturnUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin + window.location.pathname;
  return 'towigo://dexcom';
}

export async function dexcomStart(): Promise<string> {
  const { url } = await call<{ url: string }>('dexcom-auth-start', { returnTo: appReturnUrl() });
  return url;
}

export async function dexcomReadings(hours = 24): Promise<{ connected: boolean; readings: Reading[] }> {
  return call('dexcom-egvs', { hours });
}

export async function dexcomDisconnect(): Promise<void> {
  await call('dexcom-egvs', { disconnect: true });
}

/** Lee y limpia ?dexcom=connected|denied|error de la URL al volver de Dexcom (web). */
export function consumeDexcomReturn(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const u = new URL(window.location.href);
  const r = u.searchParams.get('dexcom');
  if (!r) return null;
  u.searchParams.delete('dexcom');
  window.history.replaceState(null, '', u.toString());
  return r;
}
