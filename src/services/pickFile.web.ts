/** Web: abre el selector de archivos del navegador y devuelve el texto del archivo elegido (no sale del dispositivo). */
export const canPickFiles = true;

export function pickTextFile(accept: string): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve({ name: f.name, text: String(r.result ?? '') });
      r.onerror = () => resolve(null);
      r.readAsText(f);
    };
    input.click();
  });
}
