/**
 * Diseños de la pantalla Hoy (el paciente elige el que prefiera; Owi está en todos como asistente).
 * Cada uno toma un FORMATO conocido, con la identidad y los datos de Towigo:
 *  - treatment  Tratamiento primero (formato registro de dosis)
 *  - score      Índice del día (formato anillo de recuperación)
 *  - program    Programa diario (formato curso con lecciones)
 *  - diary      Diario (formato registro de comidas)
 *  - timeline   Línea del día (formato muro cronológico)
 *  - summary    Resumen en tarjetas (formato app de salud del móvil)
 * El diseño "panel" (por defecto) está en Home.tsx.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { MoodFace } from '../../components/checkin';
import { Icon, type IconName } from '../../components/icons';
import { Sparkline } from '../../components/kpi';
import OwiSticker from '../../components/OwiSticker';
import { BAND_COLOR, ScoreGauge } from '../../components/score';
import { T1Card } from '../../components/t1';
import { TodayList } from '../../components/today';
import { Button, Row, T } from '../../components/ui';
import { STEPS_GOAL, STEPS_TODAY } from '../../data/mock';
import { t } from '../../i18n';
import { useNav } from '../../nav';
import { dayKey } from '../../state/dates';
import { scoreHistory, towigoScore } from '../../state/score';
import { useStore } from '../../state/store';
import { hasDiabetes, isT1, usesGlp1, type HomeLayout } from '../../state/types';
import { colors, fonts, isDark } from '../../theme';

export const HOME_LAYOUTS: HomeLayout[] = ['panel', 'score', 'treatment', 'program', 'diary', 'timeline', 'summary'];

const f1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const panelBg = isDark ? 'rgba(255,255,255,0.045)' : colors.white;
const border = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)';
const box = { backgroundColor: panelBg, borderWidth: 1, borderColor: border, borderRadius: 22, padding: 16, gap: 12 } as const;
const label = { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6 } as const;
const good = isDark ? '#3DE0C8' : '#0E8F7E';
const isToday = (at: string) => dayKey(new Date(at).getTime()) === dayKey(Date.now());
const hhmm = (at: string) => new Date(at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

/** Selector de diseño (chips horizontales). */
export function LayoutPicker() {
  const { state, dispatch } = useStore();
  const cur = state.homeLayout ?? 'panel';
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel={t('layout.a11y')}>
      {HOME_LAYOUTS.map((l) => {
        const on = l === cur;
        return (
          <Pressable
            key={l}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${t(`layout.${l}`)}: ${t(`layout.${l}.sub`)}`}
            onPress={() => dispatch({ type: 'setHomeLayout', layout: l })}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              backgroundColor: on ? colors.greenText : panelBg,
              borderWidth: 1,
              borderColor: on ? colors.greenText : border,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <T v="small" color={on ? colors.onAccent : colors.ink} style={{ fontFamily: on ? fonts.semibold : fonts.medium, fontSize: 13 }}>
              {t(`layout.${l}`)}
            </T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- A · Tratamiento primero
export function TreatmentLayout() {
  const { state, d } = useStore();
  const { go } = useNav();
  if (!usesGlp1(state.profile) || d.maintenance) {
    return (
      <View style={{ gap: 12 }}>
        <T v="h2">{t('layout.treatment.title')}</T>
        {isT1(state.profile) ? <T1Card /> : <TodayList />}
      </View>
    );
  }
  const days = d.injectedToday ? 7 : Math.max(0, d.daysToInjection ?? 0);
  const frac = d.injectedToday ? 1 : 1 - Math.min(7, days) / 7;
  const next = d.nextInjectionAt ? new Date(d.nextInjectionAt) : null;
  const inj = [...state.injections].sort((a, b) => a.at.localeCompare(b.at));
  // 12 semanas: dosis puesta en cada semana (o hueco)
  const now = Date.now();
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = now - (11 - i) * 7 * 864e5;
    const hit = inj.find((x) => {
      const tt = new Date(x.at).getTime();
      return tt <= end && end - tt < 7 * 864e5;
    });
    return hit ? hit.dose : null;
  });
  // Resultados por dosis: cambio de peso mientras se usaba cada dosis
  const ws = [...state.weights].sort((a, b) => a.at.localeCompare(b.at));
  const kgAt = (tt: number) => [...ws].reverse().find((w) => new Date(w.at).getTime() <= tt)?.kg ?? ws[0]?.kg ?? null;
  const doses = [...new Set(inj.map((x) => x.dose))];
  const byDose = doses.map((dose, i) => {
    const from = new Date(inj.find((x) => x.dose === dose)!.at).getTime();
    const nextDose = doses[i + 1];
    const to = nextDose !== undefined ? new Date(inj.find((x) => x.dose === nextDose)!.at).getTime() : now;
    const a = kgAt(from);
    const b = kgAt(to);
    return { dose, delta: a !== null && b !== null ? b - a : 0 };
  });
  const maxLoss = Math.max(0.1, ...byDose.map((x) => -x.delta));
  const effectWeeks = new Set(state.sideEffects.map((e) => Math.floor((now - new Date(e.at).getTime()) / (7 * 864e5)))).size;
  const ring = 2 * Math.PI * 50;
  const fmtDose = (x: number) => String(x).replace('.', ',');
  return (
    <View style={{ gap: 12 }}>
      <View style={[box, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
        <Svg width={116} height={116} accessibilityLabel={t('layout.treatment.ringA11y', { n: days })}>
          <Circle cx={58} cy={58} r={50} stroke={isDark ? 'rgba(255,255,255,0.09)' : '#ECE7F8'} strokeWidth={10} fill="none" />
          <Circle
            cx={58}
            cy={58}
            r={50}
            stroke={d.injectionOverdue ? colors.coralText : colors.greenText}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0.02, frac) * ring} ${ring}`}
            transform="rotate(-90 58 58)"
          />
          <SvgText x={58} y={58} textAnchor="middle" fontFamily={fonts.bold} fontSize={28} fill={colors.ink}>
            {d.injectedToday ? '✓' : `${days} d`}
          </SvgText>
          <SvgText x={58} y={78} textAnchor="middle" fontFamily={fonts.regular} fontSize={11} fill={colors.secondary}>
            {d.injectedToday ? t('home.injDone') : t('layout.treatment.toNext')}
          </SvgText>
        </Svg>
        <View style={{ flex: 1, gap: 4 }}>
          <T v="small" color={colors.secondary} style={label}>
            {t('sum.injection').toUpperCase()}
          </T>
          <T v="h2">
            {next
              ? `${next.toLocaleDateString('es-ES', { weekday: 'long' })} · ${next.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
              : '—'}
          </T>
          {d.lastInjection && (
            <T v="small" color={colors.secondary}>
              {t('layout.treatment.last', { site: t(`site.${d.lastInjection.site}`).toLowerCase(), dose: fmtDose(d.lastInjection.dose) })}
            </T>
          )}
          <Button style={{ minHeight: 40, marginTop: 4 }} label={t('layout.treatment.log')} onPress={() => go('log', 'injection')} />
        </View>
      </View>

      <View style={box}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2" style={{ fontSize: 16 }}>
            {t('layout.treatment.calendar')}
          </T>
          <T v="small" color={colors.secondary}>
            {t('layout.treatment.weeks', { a: weeks.filter((w) => w !== null).length, b: 12 })}
          </T>
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {weeks.map((w, i) => (
            <View
              key={i}
              accessible
              accessibilityLabel={w === null ? t('layout.treatment.gap') : `${fmtDose(w)} mg`}
              style={{
                width: '14.7%',
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: w === null ? (isDark ? 'rgba(255,122,182,0.16)' : '#FDE3E8') : isDark ? 'rgba(124,108,255,0.25)' : '#E2DAFB',
              }}
            >
              <T v="small" style={{ fontFamily: fonts.semibold, fontSize: 11 }} color={w === null ? colors.coralText : colors.greenText}>
                {w === null ? '—' : fmtDose(w)}
              </T>
            </View>
          ))}
        </View>
      </View>

      <View style={box}>
        <T v="h2" style={{ fontSize: 16 }}>
          {t('layout.treatment.byDose')}
        </T>
        {byDose.map((x) => (
          <Row key={x.dose} gap={10}>
            <T v="small" color={colors.secondary} style={{ width: 58 }}>
              {fmtDose(x.dose)} mg
            </T>
            <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ECE7F8' }}>
              <View
                style={{ width: `${Math.max(4, Math.min(100, (-x.delta / maxLoss) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: colors.greenText }}
              />
            </View>
            <T v="label" style={{ width: 70, textAlign: 'right', fontFamily: fonts.semibold }}>
              {x.delta <= 0 ? '−' : '+'}
              {f1(Math.abs(x.delta))} kg
            </T>
          </Row>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip text={t('layout.treatment.effects', { n: effectWeeks })} />
          <Chip text={t('layout.treatment.nextSite', { site: t(`site.${d.suggestedSite}`).toLowerCase() })} />
        </View>
      </View>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.cream }}>
      <T v="small">{text}</T>
    </View>
  );
}

// ---------------------------------------------------------------- B · Índice del día
export function ScoreLayout({ onOpenScore }: { onOpenScore: () => void }) {
  const { state } = useStore();
  const sc = towigoScore(state);
  const hist = scoreHistory(state, 8);
  const delta = sc.value - hist[0];
  const [c1] = BAND_COLOR[sc.band];
  const top = [...sc.areas].sort((a, b) => b.weight - a.weight).slice(0, 3);
  const best = [...sc.areas].sort((a, b) => b.score * b.weight - a.score * a.weight)[0];
  const worst = [...sc.areas].sort((a, b) => a.score - b.score)[0];
  const last7 = hist.slice(1);
  const max = Math.max(...last7, 1);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 4 }}>
        <ScoreGauge score={sc} size={210} onPress={onOpenScore} />
        <T v="title" color={c1}>
          {t(`score.band.${sc.band}`)}
        </T>
        <T v="small" color={colors.secondary}>
          {delta >= 0 ? `+${delta}` : `−${-delta}`} {t('score.vsWeek')}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {top.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={`${t(`score.area.${a.id}`)}: ${a.score}`}
            onPress={onOpenScore}
            style={[box, { flex: 1, padding: 12, gap: 6, borderRadius: 18 }]}
          >
            <T v="small" color={colors.secondary} style={label} numberOfLines={1}>
              {t(`score.area.${a.id}`).toUpperCase()}
            </T>
            <T v="h2" style={{ fontSize: 22 }}>
              {a.score}
            </T>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ECE7F8' }}>
              <View style={{ width: `${Math.max(4, a.score)}%`, height: 5, borderRadius: 3, backgroundColor: a.score >= 70 ? c1 : '#F5B95A' }} />
            </View>
          </Pressable>
        ))}
      </View>
      <View style={box}>
        <T v="h2" style={{ fontSize: 16 }}>
          {t('layout.score.counts')}
        </T>
        {best && (
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(61,224,200,0.15)' : '#DDF4EF',
              }}
            >
              <T v="small" color={good} style={{ fontFamily: fonts.bold }}>
                +
              </T>
            </View>
            <T v="small" style={{ flex: 1, fontSize: 14 }}>
              {t('layout.score.best', { area: t(`score.area.${best.id}`).toLowerCase(), n: best.score })}
            </T>
          </Row>
        )}
        {worst && worst.id !== best?.id && (
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(245,185,90,0.15)' : '#FCEFD9',
              }}
            >
              <T v="small" color="#B7791F" style={{ fontFamily: fonts.bold }}>
                !
              </T>
            </View>
            <T v="small" style={{ flex: 1, fontSize: 14 }}>
              {t('layout.score.worst', { area: t(`score.area.${worst.id}`).toLowerCase(), n: worst.score })}
            </T>
          </Row>
        )}
        <Button
          kind="secondary"
          style={{ minHeight: 40, alignSelf: 'flex-start', paddingHorizontal: 16 }}
          label={t('layout.score.more')}
          onPress={onOpenScore}
        />
      </View>
      <View style={{ gap: 6 }}>
        <T v="small" color={colors.secondary} style={label}>
          {t('layout.score.last7').toUpperCase()}
        </T>
        <View
          style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 70 }}
          accessible
          accessibilityLabel={t('layout.score.last7a11y', { list: last7.join(', ') })}
        >
          {last7.map((v, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(8, (v / max) * 100)}%`,
                borderRadius: 6,
                backgroundColor: i === last7.length - 1 ? c1 : isDark ? 'rgba(124,108,255,0.45)' : '#CFC4F7',
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- C · Programa diario
const LESSONS = 8;
const readLessons = new Set<string>();

export function ProgramLayout() {
  const { state, d } = useStore();
  const { go } = useNav();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const today = dayKey(Date.now());
  const lesson = (Math.floor(Date.now() / 864e5) % LESSONS) + 1;
  const read = readLessons.has(`${today}|${lesson}`);
  const total = usesGlp1(state.profile) ? 16 : 12;
  const week = Math.min(d.treatmentWeek, total);
  const phase = week <= 4 ? 1 : week <= 8 ? 2 : week <= 12 ? 3 : 4;
  const weighed = state.weights.some((w) => isToday(w.at));
  const strength = state.strength.some((x) => isToday(x.at));
  const tasks: { done: boolean; text: string; meta: string; onPress: () => void }[] = [
    { done: weighed, text: t('layout.program.weigh'), meta: d.weightNow !== null ? `${f1(d.weightNow)} kg` : '', onPress: () => go('log', 'weight') },
    { done: !!d.checkinToday, text: t('checkin.pill'), meta: d.checkinToday ? t(`checkin.v${d.checkinToday.v}`) : '', onPress: () => go('progress') },
    {
      done: d.proteinToday >= state.goals.proteinG,
      text: t('layout.program.protein', { g: state.goals.proteinG }),
      meta: `${d.proteinToday} / ${state.goals.proteinG} g`,
      onPress: () => go('log', 'intake'),
    },
    { done: strength, text: t('layout.program.strength'), meta: t('layout.program.strengthMeta'), onPress: () => go('log', 'strength') },
    { done: read, text: t('layout.program.lesson'), meta: t('layout.program.min'), onPress: () => setOpen(true) },
  ];
  const team = [...state.messages].filter((m) => m.from !== 'patient' && m.from !== 'owi').sort((a, b) => b.at.localeCompare(a.at))[0];
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="small" color={colors.secondary} style={label}>
            {t('layout.program.week', { n: week, total }).toUpperCase()}
          </T>
          <T v="small" color={colors.secondary}>
            {t(`layout.program.phase${phase}`)}
          </T>
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E4DFF3' }}>
          <View style={{ width: `${Math.round((week / total) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: colors.greenText }} />
        </View>
      </View>
      <View style={{ borderRadius: 22, backgroundColor: colors.greenText, padding: 18, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="small" color={colors.onAccent} style={[label, { opacity: 0.9 }]}>
            {t('layout.program.today').toUpperCase()}
          </T>
          {!read && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)' }}>
              <T v="small" color={colors.onAccent} style={{ fontSize: 11, fontFamily: fonts.semibold }}>
                {t('layout.program.new')}
              </T>
            </View>
          )}
        </Row>
        <T v="h2" color={colors.onAccent} style={{ fontSize: 20, lineHeight: 26 }}>
          {t(`lesson.${lesson}.title`)}
        </T>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            height: 40,
            paddingHorizontal: 18,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <T v="label" color={isDark ? '#0A0F1E' : colors.greenText}>
            {read ? t('layout.program.again') : t('layout.program.start')}
          </T>
        </Pressable>
      </View>
      <View style={[box, { paddingVertical: 4, gap: 0 }]}>
        {tasks.map((x, i) => (
          <Pressable
            key={i}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: x.done }}
            accessibilityLabel={x.text}
            onPress={x.onPress}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 11,
              borderBottomWidth: i < tasks.length - 1 ? 1 : 0,
              borderBottomColor: border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: x.done ? colors.greenText : 'transparent',
                borderWidth: x.done ? 0 : 2,
                borderColor: colors.borderStrong,
              }}
            >
              {x.done && <Icon name="check" size={14} color={colors.onAccent} stroke={3} />}
            </View>
            <T style={{ flex: 1, fontSize: 15, textDecorationLine: x.done ? 'line-through' : 'none' }} color={x.done ? colors.secondary : colors.ink}>
              {x.text}
            </T>
            <T v="small" color={colors.secondary}>
              {x.meta}
            </T>
          </Pressable>
        ))}
      </View>
      {team && (
        <Pressable accessibilityRole="button" onPress={() => go('team')} style={[box, { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }]}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="steth" size={18} color={colors.greenText} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold }}>
              {t('layout.program.fromTeam')}
            </T>
            <T numberOfLines={3} style={{ fontSize: 14 }}>
              {team.text ? t(team.text) : t('layout.program.audio', { s: team.durationSec ?? 0 })}
            </T>
          </View>
        </Pressable>
      )}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(6,10,22,0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View
            accessibilityViewIsModal
            style={{
              width: '100%',
              maxWidth: 460,
              maxHeight: '90%',
              backgroundColor: colors.white,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Row gap={10}>
                <OwiSticker mood="happy" size={44} />
                <View style={{ flex: 1 }}>
                  <T v="small" color={colors.secondary} style={label}>
                    {t('layout.program.today').toUpperCase()}
                  </T>
                  <T v="h2">{t(`lesson.${lesson}.title`)}</T>
                </View>
              </Row>
              {[1, 2, 3].map((p) => (
                <T key={p} style={{ fontSize: 15, lineHeight: 23 }}>
                  {t(`lesson.${lesson}.p${p}`)}
                </T>
              ))}
              <T v="small" color={colors.secondary}>
                {t('layout.program.note')}
              </T>
              <Button
                label={t('layout.program.done')}
                onPress={() => {
                  readLessons.add(`${today}|${lesson}`);
                  force((x) => x + 1);
                  setOpen(false);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------- D · Diario
export function DiaryLayout() {
  const { state, d } = useStore();
  const { go } = useNav();
  const goal = state.goals.proteinG;
  const left = Math.max(0, goal - d.proteinToday);
  const carbs = state.carbs.filter((c) => isToday(c.at)).sort((a, b) => a.at.localeCompare(b.at));
  const meal = (h: number) => (h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 19 ? 'snack' : 'dinner');
  const effects = state.sideEffects.filter((e) => isToday(e.at)).flatMap((e) => e.symptoms);
  const worst = effects.sort((a, b) => b.level - a.level)[0];
  return (
    <View style={{ gap: 12 }}>
      <View style={box}>
        <T v="small" color={colors.secondary} style={label}>
          {t('layout.diary.left').toUpperCase()}
        </T>
        <Row style={{ justifyContent: 'space-between' }}>
          <Num v={`${goal}`} l={t('layout.diary.goal')} />
          <T v="h2" color={colors.secondary}>
            −
          </T>
          <Num v={`${d.proteinToday}`} l={t('layout.diary.eaten')} />
          <T v="h2" color={colors.secondary}>
            =
          </T>
          <Num v={`${left} g`} l={t('layout.diary.remaining')} accent />
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ECE7F8' }}>
          <View
            style={{ width: `${Math.min(100, Math.round((d.proteinToday / goal) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: colors.greenText }}
          />
        </View>
        <Row gap={8}>
          <Mini v={`${f1(d.waterToday / 4)} L`} l={t('layout.diary.water')} />
          <Mini
            v={isT1(state.profile) ? `${d.carbsToday} g` : `${STEPS_TODAY.toLocaleString('es-ES')}`}
            l={isT1(state.profile) ? t('sum.carbs') : t('rings.move')}
          />
          <Mini v={worst ? t(`layout.diary.level${worst.level}`) : t('layout.diary.none')} l={worst ? t(`sym.${worst.id}`) : t('layout.diary.effects')} />
        </Row>
      </View>
      <View style={[box, { padding: 0, gap: 0, overflow: 'hidden' }]}>
        {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((m, i) => {
          const items = carbs.filter((c) => meal(new Date(c.at).getHours()) === m);
          return (
            <View key={m} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: border }}>
              <Row style={{ justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }}>
                <T v="label" style={{ fontFamily: fonts.semibold }}>
                  {t(`layout.diary.${m}`)}
                </T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('layout.diary.add')} · ${t(`layout.diary.${m}`)}`}
                  onPress={() => go('log', isT1(state.profile) ? 'carbs' : 'intake')}
                  hitSlop={8}
                >
                  <T v="label" color={colors.greenText}>
                    + {t('layout.diary.add')}
                  </T>
                </Pressable>
              </Row>
              {items.map((c) => (
                <Row key={c.id} style={{ justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 }}>
                  <T v="small" style={{ fontSize: 14 }}>
                    {c.label ?? t('layout.diary.meal')} · {hhmm(c.at)}
                  </T>
                  <T v="small" color={colors.secondary}>
                    {c.g} g HC{c.protein ? ` · ${c.protein} g prot.` : ''}
                  </T>
                </Row>
              ))}
            </View>
          );
        })}
      </View>
      <Row gap={8}>
        <Button
          style={{ flex: 1, minHeight: 44 }}
          label={t('layout.diary.photo')}
          icon={<Icon name="camera" size={18} color={colors.onAccent} />}
          onPress={() => go('log', isT1(state.profile) ? 'carbs' : 'intake')}
        />
        <Button style={{ flex: 1, minHeight: 44 }} kind="secondary" label={t('layout.diary.write')} onPress={() => go('owi')} />
      </Row>
    </View>
  );
}

function Num({ v, l, accent }: { v: string; l: string; accent?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <T v="h2" color={accent ? colors.greenText : colors.ink} style={{ fontSize: accent ? 22 : 20 }}>
        {v}
      </T>
      <T v="small" color={colors.secondary} style={{ fontSize: 11 }}>
        {l}
      </T>
    </View>
  );
}
function Mini({ v, l }: { v: string; l: string }) {
  return (
    <View style={{ flex: 1, padding: 8, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.cream, alignItems: 'center' }}>
      <T v="label" style={{ fontFamily: fonts.semibold }}>
        {v}
      </T>
      <T v="small" color={colors.secondary} style={{ fontSize: 11 }} center numberOfLines={1}>
        {l}
      </T>
    </View>
  );
}

// ---------------------------------------------------------------- E · Línea del día
type Ev = { at: string; icon: IconName; kicker: string; text: string; tone?: 'people' | 'team' | 'owi'; onPress?: () => void };

export function TimelineLayout({ owiMessage }: { owiMessage: string }) {
  const { state, d } = useStore();
  const { go } = useNav();
  const ev: Ev[] = [];
  for (const w of state.weights.filter((x) => isToday(x.at)))
    ev.push({ at: w.at, icon: 'scale', kicker: t('sum.weight'), text: `${f1(w.kg)} kg`, onPress: () => go('progress') });
  for (const x of state.injections.filter((y) => isToday(y.at)))
    ev.push({
      at: x.at,
      icon: 'syringe',
      kicker: t('layout.timeline.injection'),
      text: `${String(x.dose).replace('.', ',')} mg · ${t(`site.${x.site}`).toLowerCase()}`,
    });
  for (const g of state.glucose.filter((y) => isToday(y.at) && y.context !== 'sensor'))
    ev.push({ at: g.at, icon: 'drop', kicker: t('sum.glucose'), text: `${g.v} mg/dL · ${t(`ctx.${g.context}`)}` });
  for (const x of state.insulin.filter((y) => isToday(y.at)))
    ev.push({
      at: x.at,
      icon: 'syringe',
      kicker: t(x.kind === 'basal' ? 'layout.timeline.basal' : 'layout.timeline.rapid'),
      text: `${String(x.units).replace('.', ',')} u`,
    });
  for (const x of state.carbs.filter((y) => isToday(y.at)))
    ev.push({ at: x.at, icon: 'meal', kicker: t('layout.timeline.meal'), text: `${x.label ?? t('layout.diary.meal')} · ${x.g} g HC` });
  for (const x of state.sideEffects.filter((y) => isToday(y.at)))
    ev.push({
      at: x.at,
      icon: 'alert',
      kicker: t('layout.timeline.feel'),
      text: x.symptoms.map((s) => `${t(`sym.${s.id}`)} (${t(`layout.diary.level${s.level}`).toLowerCase()})`).join(', '),
    });
  for (const x of state.strength.filter((y) => isToday(y.at)))
    ev.push({ at: x.at, icon: 'dumbbell', kicker: t('layout.timeline.strength'), text: t('layout.timeline.strengthDone') });
  for (const c of state.cheers.filter((y) => isToday(y.at)))
    ev.push({ at: c.at, icon: 'heart', kicker: t('layout.timeline.people', { who: state.crew.find((m) => m.id === c.from)?.name ?? t('crew.someone') }), text: c.text, tone: 'people' });
  for (const m of state.messages.filter((y) => isToday(y.at) && y.from !== 'patient' && y.from !== 'owi'))
    ev.push({
      at: m.at,
      icon: m.kind === 'audio' ? 'headphones' : 'chat',
      kicker: t('layout.timeline.team'),
      text: m.text ? t(m.text) : t('layout.program.audio', { s: m.durationSec ?? 0 }),
      tone: 'team',
      onPress: () => go('team'),
    });
  ev.sort((a, b) => a.at.localeCompare(b.at));
  const toneBg = (x?: Ev['tone']) =>
    x === 'people'
      ? isDark
        ? 'rgba(255,154,107,0.12)'
        : '#FFF6F1'
      : x === 'team'
        ? isDark
          ? 'rgba(61,224,200,0.08)'
          : '#F0FBF8'
        : x === 'owi'
          ? isDark
            ? 'rgba(124,108,255,0.14)'
            : '#EFEAFE'
          : panelBg;
  return (
    <View style={{ gap: 10 }}>
      {ev.length === 0 && (
        <T color={colors.secondary} center>
          {t('layout.timeline.empty')}
        </T>
      )}
      {[
        ...ev,
        {
          at: new Date().toISOString(),
          icon: 'smile' as IconName,
          kicker: t('layout.timeline.owi', { owi: state.pet.name }),
          text: owiMessage,
          tone: 'owi' as const,
        },
      ].map((e, i) => (
        <Row key={i} gap={12} style={{ alignItems: 'flex-start' }}>
          <T v="small" color={colors.secondary} style={{ width: 44, textAlign: 'right', paddingTop: 12 }}>
            {e.tone === 'owi' ? t('layout.timeline.now') : hhmm(e.at)}
          </T>
          <Pressable
            accessibilityRole={e.onPress ? 'button' : 'text'}
            onPress={e.onPress}
            style={{
              flex: 1,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              backgroundColor: toneBg(e.tone),
              borderWidth: 1,
              borderColor: border,
              borderRadius: 16,
              padding: 12,
            }}
          >
            {e.tone === 'owi' ? <OwiSticker mood={d.petMood} size={30} /> : <Icon name={e.icon} size={18} color={colors.greenText} />}
            <View style={{ flex: 1 }}>
              <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, fontSize: 12 }}>
                {e.kicker}
              </T>
              <T style={{ fontSize: 15 }}>{e.text}</T>
            </View>
          </Pressable>
        </Row>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('layout.timeline.compose')}
        onPress={() => go('owi')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 48,
          borderRadius: 24,
          paddingLeft: 16,
          paddingRight: 4,
          backgroundColor: panelBg,
          borderWidth: 1,
          borderColor: border,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <T color={colors.secondary} style={{ flex: 1, fontSize: 14 }}>
          {t('layout.timeline.compose')}
        </T>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenText, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="mic" size={18} color={colors.onAccent} />
        </View>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------- F · Resumen en tarjetas
export function SummaryLayout({ onOpenScore }: { onOpenScore: () => void }) {
  const { state, d } = useStore();
  const { go } = useNav();
  const sc = towigoScore(state);
  const hist = scoreHistory(state, 8);
  const [w, setW] = useState(300);
  const ws = [...state.weights]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-12)
    .map((x) => x.kg);
  const glp1 = usesGlp1(state.profile) && !d.maintenance && d.nextInjectionAt;
  const g = d.lastGlucose;
  const lastMood = [...state.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  return (
    <View style={{ gap: 12 }}>
      <Tile title={t('score.title')} color={BAND_COLOR[sc.band][0]} right={t('layout.summary.today')} onPress={onOpenScore}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <T>
            <T v="display" style={{ fontSize: 28 }}>
              {sc.value}
            </T>
            <T v="small" color={colors.secondary}>
              {' '}
              /100 · {t(`score.band.${sc.band}`)}
            </T>
          </T>
          <Sparkline values={hist} color={BAND_COLOR[sc.band][0]} width={90} height={30} fill={false} />
        </Row>
      </Tile>
      {glp1 ? (
        <Tile
          title={t('sum.injection')}
          color={colors.blue}
          right={d.lastInjection ? `${String(d.lastInjection.dose).replace('.', ',')} mg` : ''}
          onPress={() => go('log', 'injection')}
        >
          <T>
            <T v="display" style={{ fontSize: 28 }}>
              {d.injectedToday ? '✓' : `${d.daysToInjection ?? 0}`}
            </T>
            <T v="small" color={colors.secondary}>
              {' '}
              {d.injectedToday
                ? t('sum.injDone')
                : `${t('layout.summary.days')} · ${new Date(d.nextInjectionAt!).toLocaleDateString('es-ES', { weekday: 'long' })}`}
            </T>
          </T>
        </Tile>
      ) : g && (isT1(state.profile) || hasDiabetes(state.profile)) ? (
        <Tile title={t('sum.glucose')} color={colors.coralText} right={hhmm(g.at)} onPress={() => go('progress')}>
          <T>
            <T v="display" style={{ fontSize: 28 }}>
              {g.v}
            </T>
            <T v="small" color={colors.secondary}>
              {' '}
              mg/dL{isT1(state.profile) ? ` · ${t('home.tirShort').toLowerCase()} ${d.tir24} %` : ''}
            </T>
          </T>
        </Tile>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <HalfTile
          title={t('sum.weight')}
          color={isDark ? '#A58FFF' : '#6A4FE0'}
          value={d.weightNow !== null ? f1(d.weightNow) : '—'}
          unit="kg"
          sub={d.lostKg > 0 ? t('sum.lost', { kg: f1(d.lostKg) }) : ''}
          onPress={() => go('progress')}
        />
        <HalfTile
          title={t('rings.food')}
          color="#D9542F"
          value={`${d.proteinToday}`}
          unit={`/ ${state.goals.proteinG} g`}
          bar={d.proteinToday / state.goals.proteinG}
          onPress={() => go('log', 'intake')}
        />
        <HalfTile
          title={t('layout.summary.steps')}
          color={good}
          value={STEPS_TODAY.toLocaleString('es-ES')}
          unit=""
          sub={t('layout.summary.stepsGoal', { n: STEPS_GOAL.toLocaleString('es-ES') })}
          onPress={() => go('progress')}
        />
        <HalfTile
          title={t('layout.summary.mood')}
          color="#C2417F"
          value={lastMood ? t(`checkin.v${lastMood.v}`) : '—'}
          unit=""
          sub=""
          onPress={() => go('progress')}
          face={lastMood?.v}
        />
      </View>
      {ws.length > 2 && (
        <View style={box} onLayout={(e) => setW(e.nativeEvent.layout.width - 32)}>
          <T v="small" color={isDark ? '#A58FFF' : '#6A4FE0'} style={{ fontFamily: fonts.semibold }}>
            {t('layout.summary.highlight')}
          </T>
          <T v="label" style={{ fontFamily: fonts.semibold }}>
            {d.lostKg > 0 ? t('layout.summary.lost', { kg: f1(d.lostKg), m: d.musclePct !== null ? f1(d.musclePct) : '—' }) : t('layout.summary.stable')}
          </T>
          <Sparkline values={ws} color={isDark ? '#A58FFF' : '#6A4FE0'} width={Math.max(120, w)} height={54} />
        </View>
      )}
    </View>
  );
}

function Tile({ title, color, right, onPress, children }: { title: string; color: string; right?: string; onPress?: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [box, { borderRadius: 18, padding: 14, gap: 4, opacity: pressed ? 0.8 : 1 }]}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="small" color={color} style={{ fontFamily: fonts.semibold, fontSize: 13 }}>
          {title}
        </T>
        {!!right && (
          <T v="small" color={colors.secondary}>
            {right}
          </T>
        )}
      </Row>
      {children}
    </Pressable>
  );
}
function HalfTile({
  title,
  color,
  value,
  unit,
  sub,
  bar,
  onPress,
  face,
}: {
  title: string;
  color: string;
  value: string;
  unit: string;
  sub?: string;
  bar?: number;
  onPress: () => void;
  face?: 1 | 2 | 3 | 4 | 5;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value} ${unit}`}
      onPress={onPress}
      style={({ pressed }) => [box, { flexBasis: '46%', flexGrow: 1, borderRadius: 18, padding: 14, gap: 4, opacity: pressed ? 0.8 : 1 }]}
    >
      <T v="small" color={color} style={{ fontFamily: fonts.semibold, fontSize: 13 }}>
        {title}
      </T>
      <Row gap={6} style={{ alignItems: 'center' }}>
        {face && <MoodFace v={face} size={30} />}
        <T>
          <T v="h2" style={{ fontSize: 22 }}>
            {value}
          </T>
          {!!unit && (
            <T v="small" color={colors.secondary}>
              {' '}
              {unit}
            </T>
          )}
        </T>
      </Row>
      {bar !== undefined && (
        <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F6E3DA' }}>
          <View style={{ width: `${Math.max(3, Math.min(100, bar * 100))}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
        </View>
      )}
      {!!sub && (
        <T v="small" color={colors.secondary} style={{ fontSize: 12 }}>
          {sub}
        </T>
      )}
    </Pressable>
  );
}
