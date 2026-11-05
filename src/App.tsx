// Inter: tipografía clara y profesional. Solo los 4 pesos que usamos.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './components/icons';
import { FadeIn } from './components/motion';
import { T } from './components/ui';
import { t } from './i18n';
import { NavContext, type LogSection, type Tab } from './nav';
import Home from './screens/Home';
import LogScreen from './screens/LogScreen';
import Me from './screens/Me';
import Onboarding from './screens/Onboarding';
import OwiChat from './screens/OwiChat';
import Progress from './screens/Progress';
import Team from './screens/Team';
import { useDexcomSync } from './services/useDexcomSync';
import { useWidgetSync } from './widgets/useWidgetSync';
import { StoreProvider, useStore } from './state/store';
import { colors } from './theme';

const TABS: { id: Tab; icon: IconName }[] = [
  { id: 'home', icon: 'home' },
  { id: 'team', icon: 'chat' },
  { id: 'log', icon: 'plus' },
  { id: 'progress', icon: 'trophy' },
  { id: 'me', icon: 'user' },
];

function TabBar({ tab, go }: { tab: Tab; go: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const { d } = useStore();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#F9F9F9',
        borderTopWidth: 0.5,
        borderTopColor: colors.borderStrong,
        paddingBottom: Math.max(insets.bottom, 6),
        paddingTop: 6,
      }}
    >
      <View style={{ flexDirection: 'row', maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        {TABS.map(({ id, icon }) => {
          const active = tab === id;
          const badge = id === 'team' && d.unreadCount > 0;
          const c = active ? colors.greenText : '#8E8E93';
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(`tab.${id}`) + (badge ? `, ${t('tab.unread', { n: d.unreadCount })}` : '')}
              onPress={() => go(id)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, gap: 2 }}
            >
              <View>
                <Icon name={icon} size={26} color={c} stroke={active ? 2.4 : 2} />
                {badge && (
                  <View style={{ position: 'absolute', top: -4, right: -10, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#E5483A', alignItems: 'center', justifyContent: 'center' }}>
                    <T v="small" color={colors.white} style={{ fontSize: 11, lineHeight: 13 }}>
                      {d.unreadCount}
                    </T>
                  </View>
                )}
              </View>
              <T v="small" color={c} style={{ fontSize: 11, lineHeight: 14 }}>
                {t(`tab.${id}`)}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Transición al cambiar de pestaña: la pantalla entra con un pequeño deslizamiento. */
function TabScreen({ id, children }: { id: Tab; children: React.ReactNode }) {
  return (
    <FadeIn key={id} from={12} style={{ flex: 1 }}>
      {children}
    </FadeIn>
  );
}

function Root() {
  const { state } = useStore();
  useDexcomSync();
  useWidgetSync();
  const [tab, setTab] = useState<Tab>('home');
  const [section, setSection] = useState<LogSection | null>(null);
  const go = (t: Tab, sec?: LogSection) => {
    setSection(sec ?? null);
    setTab(t);
  };
  // Enlaces desde los widgets: towigo://hoy, towigo://registrar/inyeccion, towigo://registrar/medicacion
  useEffect(() => {
    const open = (url?: string | null) => {
      if (!url || !url.startsWith('towigo://')) return;
      const path = url.replace('towigo://', '');
      if (path.startsWith('registrar/inyeccion')) go('log', 'injection');
      else if (path.startsWith('registrar/medicacion')) go('log', 'meds');
      else if (path.startsWith('registrar')) go('log');
      else go('home');
    };
    Linking.getInitialURL().then(open).catch(() => {});
    const sub = Linking.addEventListener('url', (e) => open(e.url));
    return () => sub.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!state.onboarded) return <Onboarding />;
  return (
    <NavContext.Provider value={{ tab, section, go }}>
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <TabScreen id={tab}>
          {tab === 'home' && <Home />}
          {tab === 'log' && <LogScreen />}
          {tab === 'team' && <Team />}
          {tab === 'progress' && <Progress />}
          {tab === 'me' && <Me />}
          {tab === 'owi' && <OwiChat />}
        </TabScreen>
        <TabBar tab={tab} go={(t) => go(t)} />
      </View>
    </NavContext.Provider>
  );
}

export default function App() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
