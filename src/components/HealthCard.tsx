/**
 * Apple Salud: conectar, ver qué se ha leído, sincronizar y desconectar.
 * Solo lectura: Towigo no escribe en Salud. Los permisos se gestionan en Ajustes → Salud → Acceso a datos → Towigo.
 */
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { t } from '../i18n';
import { connectHealth, healthAvailable, healthPlatform, readHealth } from '../services/health';
import { dayKey } from '../state/dates';
import { useStore } from '../state/store';
import { colors } from '../theme';
import { Button, Card, T } from './ui';

export default function HealthCard() {
  const { state, dispatch } = useStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const h = state.health;

  if (healthPlatform !== 'apple' || !healthAvailable()) {
    return (
      <T color={colors.secondary}>{Platform.OS === 'android' ? t('health.android') : Platform.OS === 'web' ? t('health.web') : t('health.unavailable')}</T>
    );
  }

  const sync = async (first: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      if (first) await connectHealth();
      const snapshot = await readHealth(30);
      if (!snapshot) throw new Error('no_data');
      dispatch({ type: 'healthSync', snapshot, at: new Date().toISOString() });
      const n = Object.keys(snapshot.stepsByDay).length + snapshot.weights.length + snapshot.glucose.length;
      setMsg(n ? t('health.synced') : t('health.empty'));
    } catch {
      setMsg(t('health.error'));
    }
    setBusy(false);
  };

  const steps = h?.stepsByDay?.[dayKey(Date.now())];
  const glucoseFromHealth = state.dataSource === 'health' ? state.glucose.length : 0;
  return (
    <View style={{ gap: 12 }}>
      <T v="small" color={colors.secondary}>
        {t('health.intro')}
      </T>
      {h?.connected && (
        <Card tone="green">
          <T v="label">{t('health.connected')}</T>
          <T v="small" color={colors.secondary}>
            {t('health.summary', {
              steps: steps !== undefined ? steps.toLocaleString('es-ES') : '—',
              w: state.weights.length,
              g: glucoseFromHealth.toLocaleString('es-ES'),
            })}
          </T>
          {h.lastSyncAt && (
            <T v="small" color={colors.secondary}>
              {t('health.last', { t: new Date(h.lastSyncAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}
            </T>
          )}
        </Card>
      )}
      <Button
        label={busy ? t('health.syncing') : h?.connected ? t('health.syncNow') : t('health.connect')}
        disabled={busy}
        onPress={() => sync(!h?.connected)}
      />
      {h?.connected && <Button kind="secondary" label={t('health.disconnect')} onPress={() => dispatch({ type: 'healthDisconnect' })} />}
      {msg && (
        <View accessibilityLiveRegion="polite">
          <T v="small" color={colors.greenText}>
            {msg}
          </T>
        </View>
      )}
      <T v="small" color={colors.secondary}>
        {t('health.note')}
      </T>
    </View>
  );
}
