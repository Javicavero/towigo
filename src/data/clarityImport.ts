/**
 * Importa la exportación CSV de Dexcom Clarity (Clarity → Exportar). Acepta cabeceras en inglés o español,
 * separador "," o ";", valores en mg/dL o mmol/L, y lecturas "Low/High" ("Bajo/Alto").
 * Lee solo glucosa del sensor, insulina y carbohidratos: ignora nombre, fecha de nacimiento y demás datos personales.
 * Los datos importados se guardan solo en este dispositivo. Función pura: se prueba en tests/clarityImport.test.ts.
 */
export type Imported = {
  glucose: { at: number; v: number }[];
  insulin: { at: number; units: number; kind: 'rapid' | 'basal' }[];
  carbs: { at: number; g: number }[];
  from: number | null;
  to: number | null;
  skipped: number;
};

function splitRow(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (ch === sep && !q) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const TS = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;
/** Clarity guarda la hora local del dispositivo, sin zona horaria. */
function parseTs(s: string): number | null {
  const m = TS.exec(s);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)).getTime();
}
const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export function parseClarityCsv(text: string): Imported {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const empty: Imported = { glucose: [], insulin: [], carbs: [], from: null, to: null, skipped: 0 };
  const hi = lines.findIndex((l) => /mg\/dl|mmol\/l/i.test(l));
  if (hi < 0) return empty;
  const sep = [',', ';', '\t'].map((c) => [c, lines[hi].split(c).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const head = splitRow(lines[hi], sep).map((h) => h.toLowerCase());
  const col = (re: RegExp, not?: RegExp) => head.findIndex((h) => re.test(h) && !(not && not.test(h)));
  const cTs = col(/timestamp|marca|fecha|hora|time/, /transmi/);
  const cType = col(/event type|tipo de evento|^tipo/, /sub/);
  const cSub = col(/subtype|subtipo/);
  const cGlu = col(/(glucose|glucosa).*(mg\/dl|mmol\/l)/, /rate|velocidad|cambio/);
  const mmol = cGlu >= 0 && /mmol/.test(head[cGlu]);
  const cIns = col(/insulin|insulina/);
  const cCarb = col(/carb/);
  if (cTs < 0 || cGlu < 0) return empty;

  const out: Imported = { ...empty, glucose: [], insulin: [], carbs: [] };
  const seen = new Set<number>();
  for (const line of lines.slice(hi + 1)) {
    const r = splitRow(line, sep);
    const at = parseTs(r[cTs] ?? '');
    if (at === null) continue; // filas de datos personales y de configuración: sin fecha, se ignoran
    const type = (cType >= 0 ? r[cType] : '').toLowerCase();
    const sub = (cSub >= 0 ? r[cSub] : '').toLowerCase();
    if (/calib/.test(type)) continue;
    if (/insulin|insulina/.test(type) && cIns >= 0) {
      const u = num(r[cIns] ?? '');
      if (u !== null && u > 0) out.insulin.push({ at, units: u, kind: /long|lenta|basal|prolong/.test(sub) ? 'basal' : 'rapid' });
      continue;
    }
    if (/carb/.test(type) && cCarb >= 0) {
      const g = num(r[cCarb] ?? '');
      if (g !== null && g > 0) out.carbs.push({ at, g });
      continue;
    }
    const raw = (r[cGlu] ?? '').toLowerCase();
    if (!raw) continue;
    const n = num(raw);
    let v = /low|bajo/.test(raw) ? 39 : /high|alto/.test(raw) ? 401 : n !== null && mmol ? n * 18.016 : n;
    if (v === null) {
      out.skipped++;
      continue;
    }
    v = Math.round(v);
    if (v < 20 || v > 600 || seen.has(at)) {
      out.skipped++;
      continue;
    }
    seen.add(at);
    out.glucose.push({ at, v });
  }
  out.glucose.sort((a, b) => a.at - b.at);
  out.insulin.sort((a, b) => a.at - b.at);
  out.carbs.sort((a, b) => a.at - b.at);
  out.from = out.glucose[0]?.at ?? null;
  out.to = out.glucose[out.glucose.length - 1]?.at ?? null;
  return out;
}

/**
 * Días enteros que hay que adelantar los datos para que la última lectura caiga en "ahora"
 * (se conservan las horas del día; lo que quede en el futuro se descarta al importar).
 */
export function shiftDaysToNow(lastAt: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((now - lastAt) / 864e5));
}
