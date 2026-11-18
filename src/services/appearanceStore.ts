/**
 * Móvil: la preferencia de tema se guarda en un pequeño archivo de la app (expo-file-system) para poder leerla
 * de forma síncrona al arrancar, antes de pintar nada. El cambio se aplica al volver a abrir la app.
 */
import { File, Paths } from 'expo-file-system';

const file = () => new File(Paths.document, 'towigo-appearance.txt');

export function loadAppearance(): string | null {
  try {
    const f = file();
    return f.exists ? f.textSync().trim() : null;
  } catch {
    return null;
  }
}

/** Devuelve false: en el móvil el tema nuevo se aplica al volver a abrir la app. */
export function saveAppearance(p: string): boolean {
  try {
    const f = file();
    if (!f.exists) f.create();
    void f.write(p);
  } catch {
    /* sin almacenamiento: se queda el tema actual */
  }
  return false;
}
