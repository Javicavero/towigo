import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { dayKey } from './dates';
import { derive, initialState, migrate, reducer, type Action, type Derived } from './logic';
import { clear, loadAsync, loadSync, save } from './storage';
import type { AppState, HabitId } from './types';

export * from './logic';

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; d: Derived } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Web: carga inmediata. Móvil: el almacenamiento es asíncrono, así que se hidrata al arrancar.
  const [state, rawDispatch] = useReducer(reducer, undefined, () => migrate(loadSync<AppState>() ?? null) ?? initialState());
  const [hydrated, setHydrated] = useState(() => loadSync<AppState>() !== undefined);
  const dispatch: React.Dispatch<Action> = (a) => {
    if (a.type === 'reset') clear();
    rawDispatch(a);
  };

  useEffect(() => {
    if (hydrated) return;
    let alive = true;
    loadAsync<AppState>().then((saved) => {
      if (!alive) return;
      const m = migrate(saved);
      if (m) rawDispatch({ type: 'hydrate', state: m });
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, [hydrated]);

  // No se guarda hasta haber leído lo que había: así no se pisa con el estado inicial.
  useEffect(() => {
    if (hydrated) save(state);
  }, [state, hydrated]);
  useEffect(() => {
    if (hydrated) rawDispatch({ type: 'opened' });
  }, [hydrated]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Cierre de día: al pasar la medianoche local (o al abrir la app otro día).
  const today = dayKey(now);
  useEffect(() => {
    if (hydrated && state.day !== today) rawDispatch({ type: 'newDay', day: today });
  }, [hydrated, state.day, today]);

  const d = useMemo<Derived>(() => derive(state, now), [state, now]);

  if (!hydrated) return null;
  return <Ctx.Provider value={{ state, dispatch, d }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuera de StoreProvider');
  return v;
}

export type { HabitId };
