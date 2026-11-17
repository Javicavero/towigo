/**
 * Piezas del diseño "Tratamiento" (GLP-1):
 * - SemiGauge: semicírculo del ciclo semanal ("Hoy toca inyección" / "Faltan N días") con el botón de registrar.
 * - ResultsPanel: resultados de peso con rango (1 mes · 3 meses · 6 meses · todo), tarjetas de cifras y la gráfica de peso
 *   coloreada por la dosis que se usaba en cada tramo.
 * Fase 1: solo datos registrados. No se calcula ni se muestra un "nivel estimado del fármaco" (sería producto sanitario).
 */
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { colors, fonts, isDark } from '../theme';
import { Segmented, T } from './ui';

const DOSE_COLORS = isDark
  ? ['#A7ACC6', '#7C6CFF', '#3DE0C8', '#FF7AB6', '#F5B95A', '#5CC8FF']
  : ['#8E8AA6', '#6A4FE0', '#0E8F7E', '#D9486A', '#D9792F', '#1E63C7'];
const f1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const fmtDose = (x: number) => String(x).replace('.', ',');
const DAY = 864e5;

/** Semicírculo del ciclo de 7 días: se llena a medida que se acerca el día de la inyección. */
export function SemiGauge({ size = 260 }: { size?: number }) {
  const { d } = useStore();
  const days = d.injectedToday ? 0 : Math.max(0, d.daysToInjection ?? 0);
  const frac = d.injectedToday ? 1 : 1 - Math.min(7, days) / 7;
  const w = size * 0.075;
  const r = size / 2 - w;
  const cx = size / 2;
  const cy = size / 2;
  const h = size / 2 + w * 0.2;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`;
  };
  const end = Math.PI - Math.max(0.02, frac) * Math.PI;
  const dot = [cx + r * Math.cos(end), cy - r * Math.sin(end)];
  const next = d.nextInjectionAt ? new Date(d.nextInjectionAt) : null;
  const title = d.injectedToday
    ? t('treat.doneToday')
    : d.injectionOverdue
      ? t('treat.overdue')
      : days === 0
        ? t('treat.today')
        : t('treat.inDays', { n: days });
  return (
    <View
      style={{ alignItems: 'center' }}
      accessible
      accessibilityLabel={`${title}. ${next ? next.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}`}
    >
      <Svg width={size} height={h}>
        <Defs>
          <SvgGradient id="semi" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={isDark ? '#3DE0C8' : '#14B8A6'} />
            <Stop offset="0.55" stopColor={isDark ? '#7C6CFF' : '#6A4FE0'} />
            <Stop offset="1" stopColor={isDark ? '#FF7AB6' : '#D9486A'} />
          </SvgGradient>
        </Defs>
        <Path d={arc(Math.PI, 0)} stroke={isDark ? 'rgba(255,255,255,0.09)' : '#ECE7F8'} strokeWidth={w} fill="none" strokeLinecap="round" />
        <Path d={arc(Math.PI, end)} stroke="url(#semi)" strokeWidth={w} fill="none" strokeLinecap="round" />
        <Circle cx={dot[0]} cy={dot[1]} r={w * 0.62} fill={colors.white} stroke={d.injectionOverdue ? colors.coralText : colors.greenText} strokeWidth={3} />
      </Svg>
      <View style={{ marginTop: -size * 0.19, alignItems: 'center', gap: 2 }}>
        <T v="title" center style={{ fontSize: 24, lineHeight: 30 }} color={d.injectionOverdue ? colors.coralText : colors.ink}>
          {title}
        </T>
        <T v="small" color={colors.secondary} center>
          {next
            ? `${next.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })} · ${next.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </T>
      </View>
    </View>
  );
}

type Range = '1m' | '3m' | '6m' | 'all';
const RANGE_DAYS: Record<Range, number> = { '1m': 31, '3m': 92, '6m': 183, all: 100000 };

/** Resultados de peso con cifras y gráfica coloreada por dosis. */
export function ResultsPanel() {
  const { state, d } = useStore();
  const [range, setRange] = useState<Range>('all');
  const [w, setW] = useState(320);
  const now = Date.now();
  const from = now - RANGE_DAYS[range] * DAY;
  const wsAll = [...state.weights].sort((a, b) => a.at.localeCompare(b.at));
  const ws = wsAll.filter((x) => new Date(x.at).getTime() >= from);
  const inj = [...state.injections].sort((a, b) => a.at.localeCompare(b.at));
  const doses = [...new Set(inj.map((x) => x.dose))];
  const doseAt = (tt: number) => [...inj].reverse().find((x) => new Date(x.at).getTime() <= tt)?.dose ?? inj[0]?.dose ?? null;
  const first = ws[0];
  const last = ws[ws.length - 1];
  const change = first && last ? last.kg - first.kg : 0;
  const weeks = first && last ? Math.max(1, (new Date(last.at).getTime() - new Date(first.at).getTime()) / (7 * DAY)) : 1;
  const goal = state.goals.weightKg;
  const toGoal = last && goal ? last.kg - goal : null;
  const tiles = [
    { l: t('treat.total'), v: `${change <= 0 ? '−' : '+'}${f1(Math.abs(change))}`, u: 'kg' },
    { l: t('treat.weight'), v: last ? f1(last.kg) : '—', u: 'kg' },
    { l: t('treat.percent'), v: first && last ? `${change <= 0 ? '−' : '+'}${f1(Math.abs((change / first.kg) * 100))}` : '—', u: '%' },
    { l: t('treat.weekly'), v: `${change <= 0 ? '−' : '+'}${f1(Math.abs(change / weeks))}`, u: 'kg' },
    { l: t('treat.toGoal'), v: toGoal !== null ? f1(Math.max(0, toGoal)) : '—', u: 'kg' },
    { l: t('treat.weeksOn'), v: `${d.injectionWeeks}`, u: t('treat.weeksU') },
  ];

  // Gráfica
  const H = 190;
  const padL = 34;
  const padR = 10;
  const padT = 22;
  const padB = 22;
  const kgs = ws.map((x) => x.kg);
  const min = Math.floor(Math.min(...kgs, goal && range === 'all' ? goal : Infinity) - 0.5);
  const max = Math.ceil(Math.max(...kgs) + 0.5);
  const t0 = first ? new Date(first.at).getTime() : now;
  const t1 = last ? new Date(last.at).getTime() : now;
  const X = (tt: number) => padL + ((tt - t0) / Math.max(1, t1 - t0)) * (w - padL - padR);
  const Y = (kg: number) => padT + (1 - (kg - min) / Math.max(1, max - min)) * (H - padT - padB);
  const pts = ws.map((x) => ({ x: X(new Date(x.at).getTime()), y: Y(x.kg), dose: doseAt(new Date(x.at).getTime()) }));
  const segs: { color: string; d: string }[] = [];
  const labels: { x: number; y: number; dose: number; color: string }[] = [];
  for (let i = 1; i < pts.length; i++) {
    const dose = pts[i].dose;
    const color = DOSE_COLORS[Math.max(0, doses.indexOf(dose ?? -1)) % DOSE_COLORS.length];
    segs.push({ color, d: `M${pts[i - 1].x},${pts[i - 1].y} L${pts[i].x},${pts[i].y}` });
    if (dose !== null && (i === 1 || pts[i - 1].dose !== dose)) labels.push({ x: pts[i - 1].x, y: pts[i - 1].y, dose, color });
  }
  const ticks = [min, Math.round((min + max) / 2), max];
  const dateLbl = (tt: number) => new Date(tt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <View style={{ gap: 12 }}>
      <Segmented
        options={[
          { id: '1m', label: t('treat.r1m') },
          { id: '3m', label: t('treat.r3m') },
          { id: '6m', label: t('treat.r6m') },
          { id: 'all', label: t('treat.rAll') },
        ]}
        value={range}
        onChange={(v) => setRange(v as Range)}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tiles.map((x) => (
          <View
            key={x.l}
            style={{
              flexBasis: '31%',
              flexGrow: 1,
              padding: 10,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.white,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)',
              gap: 2,
            }}
          >
            <T v="small" color={colors.secondary} style={{ fontSize: 11 }} numberOfLines={1}>
              {x.l}
            </T>
            <T>
              <T v="h2" style={{ fontSize: 19 }}>
                {x.v}
              </T>
              <T v="small" color={colors.secondary}>
                {' '}
                {x.u}
              </T>
            </T>
          </View>
        ))}
      </View>
      {pts.length > 1 ? (
        <View
          onLayout={(e) => setW(e.nativeEvent.layout.width)}
          accessible
          accessibilityLabel={t('treat.chartA11y', { a: first ? f1(first.kg) : '', b: last ? f1(last.kg) : '' })}
        >
          <Svg width={w} height={H}>
            {ticks.map((k) => (
              <Line key={k} x1={padL} x2={w - padR} y1={Y(k)} y2={Y(k)} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,22,48,0.07)'} strokeWidth={1} />
            ))}
            {ticks.map((k) => (
              <SvgText key={`t${k}`} x={padL - 6} y={Y(k) + 4} textAnchor="end" fontSize={10} fontFamily={fonts.regular} fill={colors.secondary}>
                {k}
              </SvgText>
            ))}
            {goal && range === 'all' ? (
              <Line x1={padL} x2={w - padR} y1={Y(goal)} y2={Y(goal)} stroke={colors.greenText} strokeDasharray="4 4" strokeWidth={1.2} />
            ) : null}
            {segs.map((s, i) => (
              <Path key={i} d={s.d} stroke={s.color} strokeWidth={3} strokeLinecap="round" fill="none" />
            ))}
            {pts.map((p, i) => (
              <Circle key={`p${i}`} cx={p.x} cy={p.y} r={2.6} fill={DOSE_COLORS[Math.max(0, doses.indexOf(p.dose ?? -1)) % DOSE_COLORS.length]} />
            ))}
            {labels.map((l, i) => (
              <G key={`l${i}`}>
                <Rect x={l.x - 2} y={l.y - 20} width={fmtDose(l.dose).length * 6 + 26} height={16} rx={8} fill={l.color} />
                <SvgText x={l.x + 6} y={l.y - 8.5} fontSize={10} fontFamily={fonts.semibold} fill="#FFFFFF">
                  {`${fmtDose(l.dose)} mg`}
                </SvgText>
              </G>
            ))}
            <SvgText x={padL} y={H - 4} fontSize={10} fontFamily={fonts.regular} fill={colors.secondary}>
              {dateLbl(t0)}
            </SvgText>
            <SvgText x={w - padR} y={H - 4} textAnchor="end" fontSize={10} fontFamily={fonts.regular} fill={colors.secondary}>
              {dateLbl(t1)}
            </SvgText>
          </Svg>
        </View>
      ) : (
        <T color={colors.secondary}>{t('treat.noData')}</T>
      )}
      <T v="small" color={colors.secondary}>
        {t('layout.treatment.byDoseNote')}
      </T>
    </View>
  );
}
