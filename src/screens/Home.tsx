/**
 * Pantalla "Hoy": Owi arriba y glucosa debajo.
 * Fase 1 (§8.2): solo se muestran datos y tendencias, mensajes motivacionales
 * y comunicación con el equipo. Nunca indicaciones clínicas automáticas.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import GlucoseChart from '../components/GlucoseChart';
import { Icon, type IconName } from '../components/icons';
import Owi3D from '../components/Owi3D';
import SpeechBubble from '../components/SpeechBubble';
import { Button, Card, Choice, ProgressBar, Row, Screen, T } from '../components/ui';
import { DEFAULT_TARGET, FLAGS } from '../config';
import { STEPS_GOAL, STEPS_TODAY, TEAM, type Trend } from '../data/mock';
import { t } from '../i18n';
import { useNav } from '../nav';
import { useStore, type HabitId } from '../state/store';
import type { Scenario } from '../state/types';
import { colors } from '../theme';

const TREND_ARROW: Record<Trend, string> = { upFast: '⇈', up: '↗', flat: '→', down: '↘', downFast: '⇊' };
const SCENARIOS: Scenario[] = ['inRange', 'high', 'low', 'goal', 'syncError'];
const HABIT_ICON: Record<HabitId, IconName> = { log: 'plus', walk: 'walk', listen: 'headphones' };

function hhmm(ts: number) {
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function Home() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const owi = state.avatar.name;
  const name = state.userName || t('common.friend');

  useEffect(() => {
    setRetryFailed(false);
  }, [state.scenario]);
  useEffect(() => {
    if (!retrying) return;
    const id = setTimeout(() => {
      setRetrying(false);
      setRetryFailed(true);
    }, 1800);
    return () => clearTimeout(id);
  }, [retrying]);

  const unreadAudio = state.messages.find((m) => !m.read && m.kind === 'audio' && m.from !== 'patient' && m.from !== 'owi');
  const unreadFrom = unreadAudio ? TEAM[unreadAudio.from as keyof typeof TEAM] : null;

  // Mensajes de Owi: concretos, con datos del propio usuario y nunca culpabilizadores.
  let message: string;
  if (!d.syncOk) message = t('owi.sync', { name });
  else if (state.scenario === 'goal') message = t('owi.goal', { name, streak: d.streak });
  else if (d.current && d.current.v < DEFAULT_TARGET.low) message = t('owi.low', { name });
  else if (d.current && d.current.v > DEFAULT_TARGET.high)
    message = unreadFrom ? t('owi.highAudio', { who: unreadFrom.short }) : t('owi.high', { name });
  else message = t('owi.inRange', { name, tir: d.tir.inRange, streak: d.streak });

  const v = d.current?.v ?? 0;
  const status = !d.current ? 'none' : !d.syncOk ? 'stale' : v < DEFAULT_TARGET.low ? 'low' : v > DEFAULT_TARGET.high ? 'high' : 'in';
  const valueColor = status === 'low' ? colors.low : status === 'high' ? colors.coralText : status === 'stale' ? colors.secondary : colors.greenText;
  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <T v="title" accessibilityRole="header">
            {t('home.hello', { name })}
          </T>
          <T v="small" color={colors.secondary}>
            {date}
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.streakA11y', { n: d.streak })}
          onPress={() => go('progress')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.softYellow, paddingHorizontal: 14, minHeight: 48, borderRadius: 24 }}
        >
          <Icon name="flame" size={24} color={colors.coralDark} />
          <T v="h2">{d.streak}</T>
        </Pressable>
      </Row>

      {FLAGS.demoScenarios && (
        <View style={{ gap: 6 }}>
          <T v="small" color={colors.secondary}>
            {t('demo.title')}
          </T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {SCENARIOS.map((s) => (
              <Choice key={s} label={t(`demo.${s}`)} selected={state.scenario === s} onPress={() => dispatch({ type: 'setScenario', scenario: s })} />
            ))}
          </ScrollView>
        </View>
      )}

      <View>
        <Owi3D avatar={d.owiAvatar} mood={d.mood} height={215} accessibilityLabel={t(`owi.mood.${d.mood}`, { name: owi })} />
        <SpeechBubble text={message} name={owi} />
      </View>

      {unreadAudio && unreadFrom && (
        <Card tone="green">
          <Row gap={12}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: unreadFrom.color, alignItems: 'center', justifyContent: 'center' }}>
              <T v="label" color={unreadFrom.fg}>
                {unreadFrom.initials}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T v="label">{t('home.audioFrom', { owi, who: unreadFrom.short })}</T>
              <T v="small" color={colors.secondary}>
                {t(`role.${unreadAudio.from}`)} · {Math.round((unreadAudio.durationSec ?? 0))} s
              </T>
            </View>
          </Row>
          <Button label={t('home.listenTogether')} onPress={() => go('team')} icon={<Icon name="play" size={20} color={colors.white} />} />
        </Card>
      )}

      {!d.syncOk && (
        <Card tone="coral">
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon name="sync" color={colors.coralText} />
            <View style={{ flex: 1, gap: 4 }}>
              <T v="label">{t('sync.title', { sensor: t(`sensor.${state.sensor === 'none' ? 'libre' : state.sensor}`) })}</T>
              <T v="small" color={colors.ink}>
                {t('sync.detail', { time: d.current ? hhmm(d.current.t) : '—' })}
              </T>
              {retryFailed && (
                <T v="small" color={colors.ink}>
                  {t('sync.stillFailing')}
                </T>
              )}
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
      )}

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <T v="label" color={colors.secondary}>
            {t('home.glucoseNow')}
          </T>
          <T v="small" color={d.syncOk ? colors.secondary : colors.coralText}>
            {d.current ? (d.minutesSinceSync < 60 ? t('home.ago', { min: d.minutesSinceSync }) : t('home.agoH', { h: Math.floor(d.minutesSinceSync / 60), min: d.minutesSinceSync % 60 })) : ''}
          </T>
        </Row>
        <Row
          gap={8}
          style={{ alignItems: 'flex-end' }}
          // Lectura accesible completa: valor, unidad, tendencia y estado.
        >
          <View
            accessible
            accessibilityLabel={t('home.glucoseA11y', {
              v,
              trend: t(`trend.${d.trend}`),
              status: t(`status.${status}`),
            })}
            style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}
          >
            <T v="big" color={d.syncOk ? valueColor : colors.secondary}>
              {v || '—'}
            </T>
            <View style={{ paddingBottom: 8 }}>
              <T v="title" color={d.syncOk ? valueColor : colors.secondary}>
                {TREND_ARROW[d.trend]}
              </T>
              <T v="small" color={colors.secondary}>
                mg/dL
              </T>
            </View>
          </View>
        </Row>
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 14,
            backgroundColor: status === 'low' ? '#FDE7E5' : status === 'high' ? colors.softCoral : status === 'stale' ? colors.line : colors.softGreen,
          }}
        >
          <T v="label" color={valueColor}>
            {t(`status.${status}`)}
          </T>
        </View>
        {status === 'low' && (
          <T v="small" color={colors.secondary}>
            {t('home.sensorAlarmNote')}
          </T>
        )}
        <GlucoseChart series={d.series} label={t('home.chartA11y', { tir: d.tir.inRange })} />
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">{t('home.tirTitle')}</T>
          <T v="h2" color={colors.greenText}>
            {d.tir.inRange}%
          </T>
        </Row>
        <View style={{ flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' }} accessible accessibilityLabel={t('home.tirA11y', d.tir)}>
          <View style={{ flex: d.tir.low || 0.0001, backgroundColor: colors.low }} />
          <View style={{ flex: d.tir.inRange || 0.0001, backgroundColor: colors.owiGreen }} />
          <View style={{ flex: d.tir.high || 0.0001, backgroundColor: colors.coral }} />
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="small" color={colors.secondary}>
            {t('home.below', { n: d.tir.low })}
          </T>
          <T v="small" color={colors.secondary}>
            {t('home.above', { n: d.tir.high })}
          </T>
        </Row>
        <T v="small" color={colors.secondary}>
          {t('home.targetBy', { low: DEFAULT_TARGET.low, high: DEFAULT_TARGET.high, who: TEAM.endo.name })}
        </T>
      </Card>

      <Card>
        <T v="h2">{t('home.habitsTitle')}</T>
        <T v="small" color={colors.secondary}>
          {t('home.habitsNote')}
        </T>
        {(Object.keys(d.habitsToday) as HabitId[]).map((h) => {
          const done = d.habitsToday[h];
          return (
            <Row key={h} gap={12} style={{ minHeight: 48 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? colors.greenText : colors.softGreen,
                }}
              >
                <Icon name={done ? 'check' : HABIT_ICON[h]} size={22} color={done ? colors.white : colors.greenText} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="label">{t(`habit.${h}`)}</T>
                {h === 'walk' && (
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <ProgressBar value={(STEPS_TODAY / STEPS_GOAL) * 100} height={8} />
                    <T v="small" color={colors.secondary}>
                      {t('home.steps', { n: STEPS_TODAY.toLocaleString('es-ES'), goal: STEPS_GOAL.toLocaleString('es-ES') })}
                    </T>
                  </View>
                )}
              </View>
              <T v="small" color={done ? colors.greenText : colors.secondary}>
                {done ? t('common.done') : t('common.pending')}
              </T>
            </Row>
          );
        })}
        {!d.habitsToday.log && <Button kind="secondary" label={t('home.logNow')} onPress={() => go('log')} />}
      </Card>
    </Screen>
  );
}
