/**
 * Importar las lecturas del sensor desde una exportación CSV de Dexcom Clarity.
 * Los datos se quedan solo en este dispositivo: no se envían a ningún servidor.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { parseClarityCsv, shiftDaysToNow } from '../data/clarityImport';
import { t } from '../i18n';
import { canPickFiles, pickTextFile } from '../services/pickFile';
import { useStore } from '../state/store';
import { isT1 } from '../state/types';
import { colors } from '../theme';
import { Button, Card, Row, T } from './ui';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ImportCard() {
  const { state, dispatch } = useStore();
  const [align, setAlign] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const imported = state.dataSource === 'import' ? state.imported : null;

  const pick = async () => {
    setMsg(null);
    setBusy(true);
    let f: { name: string; text: string } | null = null;
    try {
      f = await pickTextFile('.csv,text/csv');
    } catch {
      setBusy(false);
      setMsg(t('import.readError'));
      return;
    }
    setBusy(false);
    if (!f) return;
    const r = parseClarityCsv(f.text);
    if (!r.glucose.length || r.to === null) {
      setMsg(t('import.none'));
      return;
    }
    if (!isT1(state.profile)) dispatch({ type: 'setProfile', profile: 't1' });
    dispatch({ type: 'importSensor', glucose: r.glucose, insulin: r.insulin, carbs: r.carbs, shiftDays: align ? shiftDaysToNow(r.to) : 0 });
    setMsg(
      t('import.done', {
        n: r.glucose.length.toLocaleString('es-ES'),
        a: new Date(r.from!).toLocaleDateString('es-ES'),
        b: new Date(r.to).toLocaleDateString('es-ES'),
      }),
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <T v="small" color={colors.secondary}>
        {t('import.intro')}
      </T>
      {imported && (
        <Card tone="green">
          <T v="label">{t('import.active', { n: imported.count.toLocaleString('es-ES') })}</T>
          <T v="small" color={colors.secondary}>
            {t('import.range', { a: fmt(imported.from), b: fmt(imported.to) })}
            {imported.shiftDays ? ` · ${t('import.shifted', { n: imported.shiftDays })}` : ''}
          </T>
        </Card>
      )}
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: align }}
        onPress={() => setAlign((x) => !x)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
      >
        <View style={{ flex: 1 }}>
          <T v="label">{t('import.align')}</T>
          <T v="small" color={colors.secondary}>
            {t('import.alignSub')}
          </T>
        </View>
        <View
          style={{
            width: 46,
            height: 28,
            borderRadius: 14,
            padding: 3,
            backgroundColor: align ? colors.greenText : colors.chip,
            alignItems: align ? 'flex-end' : 'flex-start',
          }}
        >
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' }} />
        </View>
      </Pressable>
      {canPickFiles ? (
        <Button label={busy ? t('import.reading') : t('import.pick')} onPress={pick} disabled={busy} />
      ) : (
        <T color={colors.secondary}>{t('import.webOnly')}</T>
      )}
      {imported && <Button kind="secondary" label={t('import.reset')} onPress={() => dispatch({ type: 'setProfile', profile: state.profile })} />}
      {msg && (
        <View accessibilityLiveRegion="polite">
          <T v="small" color={colors.greenText}>
            {msg}
          </T>
        </View>
      )}
      <Row gap={8} style={{ alignItems: 'flex-start' }}>
        <T v="small" color={colors.secondary} style={{ flex: 1 }}>
          {t('import.howto')}
        </T>
      </Row>
    </View>
  );
}
