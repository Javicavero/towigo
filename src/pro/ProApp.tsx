/**
 * Towigo Pro — panel del equipo sanitario (endocrinología, nutrición, psicología).
 * Escritorio primero, adaptable a tablet y móvil. Demo: 12 pacientes simulados + "tú" (la app de este navegador),
 * de modo que lo que el profesional cambia en tu pauta u objetivos llega a tu app.
 */
import { createContext, useContext, useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../components/icons';
import { Row, T } from '../components/ui';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { reducer, useStore, type Action } from '../state/store';
import type { AppState, TeamRole } from '../state/types';
import { colors, fonts, isDark } from '../theme';
import { buildCohort, metricsFor, type Metrics, type Patient } from './cohort';
import Inbox from './Inbox';
import PatientDetail from './PatientDetail';
import PatientList from './PatientList';

export type Note = { id: string; at: string; author: TeamRole; text: string };
const NOTES_KEY = 'towigo.pro.notes';
const loadNotes = (): Record<string, Note[]> => {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}');
  } catch {
    return {};
  }
};

type Ctx = {
  patients: (Patient & { s: AppState; m: Metrics })[];
  get: (id: string) => (Patient & { s: AppState; m: Metrics }) | undefined;
  send: (id: string, a: Action) => void;
  role: TeamRole;
  setRole: (r: TeamRole) => void;
  notes: Record<string, Note[]>;
  addNote: (id: string, text: string) => void;
  open: (id: string, tab?: string) => void;
};
const ProCtx = createContext<Ctx | null>(null);
export const usePro = () => {
  const v = useContext(ProCtx);
  if (!v) throw new Error('usePro fuera de ProApp');
  return v;
};

type View_ = { k: 'list' } | { k: 'inbox' } | { k: 'patient'; id: string; tab?: string };

/** Barra lateral: azul noche en modo oscuro, blanca en modo claro (el tema nunca se mezcla). */
const S = isDark
  ? {
      bg: '#060A16',
      title: '#F2F5FF',
      sub: '#7F8BAE',
      accent: '#3DE0C8',
      onAccent: '#06131A',
      activeBg: 'rgba(61,224,200,0.14)',
      hover: 'rgba(255,255,255,0.05)',
      icon: '#93A0BF',
      label: '#C4CCE2',
      roleBg: 'rgba(255,255,255,0.06)',
      border: 'transparent',
    }
  : {
      bg: '#FFFFFF',
      title: '#1B1630',
      sub: '#5E5873',
      accent: '#5B3DE0',
      onAccent: '#FFFFFF',
      activeBg: 'rgba(91,61,224,0.10)',
      hover: 'rgba(27,22,48,0.04)',
      icon: '#6B6680',
      label: '#3A3550',
      roleBg: 'rgba(27,22,48,0.05)',
      border: 'rgba(27,22,48,0.08)',
    };
export const SIDEBAR_BG = S.bg;

export default function ProApp({ onBack, initialPatient }: { onBack?: () => void; initialPatient?: string } = {}) {
  const { state: me, dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [cohort, setCohort] = useState(() => buildCohort());
  const [role, setRole] = useState<TeamRole>('endo');
  const [view, setView] = useState<View_>(initialPatient ? { k: 'patient', id: initialPatient } : { k: 'list' });
  const [notes, setNotes] = useState<Record<string, Note[]>>(loadNotes);

  const patients = useMemo(() => {
    const meP = { id: 'me', name: `${me.userName || t('pro.demoPatient')} (${t('pro.you')})`, age: 44, isMe: true, s: me, m: metricsFor(me) };
    const rest = cohort.patients.map((p) => ({ ...p, s: cohort.states[p.id], m: metricsFor(cohort.states[p.id]) }));
    return [meP, ...rest];
  }, [cohort, me]);

  const ctx: Ctx = {
    patients,
    get: (id) => patients.find((p) => p.id === id),
    send: (id, a) => (id === 'me' ? dispatch(a) : setCohort((c) => ({ ...c, states: { ...c.states, [id]: reducer(c.states[id], a) } }))),
    role,
    setRole,
    notes,
    addNote: (id, text) =>
      setNotes((n) => {
        const next = { ...n, [id]: [{ id: Math.random().toString(36).slice(2), at: new Date().toISOString(), author: role, text }, ...(n[id] ?? [])] };
        try {
          localStorage.setItem(NOTES_KEY, JSON.stringify(next));
        } catch {
          /* sin almacenamiento */
        }
        return next;
      }),
    open: (id, tab) => setView({ k: 'patient', id, tab }),
  };

  const pending = patients.reduce((a, p) => a + p.m.pendingMsgs, 0);
  const review = patients.filter((p) => p.m.priority === 'high').length;
  const nav: { k: 'list' | 'inbox'; icon: IconName; label: string; badge?: number }[] = [
    { k: 'list', icon: 'user', label: t('pro.nav.patients'), badge: review },
    { k: 'inbox', icon: 'chat', label: t('pro.nav.inbox'), badge: pending },
  ];
  const back = () => {
    if (onBack) return onBack();
    window.location.hash = '';
    window.location.reload();
  };

  const sidebar = (
    <View
      style={{
        width: wide ? 248 : '100%',
        backgroundColor: S.bg,
        borderRightWidth: wide ? 1 : 0,
        borderBottomWidth: wide ? 0 : 1,
        borderColor: S.border,
        paddingTop: insets.top + 18,
        paddingHorizontal: 14,
        paddingBottom: 14,
        gap: 18,
      }}
    >
      <Row gap={10} style={{ paddingHorizontal: 6 }}>
        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: S.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="steth" size={18} color={S.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="label" color={S.title}>
            Towigo Pro
          </T>
          <T v="small" color={S.sub} style={{ fontSize: 11 }}>
            {t('pro.clinic')}
          </T>
        </View>
        {!wide && (
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t('pro.backToApp')}>
            <T v="small" color={S.accent}>
              {t('pro.backShort')}
            </T>
          </Pressable>
        )}
      </Row>
      <View style={{ flexDirection: wide ? 'column' : 'row', gap: 4 }}>
        {nav.map((n) => {
          const active = view.k === n.k || (n.k === 'list' && view.k === 'patient');
          return (
            <Pressable
              key={n.k}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setView({ k: n.k })}
              style={(st) => ({
                flex: wide ? undefined : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 10,
                height: 40,
                borderRadius: 10,
                backgroundColor: active ? S.activeBg : hov(st) ? S.hover : 'transparent',
              })}
            >
              <Icon name={n.icon} size={18} color={active ? S.accent : S.icon} />
              <T v="label" color={active ? S.title : S.label} style={{ flex: 1 }}>
                {n.label}
              </T>
              {!!n.badge && (
                <View
                  style={{
                    minWidth: 22,
                    height: 20,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    backgroundColor: n.k === 'list' ? '#FF5C8A' : '#7C6CFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T v="small" color="#FFFFFF" style={{ fontSize: 11, lineHeight: 14 }}>
                    {n.badge}
                  </T>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {wide && (
        <>
          <View style={{ flex: 1 }} />
          <T v="small" color={S.sub} style={{ paddingHorizontal: 6, fontSize: 11, letterSpacing: 0.4 }}>
            {t('pro.signedAs').toUpperCase()}
          </T>
          <View style={{ gap: 4 }}>
            {(Object.keys(TEAM) as TeamRole[]).map((r) => (
              <Pressable
                key={r}
                accessibilityRole="radio"
                accessibilityState={{ selected: role === r }}
                onPress={() => setRole(r)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: role === r ? S.roleBg : 'transparent',
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: TEAM[r].color, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="small" color="#FFFFFF" style={{ fontSize: 11, fontFamily: fonts.semibold }}>
                    {TEAM[r].initials}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="small" color={role === r ? S.title : S.icon} style={{ fontFamily: fonts.medium }}>
                    {TEAM[r].name}
                  </T>
                  <T v="small" color={S.sub} style={{ fontSize: 11 }}>
                    {t(`pro.role.${r}`)}
                  </T>
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={back} accessibilityRole="button" style={{ padding: 8 }}>
            <T v="small" color={S.accent}>
              {t('pro.backToApp')}
            </T>
          </Pressable>
        </>
      )}
    </View>
  );

  return (
    <ProCtx.Provider value={ctx}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: colors.cream }}>
        {sidebar}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: wide ? 28 : 14, paddingBottom: 60, gap: 16, width: '100%', maxWidth: 1240, alignSelf: 'center' }}
        >
          {view.k === 'list' && <PatientList />}
          {view.k === 'inbox' && <Inbox />}
          {view.k === 'patient' && <PatientDetail id={view.id} tab={view.tab} onBack={() => setView({ k: 'list' })} />}
        </ScrollView>
      </View>
    </ProCtx.Provider>
  );
}

/** Pastilla de prioridad / etiqueta. */
export function Pill({ tone, label }: { tone: 'high' | 'med' | 'ok' | 'info'; label: string }) {
  const map = {
    high: [colors.softCoral, colors.coralText],
    med: [colors.softYellow, colors.yellowDark],
    ok: [colors.softGreen, colors.greenText],
    info: [colors.softBlue, colors.blue],
  }[tone];
  return (
    <View style={{ backgroundColor: map[0], borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <T v="small" color={map[1]} style={{ fontFamily: fonts.semibold, fontSize: 12 }}>
        {label}
      </T>
    </View>
  );
}

/** Panel/superficie del escritorio. */
export function Panel({ children, title, right, style }: { children: React.ReactNode; title?: string; right?: React.ReactNode; style?: object }) {
  return (
    <View style={[{ backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 12 }, style]}>
      {(title || right) && (
        <Row style={{ justifyContent: 'space-between' }}>
          {title ? (
            <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold, letterSpacing: 0.5 }}>
              {title.toUpperCase()}
            </T>
          ) : (
            <View />
          )}
          {right}
        </Row>
      )}
      {children}
    </View>
  );
}

/** KPI grande. */
export function Kpi({ label, value, unit, sub, tone }: { label: string; value: string; unit?: string; sub?: string; tone?: string }) {
  return (
    <View
      style={{ flexGrow: 1, flexBasis: 150, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 4 }}
    >
      <T v="small" color={colors.secondary} style={{ fontFamily: fonts.medium }}>
        {label}
      </T>
      <Row gap={4} style={{ alignItems: 'flex-end' }}>
        <T v="title" color={tone ?? colors.ink}>
          {value}
        </T>
        {unit ? (
          <T v="small" color={colors.secondary} style={{ paddingBottom: 5 }}>
            {unit}
          </T>
        ) : null}
      </Row>
      {sub ? (
        <T v="small" color={colors.secondary}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

/** react-native-web expone "hovered" en el estado de Pressable (útil en escritorio). */
export const hov = (st: object) => !!(st as { hovered?: boolean }).hovered;
