// Paso 1: la app pide la URL de Dexcom para que el usuario dé permiso.
import { admin, allowedReturn, audit, callerId, CALLBACK_URL, cors, DEXCOM_BASE, env, json } from '../_shared/dexcom.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const userId = await callerId(req);
    if (!userId) return json({ error: 'no_session' }, 401);
    const { returnTo } = await req.json();
    if (typeof returnTo !== 'string' || !allowedReturn(returnTo)) return json({ error: 'return_not_allowed' }, 400);
    const nonce = crypto.randomUUID();
    const { error } = await admin().from('oauth_states').insert({ nonce, user_id: userId, return_to: returnTo });
    if (error) throw error;
    await audit(userId, 'dexcom.auth_start');
    const url = new URL(`${DEXCOM_BASE()}/v2/oauth2/login`);
    url.searchParams.set('client_id', env('DEXCOM_CLIENT_ID'));
    url.searchParams.set('redirect_uri', CALLBACK_URL());
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'offline_access');
    url.searchParams.set('state', nonce);
    return json({ url: url.toString() });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
