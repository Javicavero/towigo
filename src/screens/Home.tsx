/**
 * Hoy — panel de datos del día.
 * Arriba, los anillos del día y la cifra clave de cada perfil (glucosa, próxima inyección o peso).
 * Owi queda como asistente discreto: una tarjeta con su frase basada en tus datos y acciones rápidas.
 * Debajo: lo que toca hoy y el resumen.
 * Fase 1 (§8.2): datos, tendencias, hábitos y comunicación. Nunca indicaciones clínicas automáticas.
 */
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AvatarBadge from '../components/AvatarBadge';
import { CheckinCard } from '../components/checkin';
import { CheerCard } from '../components/crew';
import { Icon } from '../components/icons';
import { KpiStrip, Sparkline } from '../components/kpi';
import { Burst, FadeIn, Pop } from '../components/motion';
import OwiSticker from '../components/OwiSticker';
import { MaintenanceCard, SupportCard } from '../components/program';
import { RING, useDayRings } from '../components/rings';
import { glucoseColor, T1Card, TREND_ARROW } from '../components/t1';
import { SummaryGrid, TodayList } from '../components/today';
import { Button, Row, SectionTitle, T } from '../components/ui';
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

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');

/** Anillos compactos del día (plan · movimiento · proteína). */
function MiniRings({ rings, size = 124 }: { rings: { plan: number; move: number; food: number }; size?: number }) {
  const c0 = size / 2;
  const w = size * 0.085;
  const arc = (r: number, v: number, color: string) => {
    const c = 2 * Math.PI * r;
    return (
      <>
        <Circle cx={c0} cy={c0} r={r} stroke={color} strokeOpacity={isDark ? 0.2 : 0.16} strokeWidth={w} fill="none" />
        {v > 0.02 && <Circle cx={c0} cy={c0} r={r} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray={`${Math.min(1, v) * c} ${c}`} transform={`rotate(-90 ${c0} ${c0})`} />}
      </>
    );
  };
  return (
    <View accessible accessibilityLabel={t('rings.a11y', { p: Math.round(rings.plan * 100), m: Math.round(rings.move * 100), f: Math.round(rings.food * 100) })}>
      <Svg width={size} height={size}>
        {arc(c0 - w * 0.6, rings.plan, RING.plan)}
        {arc(c0 - w * 1.85, rings.move, RING.move)}
        {arc(c0 - w * 3.1, rings.food, RING.food)}
      </Svg>
    </View>
  );
}

/** La cifra que más importa hoy según el perfil. */
function useKeyMetric() {
  const { state, d } = useStore();
  const g = d.lastGlucose;
  const ago = g ? Math.round((Date.now() - new Date(g.at).getTime()) / 60e3) : 0;
  const sensor24 = state.glucose.filter((x) => Date.now() - new Date(x.at).getTime() < 24 * 3600e3).sort((a, b) => a.at.localeCompare(b.at)).map((x) => x.v);
  const wSeries = [...state.weights].sort((a, b) => a.at.localeCompare(b.at)).slice(-12).map((w) => w.kg);
  const weight = d.weightNow !== null ? { label: t('sum.weight'), value: fmt1(d.weightNow), unit: 'kg', sub: d.lostKg > 0 ? t('sum.lost', { kg: fmt1(d.lostKg) }) : '' } : null;
  if (isT1(state.profile) && g)
    return {
      main: { label: t('home.glucoseNow'), value: String(g.v), unit: 'mg/dL', arrow: d.trend ? TREND_ARROW[d.trend] : '', color: glucoseColor(g.v), sub: ago <= 1 ? t('t1.now') : t('home.ago', { min: ago }) },
      series: sensor24,
      seriesLabel: t('home.spark24'),
      side: { label: t('home.tirShort'), value: `${d.tir24}`, unit: '%', sub: t('home.tir24') },
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
        sub: d.injectedToday ? t('sum.injDone') : `${when.toLocaleDateString('es-ES', { weekday: 'long' })} · ${when.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      },
      side: weight,
      series: wSeries,
      seriesLabel: t('home.sparkWeight'),
    };
  }
  if (hasDiabetes(state.profile) && g)
    return { main: { label: t('sum.glucose'), value: String(g.v), unit: 'mg/dL', arrow: '', color: glucoseColor(g.v), sub: t(`ctx.${g.context}`) }, side: weight, series: wSeries, seriesLabel: t('home.sparkWeight') };
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
  const rawDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const [burst, setBurst] = useState(0);
  const allRings = rings.plan >= 1 && rings.move >= 1 && rings.food >= 1;
  const km = useKeyMetric();
  const [sparkW, setSparkW] = useState(300);

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
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: panel, borderWidth: 1, borderColor: border, paddingHorizontal: 10, height: 34, borderRadius: 17, opacity: pressed ? 0.7 : 1 })}
                >
                  <Icon name="flame" size={16} color={colors.coralDark} />
                  <T v="label">{d.streak}</T>
                </Pressable>
                <AvatarBadge avatar={d.owiAvatar} size={36} onPress={() => go('me')} label={t('avatar.you', { name })} />
              </Row>
            </Row>

            {/* Panel del día: anillos + cifra clave */}
            <FadeIn>
              <View style={{ backgroundColor: panel, borderWidth: 1, borderColor: border, borderRadius: 24, padding: 16, gap: 14 }}>
                <Row gap={16}>
                  <MiniRings rings={rings} />
                  <View style={{ flex: 1, gap: 10 }}>
                    {km.main && (
                      <Pressable accessibilityRole="button" accessibilityLabel={`${km.main.label}: ${km.main.value} ${km.main.unit}`} onPress={() => go(isT1(state.profile) ? 'progress' : usesGlp1(state.profile) ? 'log' : 'progress', usesGlp1(state.profile) && !isT1(state.profile) ? 'injection' : undefined)}>
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
                    <Sparkline values={km.series} color={isT1(state.profile) ? (isDark ? '#3DE0C8' : '#0FA394') : isDark ? '#A58FFF' : '#6A4FE0'} width={sparkW} height={44} band={isT1(state.profile) ? [70, 180] : undefined} />
                  </View>
                )}
                <Row style={{ borderTopWidth: 1, borderTopColor: border, paddingTop: 12 }}>
                  <Stat color={RING.plan} label={t('rings.plan')} value={`${rings.tasksDone}/${rings.tasksTotal}`} onPress={() => go('log')} />
                  <Stat color={RING.move} label={t('rings.move')} value={STEPS_TODAY.toLocaleString('es-ES')} onPress={() => go('progress')} />
                  <Stat color={RING.food} label={t('rings.food')} value={`${d.proteinToday}/${state.goals.proteinG} g`} onPress={() => go('log', 'intake')} />
                </Row>
              </View>
            </FadeIn>

            {/* Asistente: Owi en segundo plano, con su frase basada en tus datos */}
            <View style={{ backgroundColor: panel, borderWidth: 1, borderColor: border, borderRadius: 20, padding: 14, gap: 12 }}>
              <Row gap={12} style={{ alignItems: 'flex-start' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.nextTip', { owi: state.pet.name })}
                  onPress={() => setPoke((p) => p + 1)}
                  style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
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
                  <Button style={{ flex: 1, minHeight: 42 }} kind="secondary" label={t('rem.later')} onPress={() => dispatch({ type: 'snooze', id: reminder.id, minutes: 15 })} />
                </Row>
              ) : (
                <Row gap={8}>
                  <Button style={{ flex: 1, minHeight: 42 }} label={t('home.quickLog')} onPress={() => go('log')} icon={<Icon name="plus" size={18} color={colors.onAccent} />} />
                  <Button style={{ flex: 1, minHeight: 42 }} kind="secondary" label={t('home.ask')} onPress={() => go('owi')} icon={<Icon name="chat" size={18} color={colors.greenText} />} />
                </Row>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, gap: 12, marginTop: 10 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <SectionTitle>{t('home.week')}</SectionTitle>
            <Pressable accessibilityRole="button" onPress={() => go('progress')} hitSlop={8}>
              <T v="small" color={colors.greenText} style={{ fontFamily: fonts.semibold }}>
                {t('home.seeAll')}
              </T>
            </Pressable>
          </Row>
          <KpiStrip />
          {/* "Ahora": una sola cosa importante cada vez (apoyo > ánimo de tu gente > check-in). */}
          {d.supportReason ? <SupportCard /> : state.cheers.some((c) => !c.read) ? <CheerCard /> : !d.checkinToday ? <CheckinCard /> : null}
          {isT1(state.profile) && <T1Card compact />}
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
      <Burst fire={burst} />
    </View>
  );
}
