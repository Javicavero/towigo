/**
 * Hoy — Owi es el protagonista.
 * Escenario a pantalla completa: Owi animado (marioneta 2D tipo GIF) dentro de los anillos del día,
 * con su frase basada en tus datos y acciones rápidas. Debajo: lo que toca hoy y el resumen.
 * Fase 1 (§8.2): datos, tendencias, hábitos y comunicación. Nunca indicaciones clínicas automáticas.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarBadge from '../components/AvatarBadge';
import { CheckinCard } from '../components/checkin';
import { CheerCard } from '../components/crew';
import { Icon } from '../components/icons';
import { Burst, FadeIn, Pop } from '../components/motion';
import OwiAnimated from '../components/OwiAnimated';
import OwiStage from '../components/OwiStage';
import { MaintenanceCard, SupportCard } from '../components/program';
import { RING, useDayRings } from '../components/rings';
import { T1Card } from '../components/t1';
import { SummaryGrid, TodayList } from '../components/today';
import { Button, Row, SectionTitle, T } from '../components/ui';
import { STEPS_TODAY } from '../data/mock';
import { owiLine } from '../owi/voice';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { isT1 } from '../state/types';
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

/** Registros vistos la última vez que se abrió Hoy (para que Owi celebre al volver de Registrar). */
let lastSeenLogs = -1;

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
  const owi = useOwiLine(poke);
  const reminder = owi.reminder;
  const message = !reminder && rings.plan >= 1 && rings.move >= 1 && rings.food >= 1 && !poke ? t('owi.ringsDone') : owi.message;
  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const [reactTick, setReactTick] = useState(0);
  const [burst, setBurst] = useState(0);
  const allRings = rings.plan >= 1 && rings.move >= 1 && rings.food >= 1;
  const leveledUp = d.petLevel > state.petLevelSeen;

  // Owi celebra cuando vuelves de registrar algo.
  useEffect(() => {
    if (lastSeenLogs >= 0 && state.logsToday > lastSeenLogs) {
      const id = setTimeout(() => setReactTick((x) => x + 1), 350);
      lastSeenLogs = state.logsToday;
      return () => clearTimeout(id);
    }
    lastSeenLogs = state.logsToday;
  }, [state.logsToday]);
  // Tres anillos completos: confeti una vez al día.
  useEffect(() => {
    if (allRings && state.ringsDoneOn !== state.day) {
      dispatch({ type: 'ringsDone', day: state.day });
      setBurst((x) => x + 1);
      setReactTick((x) => x + 1);
    }
  }, [allRings, state.ringsDoneOn, state.day]); // eslint-disable-line react-hooks/exhaustive-deps
  // Datos antiguos con un nivel visto mayor que el actual: se ajusta sin celebrar.
  useEffect(() => {
    if (state.petLevelSeen > d.petLevel) dispatch({ type: 'seenLevel', level: d.petLevel });
    if (leveledUp) setBurst((x) => x + 1);
  }, [d.petLevel]); // eslint-disable-line react-hooks/exhaustive-deps
  const lvName = t(`bond.lv${d.petLevel}`);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <OwiStage
          mood={d.petMood}
          level={d.petLevel}
          rings={rings}
          size={300}
          top={insets.top + 64}
          reactKey={reactTick}
          onPressOwi={() => setPoke((p) => p + 1)}
          label={t(`owi.mood.${d.petMood}`, { name: state.pet.name })}
          levelInfo={{ label: t('owi.level', { n: d.petLevel, name: lvName }), progress: d.petProgress, a11y: t('owi.levelA11y', { owi: state.pet.name, n: d.petLevel, name: lvName, pct: Math.round(d.petProgress * 100) }) }}
        >
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
          {/* "Ahora": una sola cosa importante cada vez (apoyo > ánimo de tu gente > check-in). */}
          {d.supportReason ? <SupportCard /> : state.cheers.some((c) => !c.read) ? <CheerCard /> : !d.checkinToday ? <CheckinCard /> : null}
          {isT1(state.profile) && <T1Card />}
          {d.maintenance && <MaintenanceCard />}
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
      {leveledUp && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,10,22,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View accessibilityViewIsModal accessibilityLiveRegion="polite" style={{ width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.line, padding: 22, alignItems: 'center', gap: 10 }}>
            <OwiAnimated mood="celebrate" level={d.petLevel} size={170} shadow={false} />
            <T v="title" center>
              {t('owi.levelUp.title', { owi: state.pet.name })}
            </T>
            <T center color={colors.secondary}>
              {t('owi.levelUp.text', { level: t('owi.level', { n: d.petLevel, name: lvName }) })}
            </T>
            <Button style={{ alignSelf: 'stretch' }} label={t('owi.levelUp.ok')} onPress={() => dispatch({ type: 'seenLevel', level: d.petLevel })} />
          </View>
        </View>
      )}
      <Burst fire={burst} />
    </View>
  );
}
