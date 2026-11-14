/** Fechas en la hora LOCAL del usuario (nunca UTC): un registro a las 00:30 pertenece al día nuevo. */
const pad = (n: number) => String(n).padStart(2, '0');

export const DAY_MS = 86400e3;

/** Clave de día local, AAAA-MM-DD. */
export function dayKey(t: number | string | Date = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Clave del día que está `n` días antes (n > 0) o después (n < 0) de `t`. Usa el calendario, no 24 h (cambios de hora). */
export function dayKeyAgo(n: number, t: number | string | Date = Date.now()): string {
  const d = new Date(t);
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - n, 12));
}

/** Mediodía local de una clave de día (para ordenar y dibujar). */
export function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
