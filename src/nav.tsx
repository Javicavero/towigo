import { createContext, useContext } from 'react';

export type Tab = 'home' | 'log' | 'team' | 'progress' | 'me';

export const NavContext = createContext<{ tab: Tab; go: (t: Tab) => void }>({ tab: 'home', go: () => {} });
export const useNav = () => useContext(NavContext);
