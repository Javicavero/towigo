/**
 * Hoy — diseño "premium + tech".
 * Cabecera sobria, asistente Owi discreto (una línea útil, abre el chat), anillos del día,
 * tarjeta principal según el perfil y, debajo, "Para hoy" y "Resumen".
 * Fase 1 (§8.2): datos, tendencias, hábitos y comunicación. Nunca indicaciones clínicas automáticas.
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarBadge from '../components/AvatarBadge';
import { CheckinCard } from '../components/checkin';
import { CheerCard } from '../components/crew';
import { Icon } from '../components/icons';
import { FadeIn } from '../components/motion';
import OwiSticker from '../components/OwiSticker';
import { MaintenanceCard, SupportCard } from '../components/program';
import { DayRings } from '../components/rings';
import { T1Card } from '../components/t1';
import { SummaryGrid, TodayList } from '../components/today';
import { Button, Row, SectionTitle, T } from '../components/ui';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore } from '../state/store';
import { isT1, usesGlp1 } from '../state/types';
import { colors, radius } from '../theme';

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'home.night' : h < 13 ? 'home.morning' : h < 21 ? 'home.afternoon' : 'home.night';
}

/** Asistente Owi: discreto, una frase útil con tus datos y acceso al chat. */
function OwiInsight() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const [poke, setPoke] = useState(0);
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
    message = isT1(state.profile)
      ? t('owi.say.happyT1', vars)
      : d.maintenance
        ? t('owi.say.happyMaint', { ...vars, weeks: d.maintWeeks })
        : glp1
          ? t('owi.say.happyGlp1', vars)
          : t('owi.say.happyT2', vars);
  else message = t(`owi.say.${d.petMood}`, vars);

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.l, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${state.pet.name}: ${message}. ${t('home.talkOwi', { owi: state.pet.name })}`}
        onPress={() => (reminder ? setPoke((p) => p + 1) : go('owi'))}
        style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' }}>
          <OwiSticker mood={d.petMood} size={38} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="small" color={colors.greenText} style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 }}>
            {t('home.assistant', { owi: state.pet.name }).toUpperCase()}
          </T>
          <T v="label">{message}</T>
        </View>
        {!reminder && (
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <Icon name="back" size={18} color={colors.secondary} />
          </View>
        )}
      </Pressable>
      {reminder && (
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
      )}
    </View>
  );
}

export default function Home() {
  const { state, d } = useStore();
  const { go } = useNav();
  const insets = useSafeAreaInsets();
  const name = state.userName || t('common.friend');
  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 18, width: '100%', maxWidth: 560, alignSelf: 'center', gap: 2 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <T v="small" color={colors.secondary} style={{ fontFamily: 'Inter_500Medium', letterSpacing: 0.6 }}>
              {rawDate.toUpperCase()}
            </T>
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
                  borderWidth: 1,
                  borderColor: colors.line,
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
          <T v="display" accessibilityRole="header" style={{ marginTop: 6 }}>
            {t(greeting(), { name })}
          </T>
          <T v="small" color={colors.secondary}>
            {t(`profile.short.${state.profile}`)}
            {d.maintenance ? ` · ${t('maint.maint')}` : ''}
          </T>
        </View>

        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, gap: 12, marginTop: 14 }}>
          <FadeIn>
            <OwiInsight />
          </FadeIn>
          <SupportCard />
          <CheerCard />
          <FadeIn delay={60}>
            <DayRings />
          </FadeIn>
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
