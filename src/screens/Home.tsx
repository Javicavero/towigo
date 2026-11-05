/**
 * Hoy — Owi es el protagonista.
 * Escenario a pantalla completa: Owi animado (bucles 3D tipo GIF) dentro de los anillos del día,
 * con su frase basada en tus datos y acciones rápidas. Debajo: lo que toca hoy y el resumen.
 * Fase 1 (§8.2): datos, tendencias, hábitos y comunicación. Nunca indicaciones clínicas automáticas.
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarBadge from '../components/AvatarBadge';
import { CheckinCard } from '../components/checkin';
import { CheerCard } from '../components/crew';
import { Icon } from '../components/icons';
import { FadeIn, Pop } from '../components/motion';
import OwiStage from '../components/OwiStage';
import { MaintenanceCard, SupportCard } from '../components/program';
import { RING, useDayRings } from '../components/rings';
import { T1Card } from '../components/t1';
import { SummaryGrid, TodayList } from '../components/today';
import { Button, Row, SectionTitle, T } from '../components/ui';
import { STEPS_TODAY, TEAM } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { isT1, usesGlp1 } from '../state/types';
import { colors, fonts, isDark } from '../theme';

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'home.night' : h < 13 ? 'home.morning' : h < 21 ? 'home.afternoon' : 'home.night';
}

/** Frase de Owi con tus datos (o el aviso del plan). */
function useOwiLine(poke: number) {
  const { state, d } = useStore();
  const name = state.userName || t('common.friend');
  const glp1 = usesGlp1(state.profile);
  const unreadAudio = state.messages.find((m) => !m.read && m.kind === 'audio' && m.from !== 'patient' && m.from !== 'owi');
  const unreadFrom = unreadAudio ? TEAM[unreadAudio.from as keyof typeof TEAM] : null;
  const reminder = d.petMood === 'remind' || d.petMood === 'sport' ? d.reminders[0] : null;
  const vars = {
    name,
    streak: d.streak,
    who: unreadFrom?.short ?? TEAM.nutri.short,
    lost: d.lostKg.toFixed(1).replace('.', ','),
    pct: d.lostPct.toFixed(1).replace('.', ','),
    weeks: d.injectionWeeks,
    v: d.lastGlucose?.v ?? 0,
    tir: d.tir24,
  };
  let message: string;
  if (reminder) message = t(reminder.text, { ...reminder.vars, name });
  else if (d.petMood === 'caringHigh' && d.worstSymptomToday >= 2) message = t('owi.say.sideEffects', vars);
  else if (d.petMood === 'attentive' && d.injectionOverdue) message = t('owi.say.missedInjection', vars);
  else if (d.petMood === 'attentive' && d.plateau) message = t('owi.say.plateau', vars);
  else if (d.petMood === 'celebrate') message = t('owi.say.milestone', vars);
  else if (d.petMood === 'happy' && poke) message = t(`owi.poke.${poke % 4}`, vars);
  else if (d.petMood === 'happy')
    message = isT1(state.profile) ? t('owi.say.happyT1', vars) : d.maintenance ? t('owi.say.happyMaint', { ...vars, weeks: d.maintWeeks }) : glp1 ? t('owi.say.happyGlp1', vars) : t('owi.say.happyT2', vars);
  else message = t(`owi.say.${d.petMood}`, vars);
  return { message, reminder };
}

function Stat({ color, label, value, onPress }: { color: string; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 2, opacity: pressed ? 0.6 : 1 })}>
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

export default function Home() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const insets = useSafeAreaInsets();
  const [poke, setPoke] = useState(0);
  const name = state.userName || t('common.friend');
  const rings = useDayRings();
  const { message, reminder } = useOwiLine(poke);
  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <OwiStage mood={d.petMood} level={d.petLevel} rings={rings} size={300} top={insets.top + 64} onPressOwi={() => setPoke((p) => p + 1)} label={t(`owi.mood.${d.petMood}`, { name: state.pet.name })}>
          {/* Cabecera flotante sobre el escenario */}
          <View style={{ position: 'absolute', top: insets.top + 12, left: 0, right: 0, paddingHorizontal: 18, maxWidth: 560, alignSelf: 'center', width: '100%' }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <T v="small" color={colors.secondary} style={{ fontFamily: fonts.medium, letterSpacing: 0.6, fontSize: 11 }}>
                  {rawDate.toUpperCase()}
                </T>
                <T v="h2">{t(greeting(), { name })}</T>
              </View>
              <Row gap={8}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.streakA11y', { n: d.streak })}
                  onPress={() => go('progress')}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)', paddingHorizontal: 10, height: 34, borderRadius: 17, opacity: pressed ? 0.7 : 1 })}
                >
                  <Icon name="flame" size={16} color={colors.coralDark} />
                  <T v="label">{d.streak}</T>
                </Pressable>
                <AvatarBadge avatar={d.owiAvatar} size={36} onPress={() => go('me')} label={t('avatar.you', { name })} />
              </Row>
            </Row>
          </View>

          {/* Frase de Owi */}
          <View style={{ width: '100%', maxWidth: 560, paddingHorizontal: 18, gap: 12, marginTop: -6, paddingBottom: 18 }}>
            <Pop trigger={message}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <T v="small" color={colors.greenText} style={{ fontFamily: fonts.semibold, letterSpacing: 0.6, fontSize: 11 }}>
                  {state.pet.name.toUpperCase()}
                </T>
                <T v="h2" center style={{ fontSize: 20, lineHeight: 27 }}>
                  {message}
                </T>
              </View>
            </Pop>
            {reminder ? (
              <Row gap={8}>
                <Button
                  style={{ flex: 1, minHeight: 44 }}
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
                <Button style={{ flex: 1, minHeight: 44 }} kind="secondary" label={t('rem.later')} onPress={() => dispatch({ type: 'snooze', id: reminder.id, minutes: 15 })} />
              </Row>
            ) : (
              <Row gap={8} style={{ justifyContent: 'center' }}>
                <Button style={{ minHeight: 44, paddingHorizontal: 22 }} label={t('home.talkOwi', { owi: state.pet.name })} onPress={() => go('owi')} icon={<Icon name="chat" size={18} color={colors.onAccent} />} />
                <Button style={{ minHeight: 44, paddingHorizontal: 18 }} kind="secondary" label={t('home.quickLog')} onPress={() => go('log')} icon={<Icon name="plus" size={18} color={colors.greenText} />} />
              </Row>
            )}
            <Row style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)', borderRadius: 16, paddingVertical: 10 }}>
              <Stat color={RING.plan} label={t('rings.plan')} value={t('rings.planValue', { a: rings.tasksDone, b: rings.tasksTotal })} onPress={() => go('log')} />
              <Stat color={RING.move} label={t('rings.move')} value={STEPS_TODAY.toLocaleString('es-ES')} onPress={() => go('progress')} />
              <Stat color={RING.food} label={t('rings.food')} value={`${d.proteinToday}/${state.goals.proteinG} g`} onPress={() => go('log', 'intake')} />
            </Row>
          </View>
        </OwiStage>

        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, gap: 12, marginTop: 6 }}>
          <SupportCard />
          <CheerCard />
          {isT1(state.profile) && <T1Card />}
          {d.maintenance && <MaintenanceCard />}
          {!d.checkinToday && <CheckinCard />}
          <SectionTitle>{t('home.forToday')}</SectionTitle>
          <FadeIn delay={100}>
            <TodayList />
          </FadeIn>
          <SectionTitle>{t('home.summary')}</SectionTitle>
          <FadeIn delay={140}>
            <SummaryGrid />
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}
