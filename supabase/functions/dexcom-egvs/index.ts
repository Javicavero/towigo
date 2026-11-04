// Paso 3: la app pide las lecturas de glucosa (EGV) de las últimas horas.
import { admin, audit, callerId, cors, DEXCOM_BASE, json, validAccessToken } from '../_shared/dexcom.ts';

const TREND: Record<string, string> = {
  doubleUp: 'upFast',
  singleUp: 'upFast',
  fortyFiveUp: 'up',
  flat: 'flat',
  fortyFiveDown: 'down',
  singleDown: 'downFast',
  doubleDown: 'downFast',
};

// Dexcom espera fechas UTC sin zona: 2026-11-04T10:00:00
const fmt = (d: Date) => d.toISOString().slice(0, 19);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const userId = await callerId(req);
    if (!userId) return json({ error: 'no_session' }, 401);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    if (body.disconnect) {
      await admin().from('dexcom_tokens').delete().eq('user_id', userId);
      await audit(userId, 'dexcom.disconnected');
      return json({ connected: false });
    }
    const token = await validAccessToken(userId);
    if (!token) return json({ connected: false, readings: [] });
    const hours = Math.min(Math.max(Number(body.hours) || 24, 1), 24 * 7);
    const end = new Date();
    const start = new Date(end.getTime() - hours * 3600e3);
    const res = await fetch(`${DEXCOM_BASE()}/v3/users/self/egvs?startDate=${fmt(start)}&endDate=${fmt(end)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error('Dexcom egvs', res.status, await res.text());
      return json({ connected: true, error: `dexcom_${res.status}` }, 502);
    }
    const data = await res.json();
    const readings = (data.records ?? [])
      .filter((r: { value: number | null }) => typeof r.value === 'number')
      .map((r: { systemTime: string; value: number; trend?: string }) => ({
        t: new Date(r.systemTime + (r.systemTime.endsWith('Z') ? '' : 'Z')).getTime(),
        v: r.value,
        trend: TREND[r.trend ?? ''] ?? undefined,
      }))
      .sort((a: { t: number }, b: { t: number }) => a.t - b.t);
    await audit(userId, 'dexcom.read', { count: readings.length });
    return json({ connected: true, readings });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
