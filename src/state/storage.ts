/** Persistencia mínima del prototipo. En web usa localStorage (si está disponible). */
const KEY = 'towigo.prototype.v1';

export function load<T>(): T | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(value: unknown) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Navegación privada o almacenamiento bloqueado: el prototipo sigue funcionando sin guardar.
  }
}

export function clear() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento */
  }
}
