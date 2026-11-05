/**
 * Pantalla "Hoy" (tipo 2 · GLP-1 · tipo 2 + GLP-1).
 * Estructura clara: cabecera, Owi (protagonista), "Para hoy" (tareas) y "Resumen" (datos clave).
 * El detalle y las gráficas viven en Progreso.
 * Fase 1 (§8.2): datos, tendencias, hábitos y comunicación. Nunca indicaciones clínicas automáticas.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarBadge from '../components/AvatarBadge';
import { SummaryGrid, TodayList } from '../components/today';
import { Icon } from '../components/icons';
import { Burst, FadeIn, Pop } from '../components/motion';
import OwiAnimated from '../components/OwiAnimated';
import SpeechBubble from '../components/SpeechBubble';
import { Button, Row, SectionTitle, T } from '../components/ui';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { usesGlp1, type PetMood, type ReminderKind } from '../state/types';
import { colors, radius } from '../theme';

const REMINDER_ICON: Record<ReminderKind, string> = {
  injection: '💉',
  meds: '💊',
  weigh: '⚖️',
  meal: '🍽️',
  sport: '👟',
  water: '💧',
};
const POKE_LINES = 4;

export default function Home() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const insets = useSafeAreaInsets();
  const [poke, setPoke] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const lastLevel = useRef(d.petLevel);
  const owi = state.pet.name;
  const name = state.userName || t('common.friend');
  const glp1 = usesGlp1(state.profile);

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

  const rawDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Cabecera clínica: fecha, título grande, racha y tu avatar como foto de perfil */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 520,
              alignSelf: 'center',
              gap: 4,
            }}
          >
            <Row
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <View style={{ flex: 1 }}>
                <T v="small" color={colors.secondary}>
                  {date}
                </T>
                <T v="display" accessibilityRole="header">
                  {t('home.hello', { name })}
                </T>
              </View>
              <Row gap={8}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.streakA11y', { n: d.streak })}
                  onPress={() => go('progress')}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: colors.white,
                    paddingHorizontal: 10,
                    height: 36,
                    borderRadius: 18,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name="flame" size={18} color={colors.coralDark} />
                  <T v="label">{d.streak}</T>
                </Pressable>
                <AvatarBadge avatar={d.owiAvatar} size={44} onPress={() => go('me')} label={t('avatar.you', { name })} />
              </Row>
            </Row>
            <Row gap={8}>
              <View
                style={{
                  backgroundColor: colors.softGreen,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <T v="small" color={colors.greenText}>
                  {t(`profile.short.${state.profile}`)}
                </T>
              </View>
            </Row>
          </View>
        </View>

        <View
          style={{
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
            paddingHorizontal: 16,
            gap: 12,
            marginTop: 4,
          }}
        >
          {/* Tú y Owi */}
          <FadeIn>
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.l,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              {/* Owi, protagonista */}
              <LinearGradient colors={[colors.softGreen, colors.white]} style={{ alignItems: 'center', paddingTop: 12 }}>
                <OwiAnimated
                  mood={owiMood}
                  level={d.petLevel}
                  size={160}
                  onPress={() => setPoke((p) => ((p ?? -1) + 1) % POKE_LINES)}
                  label={t(`owi.mood.${owiMood}`, { name: owi })}
                />
              </LinearGradient>
              <View style={{ padding: 12, paddingTop: 0 }}>
                <Pop trigger={message}>
                  <SpeechBubble text={message} name={owi} icon={reminder ? REMINDER_ICON[reminder.kind] : undefined} arrow="center">
                    {reminder && (
                      <Row gap={8} style={{ marginTop: 10 }}>
                        <Button
                          style={{ flex: 1 }}
                          label={t(`rem.done.${reminder.kind}`)}
                          onPress={() => {
                            dispatch({
                              type: 'reminderDone',
                              id: reminder.id,
                              kind: reminder.kind,
                            });
                            setBurst((b) => b + 1);
                            if (reminder.kind === 'injection') go('log', 'injection');
                            if (reminder.kind === 'weigh') go('log', 'weight');
                            if (reminder.kind === 'meal') go('log', 'intake');
                            if (reminder.kind === 'meds') go('log', 'meds');
                          }}
                        />
                        <Button
                          style={{ flex: 1 }}
                          kind="secondary"
                          label={t('rem.later')}
                          onPress={() =>
                            dispatch({
                              type: 'snooze',
                              id: reminder.id,
                              minutes: 15,
                            })
                          }
                        />
                      </Row>
                    )}
                  </SpeechBubble>
                </Pop>
                {reminder && (
                  <T v="small" color={colors.secondary} center style={{ marginTop: 6 }}>
                    {t('rem.fromPlan')}
                  </T>
                )}
              </View>
            </View>
          </FadeIn>

          <SectionTitle>{t('home.forToday')}</SectionTitle>
          <FadeIn delay={80}>
            <TodayList />
          </FadeIn>
          <SectionTitle>{t('home.summary')}</SectionTitle>
          <FadeIn delay={140}>
            <SummaryGrid />
          </FadeIn>
        </View>
      </ScrollView>
      <Burst fire={burst} />
    </View>
  );
}
