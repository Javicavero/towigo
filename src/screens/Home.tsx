/**
 * Pantalla "Hoy": cabecera con racha y vínculo, tu avatar y Owi juntos, el bocadillo de Owi
 * (emociones y avisos), la glucosa y los hábitos.
 * Fase 1 (§8.2): solo datos y tendencias, mensajes motivacionales y comunicación con el equipo.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BondCard from '../components/BondCard';
import GlucoseChart from '../components/GlucoseChart';
import { Icon, type IconName } from '../components/icons';
import { Bouncy, Burst, FadeIn, Pop, Pulse, useCountUp } from '../components/motion';
import Scene3D from '../components/Scene3D';
import SpeechBubble from '../components/SpeechBubble';
import TirRing from '../components/TirRing';
import { Button, Card, Choice, ProgressBar, Row, T } from '../components/ui';
import { DEFAULT_TARGET, FLAGS } from '../config';
import { STEPS_GOAL, STEPS_TODAY, TEAM, type Trend } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore, type HabitId } from '../state/store';
import type { PetMood, ReminderKind, Scenario } from '../state/types';
import { colors, gradients, radius } from '../theme';

const TREND_ARROW: Record<Trend, string> = { upFast: '⇈', up: '↗', flat: '→', down: '↘', downFast: '⇊' };
const SCENARIOS: Scenario[] = ['inRange', 'rising', 'high', 'veryHigh', 'low', 'urgentLow', 'night', 'goal', 'syncError'];
const DEMO_REMINDERS: ReminderKind[] = ['insulin', 'sport', 'sensor', 'meal', 'water'];
const REMINDER_ICON: Record<ReminderKind, string> = { insulin: '💉', sport: '👟', sensor: '📡', meal: '🍽️', water: '💧' };
const HABIT: Record<HabitId, { icon: IconName; tone: string; bg: string }> = {
  log: { icon: 'plus', tone: colors.coralText, bg: colors.softCoral },
  walk: { icon: 'walk', tone: colors.blue, bg: colors.softBlue },
  listen: { icon: 'headphones', tone: colors.purple, bg: colors.softPurple },
};
const POKE_LINES = 4;

const hhmm = (ts: number) => new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function Chip({ children, bg, onPress, label }: { children: React.ReactNode; bg: string; onPress?: () => void; label: string }) {
  return (
    <Bouncy accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: bg, paddingHorizontal: 12, minHeight: 44, borderRadius: 22 }}>
      {children}
    </Bouncy>
  );
}

export default function Home() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [poke, setPoke] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const lastLevel = useRef(d.petLevel);
  const owi = state.pet.name;
  const name = state.userName || t('common.friend');

  useEffect(() => setRetryFailed(false), [state.scenario]);
  useEffect(() => {
    if (!retrying) return;
    const id = setTimeout(() => {
      setRetrying(false);
      setRetryFailed(true);
    }, 1800);
    return () => clearTimeout(id);
  }, [retrying]);
  // Owi evoluciona: ¡fiesta!
  useEffect(() => {
    if (d.petLevel > lastLevel.current) setBurst((b) => b + 1);
    lastLevel.current = d.petLevel;
  }, [d.petLevel]);
  useEffect(() => {
    if (poke === null) return;
    const id = setTimeout(() => setPoke(null), 2600);
    return () => clearTimeout(id);
  }, [poke]);

  const unreadAudio = state.messages.find((m) => !m.read && m.kind === 'audio' && m.from !== 'patient' && m.from !== 'owi');
  const unreadFrom = unreadAudio ? TEAM[unreadAudio.from as keyof typeof TEAM] : null;

  // Mensaje de Owi: concreto, con tus datos, nunca culpabilizador. Fuera de rango acompaña, no indica.
  const reminder = d.mood === 'remind' || d.mood === 'sport' ? d.reminders[0] : null;
  const vars = { name, tir: d.tir.inRange, streak: d.streak, who: unreadFrom?.short ?? '', days: d.daysAway };
  const calm = d.mood === 'happy' || d.mood === 'attentive' || d.petMood === 'missYou';
  let message: string;
  if (poke !== null && calm) message = t(`owi.poke.${poke}`, vars);
  else if (reminder) message = t(reminder.text, { ...reminder.vars, name });
  else if (d.mood === 'caringHigh' && unreadFrom) message = t('owi.highAudio', vars);
  else message = t(`owi.say.${d.petMood}`, vars);
  const petMood: PetMood = poke !== null && calm ? 'celebrate' : d.petMood;

  const v = d.current?.v ?? 0;
  const shown = useCountUp(v);
  const status = !d.current ? 'none' : !d.syncOk ? 'stale' : v < DEFAULT_TARGET.low ? 'low' : v > DEFAULT_TARGET.high ? 'high' : 'in';
  const valueColor = status === 'low' ? colors.low : status === 'high' ? colors.coralText : status === 'stale' ? colors.secondary : colors.greenText;
  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const habitsDone = Object.values(d.habitsToday).filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cabecera */}
        <LinearGradient colors={d.isNight && d.mood === 'sleep' ? [...gradients.night] : [...gradients.hero]} style={{ paddingTop: insets.top + 14, paddingBottom: 70, paddingHorizontal: 16 }}>
          <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T v="small" color="rgba(255,255,255,0.9)">
                  {date}
                </T>
                <T v="title" color={colors.white} accessibilityRole="header">
                  {t('home.hello', { name })}
                </T>
              </View>
              <Chip bg="rgba(255,255,255,0.22)" label={t('home.streakA11y', { n: d.streak })} onPress={() => go('progress')}>
                <Pulse active={d.todayDone} scale={1.18}>
                  <Icon name="flame" size={22} color={colors.achievement} />
                </Pulse>
                <T v="h2" color={colors.white}>
                  {d.streak}
                </T>
              </Chip>
            </Row>
            {FLAGS.demoScenarios && (
              <Pressable accessibilityRole="button" onPress={() => setDemoOpen((o) => !o)} style={{ alignSelf: 'flex-start' }}>
                <T v="small" color="rgba(255,255,255,0.95)" style={{ textDecorationLine: 'underline' }}>
                  {demoOpen ? t('demo.hide') : t('demo.show')}
                </T>
              </Pressable>
            )}
          </View>
        </LinearGradient>

        <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 16, gap: 14, marginTop: -58 }}>
          {FLAGS.demoScenarios && demoOpen && (
            <FadeIn>
              <Card style={{ gap: 8 }}>
                <T v="small" color={colors.secondary}>
                  {t('demo.title')}
                </T>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {SCENARIOS.map((s) => (
                    <Choice
                      key={s}
                      label={t(`demo.${s}`)}
                      selected={state.scenario === s && !state.demoReminder}
                      onPress={() => {
                        dispatch({ type: 'setDemoReminder', kind: null });
                        dispatch({ type: 'setScenario', scenario: s });
                      }}
                    />
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {DEMO_REMINDERS.map((k) => (
                    <Choice
                      key={k}
                      label={`${REMINDER_ICON[k]} ${t(`demo.rem.${k}`)}`}
                      selected={state.demoReminder === k}
                      onPress={() => dispatch({ type: 'setDemoReminder', kind: state.demoReminder === k ? null : k })}
                    />
                  ))}
                </ScrollView>
              </Card>
            </FadeIn>
          )}

          {/* Tu avatar y Owi */}
          <FadeIn>
            <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.border, overflow: 'hidden' }}>
              <LinearGradient colors={['#E9F8F2', '#FFFFFF']} style={{ paddingTop: 4 }}>
                <Scene3D
                  mode="pair"
                  avatar={d.owiAvatar}
                  avatarMood={d.avatarMood}
                  petMood={petMood}
                  petLevel={d.petLevel}
                  height={250}
                  onTap={() => setPoke((p) => ((p ?? -1) + 1) % POKE_LINES)}
                  accessibilityLabel={t(`owi.mood.${petMood}`, { name: owi })}
                />
              </LinearGradient>
              <View style={{ padding: 12, paddingTop: 0 }}>
                <Pop trigger={message}>
                  <SpeechBubble text={message} name={owi} mood={petMood} icon={reminder ? REMINDER_ICON[reminder.kind] : undefined} arrow="right">
                    {reminder && (
                      <Row gap={8} style={{ marginTop: 10 }}>
                        <Button
                          style={{ flex: 1 }}
                          label={t(`rem.done.${reminder.kind}`)}
                          onPress={() => {
                            dispatch({ type: 'reminderDone', id: reminder.id });
                            setBurst((b) => b + 1);
                            if (reminder.kind === 'insulin' || reminder.kind === 'meal') go('log');
                          }}
                        />
                        <Button style={{ flex: 1 }} kind="secondary" label={t('rem.later')} onPress={() => dispatch({ type: 'snooze', id: reminder.id, minutes: 15 })} />
                      </Row>
                    )}
                  </SpeechBubble>
                </Pop>
                {reminder ? (
                  <T v="small" color={colors.secondary} center style={{ marginTop: 6 }}>
                    {t('rem.fromPlan')}
                  </T>
                ) : (
                  <T v="small" color={colors.secondary} center style={{ marginTop: 6 }}>
                    {t('home.tapOwi', { owi })}
                  </T>
                )}
              </View>
            </View>
          </FadeIn>

          {unreadAudio && unreadFrom && (
            <FadeIn delay={80}>
              <Card tone="blue">
                <Row gap={12}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: unreadFrom.color, alignItems: 'center', justifyContent: 'center' }}>
                    <T v="label" color={unreadFrom.fg}>
                      {unreadFrom.initials}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="label">{t('home.audioFrom', { owi, who: unreadFrom.short })}</T>
                    <T v="small" color={colors.secondary}>
                      {t(`role.${unreadAudio.from}`)} · {Math.round(unreadAudio.durationSec ?? 0)} s
                    </T>
                  </View>
                </Row>
                <Button kind="blue" label={t('home.listenTogether')} onPress={() => go('team')} icon={<Icon name="play" size={20} color={colors.white} />} />
              </Card>
            </FadeIn>
          )}

          {!d.syncOk && (
            <FadeIn delay={100}>
              <Card tone="coral">
                <Row gap={10} style={{ alignItems: 'flex-start' }}>
                  <Icon name="sync" color={colors.coralText} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <T v="label">{t('sync.title', { sensor: t(`sensor.${state.sensor === 'none' ? 'libre' : state.sensor}`) })}</T>
                    <T v="small">{t('sync.detail', { time: d.current ? hhmm(d.current.t) : '—' })}</T>
                    {retryFailed && <T v="small">{t('sync.stillFailing')}</T>}
                  </View>
                </Row>
                {retrying ? (
                  <Row style={{ justifyContent: 'center', minHeight: 52 }}>
                    <ActivityIndicator color={colors.coralText} />
                    <T v="label">{t('sync.retrying')}</T>
                  </Row>
                ) : (
                  <Button kind="secondary" label={t('sync.retry')} onPress={() => setRetrying(true)} />
                )}
              </Card>
            </FadeIn>
          )}

          {/* Glucosa */}
          <FadeIn delay={140}>
            <Card>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <T v="small" color={colors.secondary} style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    {t('home.glucoseNow')} · {d.current ? (d.minutesSinceSync < 60 ? t('home.ago', { min: d.minutesSinceSync }) : t('home.agoH', { h: Math.floor(d.minutesSinceSync / 60), min: d.minutesSinceSync % 60 })) : ''}
                  </T>
                  <View
                    accessible
                    accessibilityLabel={t('home.glucoseA11y', { v, trend: t(`trend.${d.trend}`), status: t(`status.${status}`) })}
                    style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}
                  >
                    <T v="big" color={valueColor}>
                      {v ? shown : '—'}
                    </T>
                    <View style={{ paddingBottom: 8 }}>
                      <T v="title" color={valueColor}>
                        {TREND_ARROW[d.trend]}
                      </T>
                      <T v="small" color={colors.secondary}>
                        mg/dL
                      </T>
                    </View>
                  </View>
                  <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: status === 'low' ? '#FDE7E5' : status === 'high' ? colors.softCoral : status === 'stale' ? colors.line : colors.softGreen }}>
                    <T v="label" color={valueColor}>
                      {t(`status.${status}`)}
                    </T>
                  </View>
                </View>
                <TirRing inRange={d.tir.inRange} low={d.tir.low} high={d.tir.high} size={118} label={t('home.tirA11y', d.tir)} />
              </Row>
              {status === 'low' && (
                <T v="small" color={colors.secondary}>
                  {t('home.sensorAlarmNote')}
                </T>
              )}
              {status === 'low' && v < 54 && (
                <T v="label" color={colors.low}>
                  {t('home.urgentNote')}
                </T>
              )}
              <GlucoseChart series={d.series} label={t('home.chartA11y', { tir: d.tir.inRange })} />
              <T v="small" color={colors.secondary}>
                {t('home.targetBy', { low: DEFAULT_TARGET.low, high: DEFAULT_TARGET.high, who: TEAM.endo.name })}
              </T>
            </Card>
          </FadeIn>

          {/* Hábitos del día */}
          <FadeIn delay={200}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h2">{t('home.habitsTitle')}</T>
                <T v="label" color={colors.greenText}>
                  {habitsDone}/3
                </T>
              </Row>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(Object.keys(d.habitsToday) as HabitId[]).map((h) => {
                  const done = d.habitsToday[h];
                  const hb = HABIT[h];
                  return (
                    <Bouncy
                      key={h}
                      accessibilityRole="button"
                      accessibilityLabel={`${t(`habit.${h}`)}: ${done ? t('common.done') : t('common.pending')}`}
                      onPress={() => go(h === 'log' ? 'log' : h === 'listen' ? 'team' : 'progress')}
                      outerStyle={{ flex: 1 }}
                      style={{
                        alignItems: 'center',
                        gap: 6,
                        padding: 10,
                        borderRadius: radius.m,
                        backgroundColor: done ? hb.tone : hb.bg,
                        borderBottomWidth: 4,
                        borderBottomColor: done ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <Pop trigger={done}>
                        <Icon name={done ? 'check' : hb.icon} size={28} color={done ? colors.white : hb.tone} stroke={done ? 3 : 2.2} />
                      </Pop>
                      <T v="small" color={done ? colors.white : colors.ink} center>
                        {t(`habit.${h}`)}
                      </T>
                    </Bouncy>
                  );
                })}
              </View>
              <View style={{ gap: 4 }}>
                <ProgressBar value={(STEPS_TODAY / STEPS_GOAL) * 100} color={colors.blue} height={12} />
                <T v="small" color={colors.secondary}>
                  {t('home.steps', { n: STEPS_TODAY.toLocaleString('es-ES'), goal: STEPS_GOAL.toLocaleString('es-ES') })}
                </T>
              </View>
              <T v="small" color={colors.secondary}>
                {t('home.habitsNote')}
              </T>
            </Card>
          </FadeIn>

          <FadeIn delay={260}>
            <BondCard />
          </FadeIn>
        </View>
      </ScrollView>
      <Burst fire={burst} />
    </View>
  );
}
