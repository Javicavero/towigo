// Chat con Owi: preguntas abiertas que el "cerebro" local de la app no sabe responder.
// La app solo envía un contexto mínimo (perfil y métricas agregadas), nunca datos identificativos.
import { callerId, cors, json } from '../_shared/dexcom.ts';
import { claude, MODEL, OWI_RULES } from '../_shared/claude.ts';

type Turn = { from: 'me' | 'owi'; text: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (!(await callerId(req))) return json({ error: 'no_session' }, 401);
    const { message, context, history } = (await req.json()) as { message: string; context: Record<string, unknown>; history: Turn[] };
    if (!message || message.length > 2000) return json({ error: 'bad_request' }, 400);

    const turns = (history ?? []).slice(-10).map((t) => ({ role: t.from === 'me' ? ('user' as const) : ('assistant' as const), content: t.text }));
    // La conversación debe empezar por el usuario.
    while (turns.length && turns[0].role === 'assistant') turns.shift();

    const res = await claude().beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: OWI_RULES, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `Datos agregados del paciente (para responder con sus datos): ${JSON.stringify(context ?? {})}` },
      ],
      messages: [...turns, { role: 'user', content: message }],
    });

    if (res.stop_reason === 'refusal') return json({ reply: 'Eso prefiero que lo hables con tu equipo. Si quieres, les paso tu pregunta.' });
    const reply = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
    return json({ reply: reply || 'Aquí estoy contigo.' });
  } catch (e) {
    console.error('owi-chat', e);
    return json({ error: 'owi_unavailable' }, 502);
  }
});
