/** Abre el panel profesional. En web es la misma app con "#pro" (en producción sería un dominio propio). */
import { Linking, Platform } from 'react-native';

export function openPro() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.hash = 'pro';
    window.location.reload();
  } else Linking.openURL('https://javicavero.github.io/towigo/#pro').catch(() => {});
}

export const isProRoute = () => Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.replace('#', '').startsWith('pro');
