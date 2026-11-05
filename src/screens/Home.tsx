/**
 * Pantalla "Hoy" (tipo 2 · GLP-1 · tipo 2 + GLP-1).
 * Cabecera con racha, tu avatar y Owi con su bocadillo (emociones y avisos), y tarjetas según el perfil.
 * Fase 1 (§8.2): datos, tendencias, hábitos y comunicación. Nunca indicaciones clínicas automáticas.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarFace, { type AvatarExpression } from '../components/AvatarFace';
import BondCard from '../components/BondCard';
import { GlucoseCard, HabitsCard, InjectionCard, IntakeCard, MedsCard, SideEffectsCard, WeightCard } from '../components/cards';
import { Icon } from '../components/icons';
import { Bouncy, Burst, FadeIn, Pop, Pulse } from '../components/motion';
import OwiAnimated from '../components/OwiAnimated';
import SpeechBubble from '../components/SpeechBubble';
import { Button, Card, Choice, Row, T } from '../components/ui';
import { FLAGS } from '../config';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { hasT2, usesGlp1, type PetMood, type Profile, type ReminderKind, type Scenario } from '../state/types';
import { colors, gradients, radius } from '../theme';

const PROFILES: Profile[] = ['glp1', 't2', 't2_glp1'];
const SCENARIOS: Scenario[] = ['normal', 'injectionDay', 'missedInjection', 'sideEffects', 'plateau', 'milestone', 'highGlucose', 'lowGlucose', 'night'];
const DEMO_REMINDERS: ReminderKind[] = ['injection', 'meds', 'weigh', 'meal', 'sport', 'water'];
const REMINDER_ICON: Record<ReminderKind, string> = { injection: '💉', meds: '💊', weigh: '⚖️', meal: '🍽️', sport: '👟', water: '💧' };
const POKE_LINES = 4;

const avatarExpr = (m: PetMood): AvatarExpression =>
  m === 'celebrate' || m === 'happy' || m === 'sport' ? 'big' : m === 'sleep' ? 'sleep' : m.startsWith('caring') || m.startsWith('worried') ? 'calm' : 'smile';

export default function Home() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const insets = useSafeAreaInsets();
  const [demoOpen, setDemoOpen] = useState(false);
  const [poke, setPoke] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const lastLevel = useRef(d.petLevel);
  const owi = state.pet.name;
  const name = state.userName || t('common.friend');
  const glp1 = usesGlp1(state.profile);
  const t2 = hasT2(state.profile);

  useEffect(() => {
    if (d.petLevel > lastLevel.current) setBurst((b) => b + 1);
    lastLevel.current = d.petLevel;
  }, [d.petLevel]);
  useEffect(() => {
    if (state.scenario === 'milestone') setBurst((b) => b + 1);
  }, [state.scenario]);
  useEffect(() => {
    if (poke === null) return;
    const id = setTimeout(() => setPoke(null), 2600);
    return () => clearTimeout(id);
  }, [poke]);

  const unreadAudio = state.messages.find((m) => !m.read && m.kind === 'audio' && m.from !== 'patient' && m.from !== 'owi');
  const unreadFrom = unreadAudio ? TEAM[unreadAudio.from as keyof typeof TEAM] : null;

  // Mensaje de Owi: concreto, con tus datos y nunca culpabilizador.
  const reminder = d.petMood === 'remind' || d.petMood === 'sport' ? d.reminders[0] : null;
  const vars = {
    name,
    streak: d.streak,
    who: unreadFrom?.short ?? TEAM.nutri.short,
    lost: d.lostKg.toFixed(1).replace('.', ','),
    pct: d.lostPct.toFixed(1).replace('.', ','),
    weeks: d.injectionWeeks,
    v: d.lastGlucose?.v ?? 0,
  };
  const calm = d.petMood === 'happy' || d.petMood === 'missYou';
  let message: string;
  let owiMood: PetMood = d.petMood;
  if (poke !== null && calm) {
    message = t(`owi.poke.${poke}`, vars);
    owiMood = 'celebrate';
  } else if (reminder) message = t(reminder.text, { ...reminder.vars, name });
  else if (d.petMood === 'caringHigh' && d.worstSymptomToday >= 2) message = t('owi.say.sideEffects', vars);
  else if (d.petMood === 'attentive' && d.injectionOverdue) message = t('owi.say.missedInjection', vars);
  else if (d.petMood === 'attentive' && d.plateau) message = t('owi.say.plateau', vars);
  else if (d.petMood === 'celebrate') message = t('owi.say.milestone', vars);
  else if (d.petMood === 'happy') message = glp1 ? t('owi.say.happyGlp1', vars) : t('owi.say.happyT2', vars);
  else message = t(`owi.say.${d.petMood}`, vars);

  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // Orden de tarjetas según el perfil (tipo 2: el peso no es protagonista).
  const cards: React.ReactNode[] = [];
  if (glp1) cards.push(<InjectionCard key="inj" />);
  if (t2) cards.push(<GlucoseCard key="glu" />, <MedsCard key="meds" />);
  if (glp1) cards.push(<SideEffectsCard key="se" />);
  cards.push(<WeightCard key="w" compact={state.profile !== 'glp1'} />);
  if (glp1) cards.push(<IntakeCard key="intake" />);
  cards.push(<HabitsCard key="habits" />, <BondCard key="bond" />);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={d.isNight && d.petMood === 'sleep' ? [...gradients.night] : [...gradients.hero]} style={{ paddingTop: insets.top + 14, paddingBottom: 64, paddingHorizontal: 16 }}>
          <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T v="small" color="rgba(255,255,255,0.9)">
                  {date} · {t(`profile.short.${state.profile}`)}
                </T>
                <T v="title" color={colors.white} accessibilityRole="header">
                  {t('home.hello', { name })}
                </T>
              </View>
              <Bouncy
                accessibilityRole="button"
                accessibilityLabel={t('home.streakA11y', { n: d.streak })}
                onPress={() => go('progress')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, minHeight: 44, borderRadius: 22 }}
              >
                <Pulse active={d.todayDone} scale={1.18}>
                  <Icon name="flame" size={22} color={colors.achievement} />
                </Pulse>
                <T v="h2" color={colors.white}>
                  {d.streak}
                </T>
              </Bouncy>
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

        <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 16, gap: 14, marginTop: -50 }}>
          {FLAGS.demoScenarios && demoOpen && (
            <FadeIn>
              <Card style={{ gap: 8 }}>
                <T v="small" color={colors.secondary}>
                  {t('demo.profile')}
                </T>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {PROFILES.map((p) => (
                    <Choice key={p} label={t(`profile.short.${p}`)} selected={state.profile === p} onPress={() => dispatch({ type: 'setProfile', profile: p })} />
                  ))}
                </Row>
                <T v="small" color={colors.secondary}>
                  {t('demo.title')}
                </T>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {SCENARIOS.filter((s) => (glp1 || !['injectionDay', 'missedInjection', 'sideEffects', 'plateau'].includes(s)) && (t2 || !['highGlucose', 'lowGlucose'].includes(s))).map((s) => (
                    <Choice key={s} label={t(`demo.${s}`)} selected={state.scenario === s && !state.demoReminder} onPress={() => dispatch({ type: 'setScenario', scenario: s })} />
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {DEMO_REMINDERS.filter((k) => (glp1 || k !== 'injection') && (t2 || k !== 'meds')).map((k) => (
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

          {/* Tú y Owi */}
          <FadeIn>
            <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.border, overflow: 'hidden' }}>
              <LinearGradient colors={['#E9F8F2', '#FFFFFF']} style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingTop: 10, gap: 4 }}>
                <AvatarFace avatar={d.owiAvatar} size={128} expression={avatarExpr(d.petMood)} label={t('avatar.you', { name })} />
                <OwiAnimated mood={owiMood} level={d.petLevel} size={170} onPress={() => setPoke((p) => ((p ?? -1) + 1) % POKE_LINES)} label={t(`owi.mood.${owiMood}`, { name: owi })} />
              </LinearGradient>
              <View style={{ padding: 12, paddingTop: 0 }}>
                <Pop trigger={message}>
                  <SpeechBubble text={message} name={owi} icon={reminder ? REMINDER_ICON[reminder.kind] : undefined} arrow="right">
                    {reminder && (
                      <Row gap={8} style={{ marginTop: 10 }}>
                        <Button
                          style={{ flex: 1 }}
                          label={t(`rem.done.${reminder.kind}`)}
                          onPress={() => {
                            dispatch({ type: 'reminderDone', id: reminder.id, kind: reminder.kind });
                            setBurst((b) => b + 1);
                            if (reminder.kind === 'injection') go('log', 'injection');
                            if (reminder.kind === 'weigh') go('log', 'weight');
                            if (reminder.kind === 'meal') go('log', 'intake');
                            if (reminder.kind === 'meds') go('log', 'meds');
                          }}
                        />
                        <Button style={{ flex: 1 }} kind="secondary" label={t('rem.later')} onPress={() => dispatch({ type: 'snooze', id: reminder.id, minutes: 15 })} />
                      </Row>
                    )}
                  </SpeechBubble>
                </Pop>
                <T v="small" color={colors.secondary} center style={{ marginTop: 6 }}>
                  {reminder ? t('rem.fromPlan') : t('home.tapOwi', { owi })}
                </T>
              </View>
            </View>
          </FadeIn>

          {unreadAudio && unreadFrom && (
            <FadeIn delay={60}>
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

          {cards.map((c, i) => (
            <FadeIn key={i} delay={100 + i * 60}>
              {c}
            </FadeIn>
          ))}
        </View>
      </ScrollView>
      <Burst fire={burst} />
    </View>
  );
}
