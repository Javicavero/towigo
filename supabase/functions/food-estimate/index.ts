// Foto (o descripción) de una comida → estimación APROXIMADA de raciones, carbohidratos y proteína.
// Es orientativa: la app la presenta como estimación editable y la nutricionista puede revisarla.
import { callerId, cors, json } from '../_shared/dexcom.ts';
import { claude, MODEL, OWI_RULES } from '../_shared/claude.ts';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'carbs_g', 'protein_g', 'confidence', 'note'],
  properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'portion'], properties: { name: { type: 'string' }, portion: { type: 'string' } } } },
    carbs_g: { type: 'integer' },
    protein_g: { type: 'integer' },
    confidence: { type: 'string', enum: ['baja', 'media', 'alta'] },
    note: { type: 'string' },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (!(await callerId(req))) return json({ error: 'no_session' }, 401);
    const { imageBase64, mediaType, description } = await req.json();
    if (!imageBase64 && !description) return json({ error: 'bad_request' }, 400);

    const content: unknown[] = [];
    if (imageBase64) content.push({ type: 'image', source: { type: 'base64', media_type: mediaType ?? 'image/jpeg', data: imageBase64 } });
    content.push({
      type: 'text',
      text: `Estima los alimentos visibles${description ? ` (el paciente dice: "${String(description).slice(0, 300)}")` : ''}, el tamaño de cada ración y el total aproximado de carbohidratos y proteína en gramos. En "note", una frase breve recordando que es una estimación. No menciones insulina ni dosis.`,
    });

    const res = await claude().beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: OWI_RULES,
      // deno-lint-ignore no-explicit-any
      messages: [{ role: 'user', content: content as any }],
    });
    if (res.stop_reason === 'refusal') return json({ error: 'refused' }, 422);
    const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    return json(JSON.parse(text));
  } catch (e) {
    console.error('food-estimate', e);
    return json({ error: 'food_unavailable' }, 502);
  }
});
