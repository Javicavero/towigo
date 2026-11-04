// Paso 2: Dexcom vuelve aquí con un código; lo cambiamos por tokens y volvemos a la app.
// Esta función se llama desde el navegador de Dexcom, sin sesión: hay que desplegarla con --no-verify-jwt.
import { admin, audit, CALLBACK_URL, saveTokens, tokenRequest } from '../_shared/dexcom.ts';

const back = (returnTo: string, result: string) => {
  const u = new URL(returnTo);
  u.searchParams.set('dexcom', result);
  return Response.redirect(u.toString(), 302);
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nonce = url.searchParams.get('state');
  if (!nonce) return new Response('Falta el estado', { status: 400 });
  const db = admin();
  const { data: st } = await db.from('oauth_states').select('*').eq('nonce', nonce).maybeSingle();
  if (!st) return new Response('Enlace caducado. Vuelve a la app e inténtalo de nuevo.', { status: 400 });
  await db.from('oauth_states').delete().eq('nonce', nonce);
  if (Date.now() - new Date(st.created_at).getTime() > 15 * 60e3) return back(st.return_to, 'expired');
  if (!code) return back(st.return_to, 'denied');
  try {
    const tokens = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: CALLBACK_URL() });
    await saveTokens(st.user_id, tokens);
    await audit(st.user_id, 'dexcom.connected');
    return back(st.return_to, 'connected');
  } catch (e) {
    console.error(e);
    await audit(st.user_id, 'dexcom.connect_error');
    return back(st.return_to, 'error');
  }
});
