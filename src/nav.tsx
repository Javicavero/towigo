import { createContext, useContext } from 'react';

export type Tab = 'home' | 'log' | 'team' | 'progress' | 'me' | 'owi';
/** Sección de "Registrar" que se abre directamente (p. ej. desde la tarjeta de inyección). */
export type LogSection = 'injection' | 'weight' | 'glucose' | 'meds' | 'effects' | 'intake' | 'strength' | 'insulin' | 'carbs';

export const NavContext = createContext<{ tab: Tab; section: LogSection | null; go: (t: Tab, section?: LogSection) => void }>({
  tab: 'home',
  section: null,
  go: () => {},
});
export const useNav = () => useContext(NavContext);
