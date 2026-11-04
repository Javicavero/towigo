/**
 * i18n mínimo preparado desde el inicio (especificación §0).
 * Idioma principal: español (España). Inglés después del MVP; luego pt, de, fr.
 * Las claves ausentes en un idioma caen al español.
 */
import { es } from './es';

export type Locale = 'es' | 'en';
type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  es,
  en: {}, // TODO(i18n): traducir tras el MVP
};

let current: Locale = 'es';

export function setLocale(l: Locale) {
  current = l;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = dictionaries[current][key] ?? es[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
