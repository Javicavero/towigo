/**
 * Móvil: la importación de archivos llegará con el selector de documentos de Expo (expo-document-picker).
 * De momento solo está disponible en la versión web.
 */
export const canPickFiles = false;

export function pickTextFile(_accept: string): Promise<{ name: string; text: string } | null> {
  return Promise.resolve(null);
}
