// Utilidades compartidas de las funciones de Dexcom (Deno, Supabase Edge Functions).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Variables de entorno (Supabase → Edge Functions → Secrets):
 *  DEXCOM_CLIENT_ID, DEXCOM_CLIENT_SECRET  → de developer.dexcom.com
 *  DEXCOM_BASE_URL  → https://sandbox-api.dexcom.com (pruebas), https://api.dexcom.eu (Europa) o https://api.dexcom.com (EE. UU.)
 *  APP_URLS         → URLs de la app permitidas para volver tras conectar, separadas por comas
 *  (SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY las pone Supabase solo)
 */
export const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Falta la variable ${k}`);
  return v;
};

export const DEXCOM_BASE = () => env('DEXCOM_BASE_URL').replace(/\/$/, '');
export const CALLBACK_URL = () => `${env('SUPABASE_URL')}/functions/v1/dexcom-callback`;

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const admin = (): SupabaseClient => createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

/** Usuario que llama (sesión de Supabase en la cabecera Authorization). */
export async function callerId(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: auth } } });
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export function allowedReturn(url: string): boolean {
  const allowed = env('APP_URLS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.some((a) => url === a || url.startsWith(a.endsWith('/') ? a : a + '/') || url.startsWith(a + '?'));
}

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };

export async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const body = new URLSearchParams({ client_id: env('DEXCOM_CLIENT_ID'), client_secret: env('DEXCOM_CLIENT_SECRET'), ...params });
  const res = await fetch(`${DEXCOM_BASE()}/v2/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Dexcom token ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function saveTokens(userId: string, t: TokenResponse) {
  const { error } = await admin()
    .from('dexcom_tokens')
    .upsert({
      user_id: userId,
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(Date.now() + (t.expires_in - 60) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

/** Devuelve un access token válido, renovándolo si ha caducado. null si el usuario no ha conectado Dexcom. */
export async function validAccessToken(userId: string): Promise<string | null> {
  const { data } = await admin().from('dexcom_tokens').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() > Date.now()) return data.access_token;
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: data.refresh_token });
  await saveTokens(userId, t);
  return t.access_token;
}

export async function audit(userId: string | null, action: string, detail?: unknown) {
  await admin().from('audit_log').insert({ user_id: userId, action, detail: detail ?? null });
}
