/**
 * Modo presentación: recorrido guiado para enseñar la demo.
 * - Carga en cada paso el perfil y la situación de ejemplo, abre la pantalla y muestra "qué contar".
 * - Avance automático o manual (botones, o ← → espacio y H con teclado).
 * - Guarda los datos de la persona al empezar y los devuelve al salir. Sobrevive a recargar la página.
 * Se abre desde Yo → "Enseñar la demo" o con la dirección web terminada en #demo.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../components/icons';
import { FadeIn, Pop } from '../components/motion';
import OwiSprite from '../components/OwiSprite';
import { Button, Row, T } from '../components/ui';
import { t } from '../i18n';
import type { LogSection, Tab } from '../nav';
import { owiThink } from '../owi/brain';
import { derive, initialState, reducer, useStore } from '../state/store';
import type { AppState, PetMood } from '../state/types';
import { colors, fonts, isDark } from '../theme';
import { AUDIENCES, minutesFor, stepsFor, type Audience, type Step } from './script';

const KEY = 'towigo.presenter';
type Saved = { aud: Audience; i: number; auto: boolean; snapshot: AppState };

const web = Platform.OS === 'web' && typeof window !== 'undefined';
function read(): Saved | null {
  if (!web) return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}
function write(v: Saved | null) {
  if (!web) return;
  try {
    if (v) localStorage.setItem(KEY, JSON.stringify(v));
    else localStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento */
  }
}
export const wantsDemo = () => web && /^#(demo|presentacion)/.test(window.location.hash);

type Ctx = {
  active: boolean;
  step: Step | null;
  openSheet: () => void;
};
const PresCtx = createContext<Ctx>({ active: false, step: null, openSheet: () => {} });
export const usePresenter = () => useContext(PresCtx);

const MOODS: PetMood[] = [
  'happy',
  'attentive',
  'caringHigh',
  'celebrate',
  'worriedHigh',
  'caringLow',
  'remind',
  'sport',
  'confused',
  'worriedLow',
  'missYou',
  'sleep',
];

/** Estado de partida de la demo: datos de ejemplo limpios, con el nombre, avatar y Owi de la persona. */
function demoStart(me: AppState): AppState {
  const s = initialState();
  return {
    ...s,
    onboarded: true,
    userName: me.userName || 'Laura',
    avatar: me.avatar,
    pet: me.pet,
    consents: { healthData: true, careTeam: true, productAnalytics: false },
    petLevelSeen: 4,
  };
}

export function PresenterProvider({ go, children }: { go: (t: Tab, s?: LogSection) => void; children: (p: PresenterApi) => ReactNode }) {
  const { state, dispatch } = useStore();
  const saved = useRef(read());
  const [aud, setAud] = useState<Audience | null>(saved.current?.aud ?? null);
  const [i, setI] = useState(saved.current?.i ?? 0);
  const [auto, setAuto] = useState(saved.current?.auto ?? false);
  const [mini, setMini] = useState(false);
  const [sheet, setSheet] = useState(() => !saved.current && wantsDemo());
  const snapshot = useRef<AppState | null>(saved.current?.snapshot ?? null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const steps = useMemo(() => (aud ? stepsFor(aud) : []), [aud]);
  const step = aud ? steps[Math.min(i, steps.length - 1)] : null;

  const start = (a: Audience, withAuto: boolean) => {
    snapshot.current = stateRef.current;
    dispatch({ type: 'hydrate', state: demoStart(stateRef.current) });
    setAud(a);
    setI(0);
    setAuto(withAuto);
    setMini(false);
    setSheet(false);
  };
  const stop = useCallback(() => {
    if (snapshot.current) dispatch({ type: 'hydrate', state: snapshot.current });
    snapshot.current = null;
    setAud(null);
    setAuto(false);
    write(null);
    if (web && wantsDemo()) history.replaceState(null, '', window.location.pathname + window.location.search);
    go('home');
  }, [dispatch, go]);
  const next = useCallback(() => setI((x) => Math.min(x + 1, steps.length - 1)), [steps.length]);
  const prev = useCallback(() => setI((x) => Math.max(x - 1, 0)), []);

  // Recordar dónde va (por si se recarga la página).
  useEffect(() => {
    if (aud && snapshot.current) write({ aud, i, auto, snapshot: snapshot.current });
  }, [aud, i, auto]);

  // Aplicar el paso: perfil, situación, aviso y pantalla.
  useEffect(() => {
    if (!step) return;
    const s = stateRef.current;
    const profileChanged = !!step.profile && step.profile !== s.profile;
    if (profileChanged) dispatch({ type: 'setProfile', profile: step.profile! });
    if (step.scenario && (profileChanged || step.scenario !== s.scenario || (step.reminder === null && s.demoReminder)))
      dispatch({ type: 'setScenario', scenario: step.scenario });
    if (step.reminder) dispatch({ type: 'setDemoReminder', kind: step.reminder });
    dispatch({ type: 'seenLevel', level: 4 });
    // Conversación de ejemplo con Owi (una sola vez): responde el cerebro local con los datos de ejemplo.
    if (step.chat && !s.owiChat.some((m) => m.from === 'me')) {
      const sim = step.profile && profileChanged ? reducer(s, { type: 'setProfile', profile: step.profile }) : s;
      const msgs: AppState['owiChat'] = [];
      const add = (from: 'me' | 'owi', text: string) => msgs.push({ id: `demo${msgs.length}`, from, text, at: new Date().toISOString() });
      add('owi', t('chat.welcome', { name: sim.userName, owi: sim.pet.name }));
      for (const k of step.chat) {
        add('me', t(k));
        add('owi', owiThink(t(k), sim, derive(sim, Date.now())).text);
      }
      for (const m of msgs) dispatch({ type: 'chat', from: m.from, text: m.text });
    }
    if (step.view === 'home' || step.view === 'log' || step.view === 'team' || step.view === 'progress' || step.view === 'me' || step.view === 'owi')
      go(step.view, step.section);
  }, [step?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Avance automático.
  useEffect(() => {
    if (!step || !auto) return;
    if (i >= steps.length - 1) {
      setAuto(false);
      return;
    }
    const id = setTimeout(next, (step.secs ?? 9) * 1000);
    return () => clearTimeout(id);
  }, [auto, i, step, steps.length, next]);

  // Teclado (web): ← → espacio H Esc.
  useEffect(() => {
    if (!web || !aud) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') (setAuto(false), next());
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') (setAuto(false), prev());
      else if (e.key === ' ') (e.preventDefault(), setAuto((a) => !a));
      else if (e.key === 'h' || e.key === 'H') setMini((m) => !m);
      else if (e.key === 'Escape') setMini(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aud, next, prev]);

  const api: PresenterApi = {
    active: !!aud,
    step,
    index: i,
    total: steps.length,
    auto,
    mini,
    sheet,
    next: () => (setAuto(false), next()),
    prev: () => (setAuto(false), prev()),
    restart: () => (setI(0), setAuto(false)),
    toggleAuto: () => setAuto((a) => !a),
    toggleMini: () => setMini((m) => !m),
    stop,
    start,
    closeSheet: () => {
      setSheet(false);
      if (web && wantsDemo()) history.replaceState(null, '', window.location.pathname + window.location.search);
    },
  };
  return <PresCtx.Provider value={{ active: !!aud, step, openSheet: () => setSheet(true) }}>{children(api)}</PresCtx.Provider>;
}

export type PresenterApi = {
  active: boolean;
  step: Step | null;
  index: number;
  total: number;
  auto: boolean;
  mini: boolean;
  sheet: boolean;
  next: () => void;
  prev: () => void;
  restart: () => void;
  toggleAuto: () => void;
  toggleMini: () => void;
  stop: () => void;
  start: (a: Audience, auto: boolean) => void;
  closeSheet: () => void;
};

// ---------------------------------------------------------------- piezas visuales

function RoundBtn({ icon, label, onPress, primary, size = 40 }: { icon: IconName; label: string; onPress: () => void; primary?: boolean; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? colors.greenText : colors.chip,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={size * 0.5} color={primary ? colors.onAccent : colors.ink} />
    </Pressable>
  );
}

/** Barra del presentador: capítulo, paso, título, qué contar y controles. */
export function PresenterBar({ p, bottom }: { p: PresenterApi; bottom: number }) {
  if (!p.active || !p.step) return null;
  const s = p.step;
  const progress = (p.index + 1) / p.total;
  if (p.mini) {
    return (
      <View
        style={{
          position: 'absolute',
          right: 14,
          bottom,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          padding: 6,
          borderRadius: 26,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.line,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <RoundBtn icon="back" label={t('pres.prev')} onPress={p.prev} size={36} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('pres.max')} onPress={p.toggleMini} style={{ paddingHorizontal: 8 }}>
          <T v="label" style={{ fontFamily: fonts.semibold }}>
            {t('pres.step', { i: p.index + 1, n: p.total })}
          </T>
        </Pressable>
        <RoundBtn icon="next" label={t('pres.next')} onPress={p.next} primary size={36} />
      </View>
    );
  }
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center', paddingHorizontal: 12 }}>
      <FadeIn key={s.id} from={8} style={{ width: '100%', maxWidth: 560 }}>
        <View
          accessibilityLiveRegion="polite"
          style={{
            borderRadius: 22,
            backgroundColor: isDark ? 'rgba(18,24,44,0.97)' : 'rgba(255,255,255,0.98)',
            borderWidth: 1,
            borderColor: colors.line,
            padding: 14,
            gap: 8,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.5 : 0.16,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={8} style={{ flex: 1 }}>
              <View style={{ paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: colors.softGreen, justifyContent: 'center' }}>
                <T v="small" color={colors.greenText} style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.4 }}>
                  {t(`pres.ch.${s.chapter}`).toUpperCase()}
                </T>
              </View>
              <T v="small" color={colors.secondary}>
                {t('pres.step', { i: p.index + 1, n: p.total })}
              </T>
            </Row>
            <Row gap={6}>
              <RoundBtn icon="minimize" label={t('pres.min')} onPress={p.toggleMini} size={30} />
              <RoundBtn icon="close" label={t('pres.exit')} onPress={p.stop} size={30} />
            </Row>
          </Row>
          <T v="h2">{t(`pres.s.${s.id}.title`)}</T>
          <T v="small" color={colors.secondary} style={{ fontSize: 14, lineHeight: 20 }}>
            {t(`pres.s.${s.id}.say`)}
          </T>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.chip, overflow: 'hidden', marginTop: 2 }}>
            <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: colors.greenText }} />
          </View>
          <Row gap={10} style={{ justifyContent: 'space-between' }}>
            <RoundBtn icon="back" label={t('pres.prev')} onPress={p.prev} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={p.auto ? t('pres.pause') : t('pres.play')}
              onPress={p.toggleAuto}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.chip,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Icon name={p.auto ? 'pause' : 'play'} size={18} color={colors.ink} />
              <T v="label">{p.auto ? t('pres.pause') : t('pres.play')}</T>
            </Pressable>
            {p.index < p.total - 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('pres.next')}
                onPress={p.next}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 16,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.greenText,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <T v="label" color={colors.onAccent}>
                  {t('pres.next')}
                </T>
                <Icon name="next" size={18} color={colors.onAccent} />
              </Pressable>
            ) : (
              <Button style={{ minHeight: 40 }} label={t('pres.exit')} onPress={p.stop} />
            )}
          </Row>
        </View>
      </FadeIn>
    </View>
  );
}

/** Fondo de las diapositivas propias (portada, Owi, cierre). */
function Slide({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const g: [string, string, string] = isDark ? ['#1A1F45', '#0E1430', '#0A0F1E'] : ['#E4DBFF', '#F1ECFF', '#F4F1FA'];
  return (
    <LinearGradient colors={g} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top + 24,
          paddingBottom: 260,
          paddingHorizontal: 22,
        }}
      >
        <View style={{ width: '100%', maxWidth: 560, alignItems: 'center', gap: 14 }}>{children}</View>
      </ScrollView>
    </LinearGradient>
  );
}

function Pillar({ icon, text, color }: { icon: IconName; text: string; color: string }) {
  return (
    <Row
      gap={12}
      style={{ alignSelf: 'stretch', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)', borderRadius: 16, padding: 12 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: color }}>
        <Icon name={icon} size={20} color="#FFFFFF" />
      </View>
      <T v="label" style={{ flex: 1 }}>
        {text}
      </T>
    </Row>
  );
}

/** Marca: tile con degradado y el icono de señal (producto tecnológico; Owi no protagoniza la portada). */
function BrandMark({ size = 72 }: { size?: number }) {
  return (
    <LinearGradient colors={['#7C6CFF', '#3DE0C8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="signal" size={size * 0.5} color="#FFFFFF" stroke={2.4} />
    </LinearGradient>
  );
}

export function CoverSlide() {
  return (
    <Slide>
      <BrandMark />
      <T v="title" center style={{ fontSize: 40, lineHeight: 46 }}>
        Towigo
      </T>
      <T v="label" center color={colors.secondary}>
        {t('pres.cover.tag')}
      </T>
      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 6 }}>
        <Pillar icon="signal" text={t('pres.cover.p1')} color="#7C6CFF" />
        <Pillar icon="chat" text={t('pres.cover.p2')} color="#14B8A6" />
        <Pillar icon="steth" text={t('pres.cover.p3')} color="#E5487F" />
      </View>
    </Slide>
  );
}

export function OwiShowSlide() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setK((x) => x + 1), 2600);
    return () => clearInterval(id);
  }, []);
  const mood = MOODS[k % MOODS.length];
  return (
    <Slide>
      <Pressable accessibilityRole="button" accessibilityLabel={t('pres.owi.tap')} onPress={() => setK((x) => x + 1)}>
        <OwiSprite mood={mood} size={220} />
      </Pressable>
      <Pop trigger={mood}>
        <T v="title" center>
          {t(`pres.mood.${mood}`)}
        </T>
      </Pop>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
        {MOODS.map((m, j) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityLabel={t(`pres.mood.${m}`)}
            onPress={() => setK(j)}
            style={{
              paddingHorizontal: 10,
              height: 28,
              borderRadius: 14,
              justifyContent: 'center',
              backgroundColor: m === mood ? colors.greenText : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
            }}
          >
            <T v="small" color={m === mood ? colors.onAccent : colors.secondary} style={{ fontSize: 12 }}>
              {t(`pres.mood.${m}`)}
            </T>
          </Pressable>
        ))}
      </View>
      <T v="small" center color={colors.secondary}>
        {t('pres.owi.tap')}
      </T>
    </Slide>
  );
}

export function EndSlide({ p }: { p: PresenterApi }) {
  return (
    <Slide>
      <BrandMark size={60} />
      <T v="title" center style={{ fontSize: 34, lineHeight: 40 }}>
        {t('pres.s.end.title')}
      </T>
      <View style={{ alignSelf: 'stretch', gap: 10 }}>
        <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, letterSpacing: 0.5 }}>
          {t('pres.end.next').toUpperCase()}
        </T>
        <Pillar icon="user" text={t('pres.end.n1')} color="#7C6CFF" />
        <Pillar icon="lock" text={t('pres.end.n2')} color="#14B8A6" />
        <Pillar icon="signal" text={t('pres.end.n3')} color="#E5487F" />
      </View>
      <Row gap={10} style={{ alignSelf: 'stretch', marginTop: 6 }}>
        <Button style={{ flex: 1 }} kind="secondary" label={t('pres.again')} onPress={p.restart} />
        <Button style={{ flex: 1 }} label={t('pres.exit')} onPress={p.stop} />
      </Row>
    </Slide>
  );
}

/** Hoja para empezar: a quién se le enseña y si avanza solo. */
export function StartSheet({ p }: { p: PresenterApi }) {
  const [aud, setAud] = useState<Audience>('quick');
  const [auto, setAuto] = useState(false);
  if (!p.sheet) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,10,22,0.55)' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 14 }}>
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: colors.white,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: colors.line,
            padding: 18,
            gap: 12,
          }}
        >
          <Row gap={12}>
            <OwiSprite mood="happy" size={64} />
            <View style={{ flex: 1 }}>
              <T v="h2">{t('pres.title')}</T>
              <T v="small" color={colors.secondary}>
                {t('pres.sub')}
              </T>
            </View>
          </Row>
          <T v="label">{t('pres.audience')}</T>
          <View style={{ gap: 8 }}>
            {AUDIENCES.map((a) => {
              const on = a === aud;
              return (
                <Pressable
                  key={a}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setAud(a)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: on ? colors.greenText : colors.line,
                    backgroundColor: on ? colors.softGreen : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: on ? colors.greenText : colors.secondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.greenText }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <T v="label">{t(`pres.aud.${a}`)}</T>
                      <T v="small" color={colors.secondary} style={{ fontSize: 12 }}>
                        {t('pres.meta', { n: stepsFor(a).length, min: minutesFor(a) })}
                      </T>
                    </Row>
                    <T v="small" color={colors.secondary}>
                      {t(`pres.aud.${a}.sub`)}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: auto }}
            onPress={() => setAuto((x) => !x)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}
          >
            <View style={{ flex: 1 }}>
              <T v="label">{t('pres.auto')}</T>
              <T v="small" color={colors.secondary}>
                {t('pres.autoSub')}
              </T>
            </View>
            <View
              style={{
                width: 46,
                height: 28,
                borderRadius: 14,
                padding: 3,
                backgroundColor: auto ? colors.greenText : colors.chip,
                alignItems: auto ? 'flex-end' : 'flex-start',
              }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' }} />
            </View>
          </Pressable>
          {web && (
            <T v="small" color={colors.secondary}>
              {t('pres.keys')}
            </T>
          )}
          <Row gap={10}>
            <Button style={{ flex: 1 }} kind="secondary" label={t('pres.cancel')} onPress={p.closeSheet} />
            <Button
              style={{ flex: 1 }}
              label={t('pres.start')}
              icon={<Icon name="play" size={18} color={colors.onAccent} />}
              onPress={() => p.start(aud, auto)}
            />
          </Row>
        </View>
      </ScrollView>
    </View>
  );
}
