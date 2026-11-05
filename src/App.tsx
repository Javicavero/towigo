// Importamos solo los 4 pesos que usamos (el paquete completo pesa ~2,5 MB).
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './components/icons';
import { Bouncy, FadeIn } from './components/motion';
import { T } from './components/ui';
import { t } from './i18n';
import { NavContext, type LogSection, type Tab } from './nav';
import Home from './screens/Home';
import LogScreen from './screens/LogScreen';
import Me from './screens/Me';
import Onboarding from './screens/Onboarding';
import Progress from './screens/Progress';
import Team from './screens/Team';
import { useDexcomSync } from './services/useDexcomSync';
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
        backgroundColor: colors.white,
        borderTopWidth: 2,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
      }}
    >
      <View style={{ flexDirection: 'row', maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        {TABS.map(({ id, icon }) => {
          const active = tab === id;
          const isLog = id === 'log';
          const badge = id === 'team' && d.unreadCount > 0;
          return (
            <Bouncy
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(`tab.${id}`) + (badge ? `, ${t('tab.unread', { n: d.unreadCount })}` : '')}
              onPress={() => go(id)}
              scaleTo={0.88}
              outerStyle={{ flex: 1 }}
              style={{ alignItems: 'center', justifyContent: 'center', minHeight: 60, gap: 2 }}
            >
              <View
                style={{
                  width: isLog ? 58 : 52,
                  height: isLog ? 58 : 38,
                  borderRadius: isLog ? 18 : 14,
                  marginTop: isLog ? -24 : 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLog ? colors.coralText : active ? colors.softGreen : 'transparent',
                  borderWidth: active && !isLog ? 2 : 0,
                  borderColor: colors.greenText,
                  borderBottomWidth: isLog ? 5 : active ? 3 : 0,
                  borderBottomColor: isLog ? colors.coralShadow : colors.greenText,
                }}
              >
                <Icon name={icon} size={isLog ? 32 : 26} color={isLog ? colors.white : active ? colors.greenText : colors.secondary} stroke={isLog ? 3.2 : active ? 2.6 : 2.2} />
                {badge && (
                  <View style={{ position: 'absolute', top: -2, right: 2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.coralText, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
                    <T v="small" color={colors.white} style={{ fontSize: 10, lineHeight: 12 }}>
                      {d.unreadCount}
                    </T>
                  </View>
                )}
              </View>
              <T v="small" color={active ? colors.greenText : colors.secondary} style={{ fontSize: 12, lineHeight: 15 }}>
                {t(`tab.${id}`)}
              </T>
            </Bouncy>
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
  const [tab, setTab] = useState<Tab>('home');
  const [section, setSection] = useState<LogSection | null>(null);
  const go = (t: Tab, sec?: LogSection) => {
    setSection(sec ?? null);
    setTab(t);
  };
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
        </TabScreen>
        <TabBar tab={tab} go={(t) => go(t)} />
      </View>
    </NavContext.Provider>
  );
}

export default function App() {
  const [loaded] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
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
