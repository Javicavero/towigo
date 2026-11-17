/**
 * Móvil (iOS y Android): selector de documentos del sistema (expo-document-picker) y lectura del archivo
 * con expo-file-system. El archivo se copia a la caché de la app solo para leerlo; no sale del teléfono.
 */
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export const canPickFiles = true;

/** Devuelve null si la persona cancela. Lanza un error si el archivo no se puede leer. */
export async function pickTextFile(_accept: string): Promise<{ name: string; text: string } | null> {
  // Cualquier tipo: según el teléfono, un CSV llega como text/csv, text/comma-separated-values o application/octet-stream.
  // El contenido se valida después al leerlo.
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets?.length) return null;
  const asset = r.assets[0];
  const file = new File(asset.uri);
  const text = await file.text();
  try {
    file.delete(); // la copia temporal ya no hace falta
  } catch {
    /* si no se puede borrar, la caché del sistema la limpiará */
  }
  return { name: asset.name, text };
}
