/**
 * Diseño "Rendimiento" de Hoy (formato app de recuperación): superficie negra en oscuro y blanca en claro, tres diales (Bienestar · Índice ·
 * Actividad 0–21), objetivo de actividad según tu índice, estadísticas clave frente a tu media de 30 días, diario de
 * hábitos de sí/no y "lo que influye en tu índice". El detalle se abre en subventanas.
 * Fase 1: hábitos y datos; las asociaciones no son causas ni indicaciones clínicas.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { CheckinPill, MoodHistory } from '../../components/checkin';
import { Icon, type IconName } from '../../components/icons';
import { Sheet } from '../../components/sheet';
import { Button, Row, T } from '../../components/ui';
import { t } from '../../i18n';
import { useNav } from '../../nav';
import { dayKey, dayKeyAgo, dayKeyToDate } from '../../state/dates';
import { activityLoad, activityTarget, JOURNAL, journalDays, journalImpact, keyStats, wellbeing, type KeyStat } from '../../state/journal';
import { scoreHistory, towigoScore, type Score } from '../../state/score';
import { useStore } from '../../state/store';
import { colors, fonts, isDark } from '../../theme';

/** Paleta del diseño: negro profundo en modo oscuro; blanco limpio en modo claro (nunca se mezclan). */
const P = isDark
  ? {
      bg: '#07090D',
      card: '#12161E',
      line: 'rgba(255,255,255,0.08)',
      text: '#F3F5F9',
      sub: '#A3ACBB',
      track: 'rgba(255,255,255,0.09)',
      press: 'rgba(255,255,255,0.04)',
      green: '#22E39A',
      yellow: '#F6C945',
      red: '#FF5C6C',
      blue: '#4AA8FF',
      blueSoft: 'rgba(74,168,255,0.35)',
      blueBand: 'rgba(74,168,255,0.25)',
      violet: '#9B8CFF',
    }
  : {
      bg: '#FFFFFF',
      card: '#F5F3FA',
      line: 'rgba(27,22,48,0.08)',
      text: '#1B1630',
      sub: '#5E5873',
      track: 'rgba(27,22,48,0.08)',
      press: 'rgba(27,22,48,0.04)',
      green: '#0B8F5E',
      yellow: '#B7791F',
      red: '#C8324A',
      blue: '#1E6FD9',
      blueSoft: 'rgba(30,111,217,0.28)',
      blueBand: 'rgba(30,111,217,0.16)',
      violet: '#6A4FE0',
    };
const bandColor = (b: Score['band']) => (b === 'great' || b === 'good' ? P.green : b === 'fair' ? P.yellow : P.red);
const f1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const lbl = { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1 } as const;

function Dial({
  size,
  frac,
  color,
  value,
  unit,
  label,
  onPress,
  a11y,
}: {
  size: number;
  frac: number;
  color: string;
  value: string;
  unit?: string;
  label: string;
  onPress: () => void;
  a11y: string;
}) {
  const w = size * 0.075;
  const r = size / 2 - w / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => ({ alignItems: 'center', gap: 8, opacity: pressed ? 0.75 : 1 })}
    >
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={P.track} strokeWidth={w} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={w}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0.01, Math.min(1, frac)) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <T color={P.text} style={{ fontFamily: fonts.bold, fontSize: size * 0.27, lineHeight: size * 0.32, letterSpacing: -0.8 }}>
          {value}
        </T>
        {unit ? (
          <T color={P.sub} style={{ fontSize: size * 0.1, lineHeight: size * 0.12, marginTop: -2 }}>
            {unit}
          </T>
        ) : null}
      </View>
      <T color={P.sub} style={lbl}>
        {label.toUpperCase()}
      </T>
    </Pressable>
  );
}

function DarkRow({
  icon,
  title,
  value,
  onPress,
  last,
  accent,
}: {
  icon: IconName;
  title: string;
  value: string;
  onPress: () => void;
  last?: boolean;
  accent?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        minHeight: 56,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: P.line,
        backgroundColor: pressed ? P.press : 'transparent',
      })}
    >
      <Icon name={icon} size={18} color={accent ?? P.sub} />
      <T color={P.text} style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15 }}>
        {title}
      </T>
      <T color={P.sub} style={{ fontSize: 13, maxWidth: 150 }} numberOfLines={1}>
        {value}
      </T>
      <Icon name="next" size={16} color={P.sub} />
    </Pressable>
  );
}

/** Barra 0–21 con el rango objetivo sombreado y la marca de hoy. */
function LoadBar({ load, target, width }: { load: number; target: [number, number]; width: number }) {
  const X = (v: number) => (v / 21) * width;
  return (
    <Svg width={width} height={26}>
      <Rect x={0} y={9} width={width} height={8} rx={4} fill={P.track} />
      <Rect x={X(target[0])} y={6} width={X(target[1]) - X(target[0])} height={14} rx={7} fill={P.blueBand} />
      <Rect x={0} y={9} width={Math.max(4, X(load))} height={8} rx={4} fill={P.blue} />
      <Circle cx={X(load)} cy={13} r={7} fill={P.text} stroke={P.blue} strokeWidth={3} />
    </Svg>
  );
}

const statFmt = (k: KeyStat, v: number) => (k.decimals ? f1(v) : Math.round(v).toLocaleString('es-ES'));

export function PulseLayout({ onOpenScore }: { onOpenScore: () => void }) {
  const { state, dispatch } = useStore();
  const { go } = useNav();
  const [open, setOpen] = useState<null | 'wellbeing' | 'activity' | 'stats' | 'journal' | 'impact' | 'trends'>(null);
  const [w, setW] = useState(300);
  const sc = towigoScore(state);
  const color = bandColor(sc.band);
  const wb = wellbeing(state);
  const load = activityLoad(state);
  const target = activityTarget(state);
  const stats = keyStats(state);
  const better = stats.filter((k) => k.baseline !== null && k.betterUp !== null && (k.betterUp ? k.value > k.baseline : k.value < k.baseline)).length;
  const today = dayKey(Date.now());
  const answered = Object.keys(state.journal?.[today] ?? {}).length;
  const impact = journalImpact(state);
  const hist14 = scoreHistory(state, 14);
  const loads7 = Array.from({ length: 7 }, (_, i) => activityLoad(state, 6 - i));
  const status = load < target[0] ? t('pulse.loadBelow', { n: f1(target[0] - load) }) : load > target[1] ? t('pulse.loadAbove') : t('pulse.loadIn');
  const jd = journalDays(state);

  return (
    <View style={{ backgroundColor: P.bg, borderRadius: 26, padding: 16, gap: 16, borderWidth: isDark ? 0 : 1, borderColor: P.line }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Dial
          size={92}
          frac={wb === null ? 0 : wb / 100}
          color={P.violet}
          value={wb === null ? '—' : `${wb}`}
          unit={wb === null ? undefined : '%'}
          label={t('pulse.wellbeing')}
          onPress={() => setOpen('wellbeing')}
          a11y={t('pulse.wellbeingA11y', { n: wb ?? 0 })}
        />
        <Dial
          size={128}
          frac={sc.value / 100}
          color={color}
          value={`${sc.value}`}
          unit="/100"
          label={t('pulse.index')}
          onPress={onOpenScore}
          a11y={t('score.a11y', { v: sc.value, band: t(`score.band.${sc.band}`) })}
        />
        <Dial
          size={92}
          frac={load / 21}
          color={P.blue}
          value={f1(load)}
          unit="/21"
          label={t('pulse.activity')}
          onPress={() => setOpen('activity')}
          a11y={t('pulse.activityA11y', { n: f1(load) })}
        />
      </Row>

      <View style={{ backgroundColor: P.card, borderRadius: 18, padding: 14, gap: 6 }}>
        <Row gap={8}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          <T color={P.text} style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
            {t(`pulse.headline.${sc.band}`)}
          </T>
        </Row>
        <T color={P.sub} style={{ fontSize: 14, lineHeight: 20 }}>
          {t('pulse.target', { a: target[0], b: target[1] })} {status}
        </T>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('pulse.activityToday')}
        onPress={() => setOpen('activity')}
        onLayout={(e) => setW(e.nativeEvent.layout.width - 28)}
        style={{ backgroundColor: P.card, borderRadius: 18, padding: 14, gap: 8 }}
      >
        <Row style={{ justifyContent: 'space-between' }}>
          <T color={P.sub} style={lbl}>
            {t('pulse.activityToday').toUpperCase()}
          </T>
          <T color={P.text} style={{ fontFamily: fonts.semibold }}>
            {f1(load)} <T color={P.sub}>/ 21</T>
          </T>
        </Row>
        <LoadBar load={load} target={target} width={Math.max(120, w)} />
      </Pressable>

      <View style={{ backgroundColor: P.card, borderRadius: 18, overflow: 'hidden' }}>
        <DarkRow
          icon="signal"
          title={t('pulse.statsShort')}
          value={t('pulse.statsValue', { n: better, total: stats.length })}
          onPress={() => setOpen('stats')}
        />
        <DarkRow
          icon="doc"
          title={t('pulse.journal')}
          value={t('pulse.journalValue', { a: answered, b: JOURNAL.length })}
          onPress={() => setOpen('journal')}
          accent={answered < JOURNAL.length ? P.yellow : P.green}
        />
        <DarkRow icon="flag" title={t('pulse.impactShort')} value={impact[0] ? t(`journal.short.${impact[0].id}`) : '—'} onPress={() => setOpen('impact')} />
        <DarkRow icon="trophy" title={t('pulse.trends')} value={t('pulse.trendsValue')} onPress={() => setOpen('trends')} last />
      </View>

      {/* Subventanas */}
      <Sheet open={open === 'wellbeing'} onClose={() => setOpen(null)} title={t('pulse.wellbeing')} subtitle={t('pulse.wellbeingSub')}>
        <T v="display" center>
          {wb === null ? '—' : `${wb} %`}
        </T>
        <MoodHistory />
        {!state.checkins.some((c) => c.date === today) && (
          <CheckinPill
            onPress={() => {
              setOpen(null);
              go('progress');
            }}
          />
        )}
      </Sheet>

      <Sheet open={open === 'activity'} onClose={() => setOpen(null)} title={t('pulse.activity')} subtitle={t('pulse.activitySub')}>
        <View style={{ backgroundColor: P.bg, borderRadius: 18, padding: 14, gap: 10 }} onLayout={(e) => setW(e.nativeEvent.layout.width - 28)}>
          <View style={{ gap: 2 }}>
            <T color={P.text} style={{ fontFamily: fonts.bold, fontSize: 30 }}>
              {f1(load)}
              <T color={P.sub} style={{ fontSize: 15 }}>
                {' '}
                / 21
              </T>
            </T>
            <T color={P.blue} style={{ fontFamily: fonts.semibold }}>
              {t('pulse.target', { a: target[0], b: target[1] })}
            </T>
          </View>
          <LoadBar load={load} target={target} width={Math.max(120, w)} />
          <T color={P.sub} style={lbl}>
            {t('pulse.last7').toUpperCase()}
          </T>
          <View
            style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 90 }}
            accessible
            accessibilityLabel={t('pulse.last7a11y', { list: loads7.map(f1).join(', ') })}
          >
            {loads7.map((v, i) => (
              <View key={i} style={{ flex: 1, height: `${Math.max(6, (v / 21) * 100)}%`, borderRadius: 5, backgroundColor: i === 6 ? P.blue : P.blueSoft }} />
            ))}
          </View>
        </View>
        <T color={colors.secondary}>{t('pulse.activityHow')}</T>
        <Button
          label={t('pulse.addStrength')}
          onPress={() => {
            setOpen(null);
            go('log', 'strength');
          }}
        />
      </Sheet>

      <Sheet open={open === 'stats'} onClose={() => setOpen(null)} title={t('pulse.stats')} subtitle={t('pulse.statsSub')}>
        <View style={{ backgroundColor: P.bg, borderRadius: 18, overflow: 'hidden' }}>
          {stats.map((k, i) => {
            const up = k.baseline !== null && k.value > k.baseline;
            const same = k.baseline === null || Math.abs(k.value - k.baseline) < (k.decimals ? 0.05 : 0.5);
            const good = same || k.betterUp === null ? null : k.betterUp === up;
            const c = good === null ? P.sub : good ? P.green : P.red;
            return (
              <Row
                key={k.id}
                style={{ paddingHorizontal: 14, minHeight: 58, borderBottomWidth: i < stats.length - 1 ? 1 : 0, borderBottomColor: P.line }}
                gap={10}
              >
                <View style={{ flex: 1 }}>
                  <T color={P.text} style={{ fontFamily: fonts.medium }}>
                    {t(`pulse.stat.${k.id}`)}
                  </T>
                  <T color={P.sub} style={{ fontSize: 12 }}>
                    {k.baseline === null ? t('pulse.noBaseline') : t('pulse.baseline', { v: statFmt(k, k.baseline) })}
                  </T>
                </View>
                <T color={c} style={{ fontSize: 14, fontFamily: fonts.bold }}>
                  {same ? '=' : up ? '▲' : '▼'}
                </T>
                <T color={P.text} style={{ fontFamily: fonts.bold, fontSize: 18 }}>
                  {statFmt(k, k.value)}
                  <T color={P.sub} style={{ fontSize: 12 }}>
                    {' '}
                    {k.unit}
                  </T>
                </T>
              </Row>
            );
          })}
        </View>
      </Sheet>

      <Sheet open={open === 'journal'} onClose={() => setOpen(null)} title={t('pulse.journal')} subtitle={t('pulse.journalSub')}>
        {JOURNAL.map((q) => {
          const cur = state.journal?.[today]?.[q.id];
          return (
            <View key={q.id} style={{ backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 12, gap: 8 }}>
              <T v="label">{t(`journal.q.${q.id}`)}</T>
              <Row gap={8}>
                {[true, false].map((v) => {
                  const on = cur === v;
                  return (
                    <Pressable
                      key={String(v)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${t(`journal.q.${q.id}`)} ${v ? t('pulse.yes') : t('pulse.no')}`}
                      onPress={() => dispatch({ type: 'journal', q: q.id, v: on ? null : v })}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? colors.greenText : colors.chip,
                      }}
                    >
                      <T v="label" color={on ? colors.onAccent : colors.ink}>
                        {v ? t('pulse.yes') : t('pulse.no')}
                      </T>
                    </Pressable>
                  );
                })}
              </Row>
            </View>
          );
        })}
        <T v="small" color={colors.secondary}>
          {t('pulse.journalNote', { n: Object.keys(jd).length })}
        </T>
      </Sheet>

      <Sheet open={open === 'impact'} onClose={() => setOpen(null)} title={t('pulse.impact')} subtitle={t('pulse.impactSub')}>
        <View style={{ backgroundColor: P.bg, borderRadius: 18, padding: 14, gap: 14 }}>
          {impact.length === 0 && <T color={P.sub}>{t('pulse.impactEmpty')}</T>}
          {impact.map((x) => {
            const max = Math.max(1, ...impact.map((i) => Math.abs(i.diff)));
            const pos = x.diff >= 0;
            return (
              <View key={x.id} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T color={P.text} style={{ fontFamily: fonts.medium, flex: 1 }}>
                    {t(`journal.short.${x.id}`)}
                  </T>
                  <T color={pos ? P.green : P.red} style={{ fontFamily: fonts.bold }}>
                    {pos ? '+' : '−'}
                    {f1(Math.abs(x.diff))}
                  </T>
                </Row>
                <View style={{ flexDirection: 'row', height: 8 }}>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    {!pos && <View style={{ width: `${(Math.abs(x.diff) / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: P.red }} />}
                  </View>
                  <View style={{ width: 2, backgroundColor: P.line }} />
                  <View style={{ flex: 1 }}>
                    {pos && <View style={{ width: `${(Math.abs(x.diff) / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: P.green }} />}
                  </View>
                </View>
                <T color={P.sub} style={{ fontSize: 12 }}>
                  {t('pulse.impactLine', { yes: x.yes, no: x.no })}
                </T>
              </View>
            );
          })}
        </View>
        <T v="small" color={colors.secondary}>
          {t('pulse.impactNote')}
        </T>
      </Sheet>

      <Sheet open={open === 'trends'} onClose={() => setOpen(null)} title={t('pulse.trends')} subtitle={t('pulse.trendsSub')}>
        <View style={{ backgroundColor: P.bg, borderRadius: 18, padding: 14, gap: 10 }}>
          <T color={P.sub} style={lbl}>
            {t('pulse.index').toUpperCase()} · 14 {t('pulse.days')}
          </T>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 110 }} accessible accessibilityLabel={hist14.join(', ')}>
            {hist14.map((v, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.max(6, v)}%`,
                  borderRadius: 4,
                  backgroundColor: bandColor(v >= 85 ? 'great' : v >= 70 ? 'good' : v >= 50 ? 'fair' : 'low'),
                  opacity: i === hist14.length - 1 ? 1 : 0.6,
                }}
              />
            ))}
          </View>
          <Row style={{ justifyContent: 'space-between' }}>
            <T color={P.sub} style={{ fontSize: 11 }}>
              {dayKeyToDate(dayKeyAgo(13)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </T>
            <T color={P.sub} style={{ fontSize: 11 }}>
              {t('pulse.today')}
            </T>
          </Row>
          <T color={P.sub} style={lbl}>
            {t('pulse.activity').toUpperCase()} · 7 {t('pulse.days')}
          </T>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 80 }}>
            {loads7.map((v, i) => (
              <View key={i} style={{ flex: 1, height: `${Math.max(6, (v / 21) * 100)}%`, borderRadius: 5, backgroundColor: i === 6 ? P.blue : P.blueSoft }} />
            ))}
          </View>
        </View>
      </Sheet>
    </View>
  );
}
