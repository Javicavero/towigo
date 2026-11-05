/**
 * Informe para la consulta: resumen de lo que ha apuntado el paciente en un periodo.
 * Es un resumen de datos registrados: no interpreta, no diagnostica y no recomienda (Fase 1).
 */
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import type { Derived } from '../state/store';
import { hasT2, usesGlp1, type AppState } from '../state/types';

const DAY = 86400e3;
const f1 = (n: number) => n.toFixed(1).replace('.', ',');
const f2 = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');
const date = (x: string | number) => new Date(x).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Gráfica de línea muy simple en SVG (se imprime bien en PDF). */
function spark(points: { t: number; v: number }[], unit: string, band?: [number, number]) {
  if (points.length < 2) return '';
  const W = 520;
  const H = 120;
  const P = 24;
  const ts = points.map((p) => p.t);
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs, ...(band ?? [])) - 1;
  const hi = Math.max(...vs, ...(band ?? [])) + 1;
  const x = (v: number) => P + ((v - Math.min(...ts)) / Math.max(1, Math.max(...ts) - Math.min(...ts))) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const bandRect = band ? `<rect x="${P}" y="${y(band[1])}" width="${W - 2 * P}" height="${y(band[0]) - y(band[1])}" fill="#E3F4EC"/>` : '';
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${bandRect}
    <path d="${path}" fill="none" stroke="#1C1C1E" stroke-width="2"/>
    <text x="${P}" y="14" font-size="11" fill="#6B7280">${f1(hi - 1)}${unit}</text>
    <text x="${P}" y="${H - 6}" font-size="11" fill="#6B7280">${f1(lo + 1)}${unit}</text></svg>`;
}

const table = (head: string[], rows: string[][]) =>
  rows.length
    ? `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    : `<p class="muted">${t('report.noData')}</p>`;

export function buildReportHtml(state: AppState, d: Derived, weeks: number, now = Date.now()) {
  const from = now - weeks * 7 * DAY;
  const inRange = (at: string) => new Date(at).getTime() >= from;
  const glp1 = usesGlp1(state.profile);
  const t2 = hasT2(state.profile);
  const sections: string[] = [];

  // Tratamiento GLP-1
  if (glp1) {
    const inj = state.injections.filter((i) => inRange(i.at)).sort((a, b) => a.at.localeCompare(b.at));
    const expected = Math.max(1, Math.min(weeks, Math.ceil((now - new Date(state.glp1.startedAt).getTime()) / (7 * DAY))));
    const pct = Math.min(100, Math.round((inj.length / expected) * 100));
    const steps = state.glp1.titration
      .map((s, i) => `${i === d.phaseIndex ? '<b>' : ''}${f2(s.dose)} mg · ${s.weeks ? t('report.weeks', { n: s.weeks }) : t('report.maintenance')}${i === d.phaseIndex ? ` (${t('report.current')})</b>` : ''}`)
      .join(' → ');
    sections.push(`<h2>${t('report.glp1')}</h2>
      <p>${esc(t(`drug.${state.glp1.drug}`))} · ${t('report.since', { date: date(state.glp1.startedAt) })}</p>
      <p><span class="k">${t('report.titration')}</span> ${steps}</p>
      <p><span class="k">${t('report.adherence')}</span> ${t('report.adherenceValue', { a: inj.length, b: expected, pct })}</p>
      ${table(
        [t('report.date'), t('report.dose'), t('report.site')],
        inj.map((i) => [date(i.at), `${f2(i.dose)} mg`, esc(t(`site.${i.site}`))]),
      )}`);
  }

  // Peso y composición
  const ws = state.weights.filter((w) => inRange(w.at)).sort((a, b) => a.at.localeCompare(b.at));
  if (ws.length) {
    const a = ws[0];
    const b = ws[ws.length - 1];
    const diff = b.kg - a.kg;
    const comp = a.musclePct && b.musclePct ? `<p><span class="k">${t('report.comp')}</span> ${t('report.compValue', { fa: f1(a.fatPct ?? 0), fb: f1(b.fatPct ?? 0), ma: f1(a.musclePct), mb: f1(b.musclePct) })}</p>` : '';
    sections.push(`<h2>${t('report.weight')}</h2>
      <p>${t('report.weightValue', { a: f1(a.kg), b: f1(b.kg), diff: `${diff <= 0 ? '−' : '+'}${f1(Math.abs(diff))}`, pct: f1((Math.abs(diff) / a.kg) * 100) })}</p>
      ${comp}
      ${spark(ws.map((w) => ({ t: new Date(w.at).getTime(), v: w.kg })), ' kg')}`);
  }

  // Glucosa, HbA1c y medicación
  if (t2) {
    const gl = state.glucose.filter((g) => inRange(g.at));
    const fasting = gl.filter((g) => g.context === 'ayunas');
    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null);
    const [lo, hi] = state.goals.fastingRange;
    const inT = fasting.filter((g) => g.v >= lo && g.v <= hi).length;
    const under70 = gl.filter((g) => g.v < 70).length;
    sections.push(`<h2>${t('report.glucose')}</h2>
      <p>${t('report.glucoseValue', { n: gl.length, avgF: avg(fasting.map((g) => g.v)) ?? '—', avgP: avg(gl.filter((g) => g.context === 'despuesComer').map((g) => g.v)) ?? '—' })}</p>
      <p>${t('report.glucoseTarget', { lo, hi, pct: fasting.length ? Math.round((inT / fasting.length) * 100) : 0, low: under70 })}</p>
      ${spark(fasting.map((g) => ({ t: new Date(g.at).getTime(), v: g.v })), '', state.goals.fastingRange)}
      ${state.hba1c.length ? `<p><span class="k">HbA1c</span> ${state.hba1c.map((h) => `${f1(h.v)} % (${date(h.at)})`).join(' · ')}</p>` : ''}`);
    if (state.meds.length) {
      const days = Math.min(weeks * 7, 30);
      const expected = state.meds.reduce((s, m) => s + m.times.length, 0) * days;
      const taken = Object.entries(state.medsTaken).filter(([k, v]) => v && new Date(k.split('|')[0]).getTime() >= now - days * DAY).length;
      sections.push(`<h2>${t('report.meds')}</h2>
        <p>${state.meds.map((m) => `${esc(m.name)} ${esc(m.dose)} (${m.times.join(', ')})`).join(' · ')}</p>
        <p class="muted">${t('report.medsValue', { a: taken, b: expected, days })}</p>`);
    }
  }

  // Efectos secundarios
  if (glp1) {
    const se = state.sideEffects.filter((x) => inRange(x.at));
    const count: Record<string, { n: number; max: number }> = {};
    se.forEach((e) =>
      e.symptoms.forEach((s) => {
        const c = (count[s.id] ??= { n: 0, max: 0 });
        c.n++;
        c.max = Math.max(c.max, s.level);
      }),
    );
    sections.push(`<h2>${t('report.effects')}</h2>
      ${table(
        [t('report.symptom'), t('report.times'), t('report.maxLevel')],
        Object.entries(count).map(([id, c]) => [esc(t(`sym.${id}`)), String(c.n), esc(t(`level.${c.max}`))]),
      )}`);
  }

  // Hábitos: proteína y fuerza
  const intake = state.intake.filter((i) => new Date(i.date).getTime() >= from && i.protein > 0);
  const strength = state.strength.filter((s) => inRange(s.at)).length;
  sections.push(`<h2>${t('report.habits')}</h2>
    <p><span class="k">${t('report.protein')}</span> ${
      intake.length ? t('report.proteinValue', { avg: Math.round(intake.reduce((s, i) => s + i.protein, 0) / intake.length), goal: state.goals.proteinG, days: intake.length }) : t('report.noData')
    }</p>
    <p><span class="k">${t('report.strength')}</span> ${t('report.strengthValue', { n: strength, goal: state.goals.strengthPerWeek * weeks })}</p>
    <p><span class="k">${t('report.streak')}</span> ${t('report.streakValue', { n: d.streak })}</p>`);

  const patient = esc(state.userName || t('report.patient'));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${t('report.title')} · ${patient}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: -apple-system, 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1C1C1E; font-size: 12px; line-height: 1.45; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1C1C1E; padding-bottom: 8px; margin-bottom: 8px; }
  h1 { font-size: 20px; margin: 0; } h2 { font-size: 14px; margin: 18px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #E5E5EA; }
  p { margin: 4px 0; } .k { font-weight: 600; } .muted { color: #6B7280; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; } th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #F0F0F3; } th { color: #6B7280; font-weight: 600; }
  footer { margin-top: 22px; padding-top: 8px; border-top: 1px solid #E5E5EA; color: #6B7280; font-size: 10px; }
  svg { margin-top: 6px; }
</style></head><body>
<header><div><h1>${t('report.title')}</h1><div class="muted">${patient} · ${esc(t(`profile.${state.profile}`))}</div></div>
<div class="muted" style="text-align:right">${t('report.period', { from: date(from), to: date(now), n: weeks })}<br>${t('report.team', { who: TEAM.endo.name })}</div></header>
${sections.join('\n')}
<footer>${t('report.disclaimer')}<br>${t('report.generated', { date: new Date(now).toLocaleString('es-ES') })}</footer>
</body></html>`;
}
