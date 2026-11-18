/**
 * Hoy — panel de datos del día.
 * Arriba, los anillos del día y la cifra clave de cada perfil (glucosa, próxima inyección o peso).
 * Owi queda como asistente discreto: una tarjeta con su frase basada en tus datos y acciones rápidas.
 * Debajo: lo que toca hoy y el resumen.
 * Fase 1 (§8.2): datos, tendencias, hábitos y comunicación. Nunca indicaciones clínicas automáticas.
 */
import { useEffect, useState } from 'react';
import { DiaryLayout, LayoutButton, ThemeButton, ProgramLayout, ScoreLayout, SummaryLayout, TimelineLayout, TreatmentLayout } from './home/layouts';
import { PulseLayout } from './home/pulse';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarBadge from '../components/AvatarBadge';
import { CheckinModal, CheckinPill } from '../components/checkin';
import { ScoreGauge, ScoreSheet } from '../components/score';
import { usePresenter } from '../demo/Presenter';
import { towigoScore } from '../state/score';
import { CheerCard } from '../components/crew';
import { Icon } from '../components/icons';
import { KpiGrid, Sparkline } from '../components/kpi';
import { DrillGroup, DrillRow, Sheet } from '../components/sheet';
import { weeklyKpis } from '../state/kpis';
import { Burst, FadeIn, Pop } from '../components/motion';
import OwiSticker from '../components/OwiSticker';
import { MaintenanceCard, SupportCard } from '../components/program';
import { RING, useDayRings } from '../components/rings';
import { agoText, glucoseColor, T1Card, TREND_ARROW } from '../components/t1';
import { SummaryGrid, TodayList } from '../components/today';
import { Button, Row, T } from '../components/ui';
import { STEPS_TODAY } from '../data/mock';
import { owiLine } from '../owi/voice';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { hasDiabetes, isT1, usesGlp1 } from '../state/types';
import { colors, fonts, isDark } from '../theme';

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'home.night' : h < 13 ? 'home.morning' : h < 21 ? 'home.afternoon' : 'home.night';
}

/** Frase de Owi: el aviso del plan si lo hay; si no, la "voz" del día con tus datos (src/owi/voice.ts). */
function useOwiLine(poke: number) {
  const { state, d } = useStore();
  const name = state.userName || t('common.friend');
  const reminder = d.petMood === 'remind' || d.petMood === 'sport' ? d.reminders[0] : null;
  const message = reminder ? t(reminder.text, { ...reminder.vars, name }) : owiLine(state, d, poke).text;
  return { message, reminder };
}

function Stat({ color, label, value, onPress }: { color: string; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 2, opacity: pressed ? 0.6 : 1 })}
    >
      <Row gap={6}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, letterSpacing: 0.4, fontSize: 11 }}>
          {label.toUpperCase()}
        </T>
      </Row>
      <T v="label">{value}</T>
    </Pressable>
  );
}

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');

/** La cifra que más importa hoy según el perfil. */
function useKeyMetric() {
  const { state, d } = useStore();
  const g = d.lastGlucose;
  const ago = g ? Math.round((Date.now() - new Date(g.at).getTime()) / 60e3) : 0;
  const sensor24 = state.glucose
    .filter((x) => Date.now() - new Date(x.at).getTime() < 24 * 3600e3)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((x) => x.v);
  const wSeries = [...state.weights]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-12)
    .map((w) => w.kg);
  const weight =
    d.weightNow !== null
      ? { label: t('sum.weight'), value: fmt1(d.weightNow), unit: 'kg', sub: d.lostKg > 0 ? t('sum.lost', { kg: fmt1(d.lostKg) }) : '' }
      : null;
  if (isT1(state.profile) && g)
    return {
      main: {
        label: t('home.glucoseNow'),
        value: String(g.v),
        unit: 'mg/dL',
        arrow: d.trend ? TREND_ARROW[d.trend] : '',
        color: ago > 60 ? colors.secondary : glucoseColor(g.v),
        sub: ago > 60 ? `${t('home.stale')} · ${agoText(ago)}` : agoText(ago),
      },
      series: sensor24,
      seriesLabel: t('home.spark24'),
      side: { label: t('home.tirShort'), value: sensor24.length ? `${d.tir24}` : '—', unit: sensor24.length ? '%' : '', sub: t('home.tir24') },
    };
  if (usesGlp1(state.profile) && !d.maintenance && d.nextInjectionAt) {
    const when = new Date(d.nextInjectionAt);
    return {
      main: {
        label: t('sum.injection'),
        value: d.injectedToday ? t('home.injDone') : d.daysToInjection === 0 ? t('sum.today') : t('home.inDays', { n: d.daysToInjection ?? 0 }),
        unit: '',
        arrow: '',
        color: d.injectionOverdue ? colors.coralText : colors.ink,
        sub: d.injectedToday
          ? t('sum.injDone')
          : `${when.toLocaleDateString('es-ES', { weekday: 'long' })} · ${when.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      },
      side: weight,
      series: wSeries,
      seriesLabel: t('home.sparkWeight'),
    };
  }
  if (hasDiabetes(state.profile) && g)
    return {
      main: { label: t('sum.glucose'), value: String(g.v), unit: 'mg/dL', arrow: '', color: glucoseColor(g.v), sub: t(`ctx.${g.context}`) },
      side: weight,
      series: wSeries,
      seriesLabel: t('home.sparkWeight'),
    };
  return { main: weight ? { ...weight, arrow: '', color: colors.ink } : null, side: null, series: wSeries, seriesLabel: t('home.sparkWeight') };
}

export default function Home() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const insets = useSafeAreaInsets();
  const [poke, setPoke] = useState(0);
  const name = state.userName || t('common.friend');
  const rings = useDayRings();
  const owi = useOwiLine(poke);
  const reminder = owi.reminder;
  const message = !reminder && rings.plan >= 1 && rings.move >= 1 && rings.food >= 1 && !poke ? t('owi.ringsDone') : owi.message;
  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');
  const [burst, setBurst] = useState(0);
  const allRings = rings.plan >= 1 && rings.move >= 1 && rings.food >= 1;
  const km = useKeyMetric();
  const presenter = usePresenter();
  const score = towigoScore(state);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  // Check-in del día: ventana al entrar (una vez al día y nunca durante la presentación).
  useEffect(() => {
    if (presenter.active || d.checkinToday || state.checkinPromptedOn === state.day) return;
    const id = setTimeout(() => {
      setCheckinOpen(true);
      dispatch({ type: 'checkinPrompted', day: state.day });
    }, 700);
    return () => clearTimeout(id);
  }, [state.day]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sparkW, setSparkW] = useState(300);
  const layout = state.homeLayout ?? 'panel';
  const [more, setMore] = useState<null | 'week' | 'today' | 'rings' | 'glucose' | 'summary' | 'cheer'>(null);
  const wk = weeklyKpis(state);
  const weekValue = wk.filter((k) => k.good === true).length
    ? t('home.more.weekValue', { n: wk.filter((k) => k.good === true).length })
    : t('home.more.weekNone');

  // Tres anillos completos: confeti discreto una vez al día.
  useEffect(() => {
    if (allRings && state.ringsDoneOn !== state.day) {
      dispatch({ type: 'ringsDone', day: state.day });
      setBurst((x) => x + 1);
    }
  }, [allRings, state.ringsDoneOn, state.day]); // eslint-disable-line react-hooks/exhaustive-deps
  // El nivel de Owi se actualiza sin interrumpir (se ve en Yo → Owi).
  useEffect(() => {
    if (state.petLevelSeen !== d.petLevel) dispatch({ type: 'seenLevel', level: d.petLevel });
  }, [d.petLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  const panel = isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.82)';
  const border = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)';
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={isDark ? ['#141A3A', colors.cream] : ['#E9E3FF', colors.cream]} style={{ paddingTop: insets.top + 12, paddingBottom: 6 }}>
          <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, gap: 14 }}>
            {/* Cabecera */}
            <View style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="small" color={colors.secondary} style={{ fontFamily: fonts.medium, letterSpacing: 0.6, fontSize: 11, flex: 1 }} numberOfLines={1}>
                  {rawDate.toUpperCase()}
                </T>
                <Row gap={6}>
                  <ThemeButton />
                  <LayoutButton />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('home.streakA11y', { n: d.streak })}
                    onPress={() => go('progress')}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: panel,
                      borderWidth: 1,
                      borderColor: border,
                      paddingHorizontal: 10,
                      height: 34,
                      borderRadius: 17,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Icon name="flame" size={16} color={colors.coralDark} />
                    <T v="label">{d.streak}</T>
                  </Pressable>
                  <AvatarBadge avatar={d.owiAvatar} size={36} onPress={() => go('me')} label={t('avatar.you', { name })} />
                </Row>
              </Row>
              <T v="title" style={{ fontSize: 24, lineHeight: 30 }}>
                {t(greeting(), { name })}
              </T>
            </View>

            {/* Panel del día: índice + cifra clave (diseño por defecto) */}
            {layout === 'panel' && (
              <FadeIn>
                <View style={{ backgroundColor: panel, borderWidth: 1, borderColor: border, borderRadius: 24, padding: 16, gap: 14 }}>
                  <Row gap={16}>
                    <ScoreGauge score={score} onPress={() => setScoreOpen(true)} />
                    <View style={{ flex: 1, gap: 10 }}>
                      {km.main && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${km.main.label}: ${km.main.value} ${km.main.unit}`}
                          onPress={() =>
                            go(
                              isT1(state.profile) ? 'progress' : usesGlp1(state.profile) ? 'log' : 'progress',
                              usesGlp1(state.profile) && !isT1(state.profile) ? 'injection' : undefined,
                            )
                          }
                        >
                          <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6 }}>
                            {km.main.label.toUpperCase()}
                          </T>
                          <Row gap={6} style={{ alignItems: 'flex-end' }}>
                            <T v="display" color={km.main.color} style={{ fontSize: 34, lineHeight: 40 }}>
                              {km.main.value}
                            </T>
                            {!!km.main.arrow && (
                              <T v="h2" color={km.main.color} style={{ paddingBottom: 5 }}>
                                {km.main.arrow}
                              </T>
                            )}
                            {!!km.main.unit && (
                              <T v="small" color={colors.secondary} style={{ paddingBottom: 7 }}>
                                {km.main.unit}
                              </T>
                            )}
                          </Row>
                          {!!km.main.sub && (
                            <T v="small" color={colors.secondary}>
                              {km.main.sub}
                            </T>
                          )}
                        </Pressable>
                      )}
                      {km.side && (
                        <Row gap={8} style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: border }}>
                          <T v="small" color={colors.secondary} style={{ flex: 1 }}>
                            {km.side.label}
                          </T>
                          <T v="label" style={{ fontFamily: fonts.semibold }}>
                            {km.side.value}
                            {km.side.unit ? ` ${km.side.unit}` : ''}
                          </T>
                        </Row>
                      )}
                    </View>
                  </Row>
                </View>
              </FadeIn>
            )}
            {layout !== 'panel' && (
              <FadeIn key={layout}>
                {layout === 'pulse' && <PulseLayout onOpenScore={() => setScoreOpen(true)} />}
                {layout === 'score' && <ScoreLayout onOpenScore={() => setScoreOpen(true)} />}
                {layout === 'treatment' && <TreatmentLayout />}
                {layout === 'program' && <ProgramLayout />}
                {layout === 'diary' && <DiaryLayout />}
                {layout === 'timeline' && <TimelineLayout owiMessage={message} />}
                {layout === 'summary' && <SummaryLayout onOpenScore={() => setScoreOpen(true)} />}
              </FadeIn>
            )}

            {/* Asistente: Owi en segundo plano, con su frase basada en tus datos */}
            {(layout !== 'timeline' || reminder) && (
              <View style={{ backgroundColor: panel, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 14, gap: 12 }}>
                <Row gap={12} style={{ alignItems: 'flex-start' }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('home.nextTip', { owi: state.pet.name })}
                    onPress={() => setPoke((p) => p + 1)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      backgroundColor: colors.softGreen,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <OwiSticker mood={d.petMood} size={50} />
                  </Pressable>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="small" color={colors.greenText} style={{ fontFamily: fonts.semibold, letterSpacing: 0.5, fontSize: 11 }}>
                      {t('home.assistant', { owi: state.pet.name }).toUpperCase()}
                    </T>
                    <Pop trigger={message}>
                      <T style={{ fontSize: 15, lineHeight: 21 }}>{message}</T>
                    </Pop>
                  </View>
                </Row>
                {reminder ? (
                  <Row gap={8}>
                    <Button
                      style={{ flex: 1, minHeight: 42 }}
                      label={t(`rem.done.${reminder.kind}`)}
                      onPress={() => {
                        dispatch({ type: 'reminderDone', id: reminder.id, kind: reminder.kind });
                        if (reminder.kind === 'injection') go('log', 'injection');
                        if (reminder.kind === 'weigh') go('log', 'weight');
                        if (reminder.kind === 'meal') go('log', 'intake');
                        if (reminder.kind === 'meds') go('log', 'meds');
                        if (reminder.kind === 'insulin') go('log', 'insulin');
                      }}
                    />
                    <Button
                      style={{ flex: 1, minHeight: 42 }}
                      kind="secondary"
                      label={t('rem.later')}
                      onPress={() => dispatch({ type: 'snooze', id: reminder.id, minutes: 15 })}
                    />
                  </Row>
                ) : (
                  <Row gap={8}>
                    <Button
                      style={{ flex: 1, minHeight: 42 }}
                      label={t('home.quickLog')}
                      onPress={() => go('log')}
                      icon={<Icon name="plus" size={18} color={colors.onAccent} />}
                    />
                    <Button
                      style={{ flex: 1, minHeight: 42 }}
                      kind="secondary"
                      label={t('home.ask')}
                      onPress={() => go('owi')}
                      icon={<Icon name="chat" size={18} color={colors.greenText} />}
                    />
                  </Row>
                )}
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, gap: 12, marginTop: 10 }}>
          {/* "Ahora": una sola cosa importante cada vez (apoyo > ánimo de tu gente > check-in). */}
          {d.supportReason ? (
            <SupportCard />
          ) : state.cheers.some((c) => !c.read) ? (
            <DrillGroup>
              <DrillRow
                icon="heart"
                title={t('home.cheerNew', { who: state.crew.find((m) => m.id === state.cheers.find((c) => !c.read)?.from)?.name ?? t('crew.someone') })}
                value={t('home.cheerOpen')}
                onPress={() => setMore('cheer')}
                last
              />
            </DrillGroup>
          ) : !d.checkinToday ? (
            <CheckinPill onPress={() => setCheckinOpen(true)} />
          ) : null}
          {d.maintenance && <MaintenanceCard />}
          {layout === 'panel' && (
            <DrillGroup>
              <DrillRow icon="trophy" title={t('home.more.week')} value={weekValue} onPress={() => setMore('week')} />
              <DrillRow
                icon="check"
                title={t('home.more.today')}
                value={t('layout.program.planValue', { a: rings.tasksDone, b: rings.tasksTotal })}
                onPress={() => setMore('today')}
              />
              <DrillRow
                icon="steps"
                title={t('home.more.rings')}
                value={`${STEPS_TODAY.toLocaleString('es-ES')} · ${d.proteinToday}/${state.goals.proteinG} g`}
                onPress={() => setMore('rings')}
              />
              {isT1(state.profile) && <DrillRow icon="drop" title={t('home.more.glucose')} value={`${d.tir24} %`} onPress={() => setMore('glucose')} />}
              <DrillRow icon="widget" title={t('home.more.summary')} value={t('home.more.summaryValue')} onPress={() => setMore('summary')} last />
            </DrillGroup>
          )}
        </View>
      </ScrollView>
      <Burst fire={burst} />
      <ScoreSheet open={scoreOpen} onClose={() => setScoreOpen(false)} />
      <Sheet open={more === 'week'} onClose={() => setMore(null)} title={t('home.more.week')} subtitle={t('home.weekSub')}>
        <KpiGrid />
      </Sheet>
      <Sheet open={more === 'today'} onClose={() => setMore(null)} title={t('home.more.today')}>
        <TodayList />
      </Sheet>
      <Sheet open={more === 'rings'} onClose={() => setMore(null)} title={t('home.more.rings')}>
        <View style={{ backgroundColor: panel, borderWidth: 1, borderColor: border, borderRadius: 22, padding: 16, gap: 14 }}>
          {km.series.length > 2 && (
            <View accessible accessibilityLabel={km.seriesLabel} onLayout={(e) => setSparkW(e.nativeEvent.layout.width)} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="small" color={colors.secondary} style={{ fontSize: 11, letterSpacing: 0.4, fontFamily: fonts.semibold }}>
                  {km.seriesLabel.toUpperCase()}
                </T>
                <T v="small" color={colors.secondary} style={{ fontSize: 11 }}>
                  {fmt1(Math.min(...km.series))}–{fmt1(Math.max(...km.series))}
                  {isT1(state.profile) ? ' mg/dL' : ' kg'}
                </T>
              </Row>
              <Sparkline
                values={km.series}
                color={isT1(state.profile) ? (isDark ? '#3DE0C8' : '#0FA394') : isDark ? '#A58FFF' : '#6A4FE0'}
                width={sparkW}
                height={44}
                band={isT1(state.profile) ? [70, 180] : undefined}
              />
            </View>
          )}
          <Row style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 12 }}>
            <Stat color={RING.plan} label={t('rings.plan')} value={`${rings.tasksDone}/${rings.tasksTotal}`} onPress={() => go('log')} />
            <Stat color={RING.move} label={t('rings.move')} value={STEPS_TODAY.toLocaleString('es-ES')} onPress={() => go('progress')} />
            <Stat color={RING.food} label={t('rings.food')} value={`${d.proteinToday}/${state.goals.proteinG} g`} onPress={() => go('log', 'intake')} />
          </Row>
        </View>
      </Sheet>
      <Sheet open={more === 'cheer'} onClose={() => setMore(null)} title={t('home.cheerTitle')}>
        <CheerCard />
      </Sheet>
      <Sheet open={more === 'glucose'} onClose={() => setMore(null)} title={t('home.more.glucose')}>
        <T1Card />
      </Sheet>
      <Sheet open={more === 'summary'} onClose={() => setMore(null)} title={t('home.more.summary')}>
        <SummaryGrid />
      </Sheet>
      <CheckinModal open={checkinOpen} onClose={() => setCheckinOpen(false)} />
    </View>
  );
}
