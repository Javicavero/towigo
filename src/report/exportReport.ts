/** iOS y Android: genera el PDF y abre el menú de compartir (correo, WhatsApp, Archivos…). */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function exportReport(html: string, title: string) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title, UTI: 'com.adobe.pdf' });
  else await Print.printAsync({ uri });
}
