/** Web: la preferencia de tema se guarda en el navegador y se aplica recargando la página. */
const KEY = 'towigo.appearance';

export function loadAppearance(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  } catch {
    return null;
  }
}

/** Devuelve true si el cambio ya se ha aplicado (recarga). */
export function saveAppearance(p: string): boolean {
  try {
    localStorage.setItem(KEY, p);
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}
