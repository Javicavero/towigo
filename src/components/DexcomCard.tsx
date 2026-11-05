/**
 * Conexión con Dexcom (API oficial). El usuario da permiso en la web de Dexcom;
 * los tokens se guardan solo en el servidor (Supabase, UE).
 */
import { useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { t } from '../i18n';
import { backendConfigured, dexcomDisconnect, dexcomStart } from '../services/backend';
import { useStore } from '../state/store';
import { colors } from '../theme';
import { Button, Row, T } from './ui';

export default function DexcomCard() {
  const { state, dispatch } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dx = state.dexcom;
  const live = state.dataSource === 'dexcom' && dx.connected;

  const connect = async () => {
    setBusy(true);
    setErr(null);
    try {
      const url = await dexcomStart();
      if (Platform.OS === 'web') window.location.assign(url);
    } catch {
      setErr(t('dexcom.errStart'));
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await dexcomDisconnect();
    } catch {
      /* aunque falle, dejamos de usar los datos en la app */
    }
    dispatch({ type: 'dexcom', patch: { connected: false, readings: [], lastSyncAt: null, error: null } });
    dispatch({ type: 'setDataSource', source: 'demo' });
    setBusy(false);
  };

  return (
    <View style={{ gap: 10 }}>
      <Row gap={10}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' }}>
          <T v="h2">📡</T>
        </View>
        <View style={{ flex: 1 }}>
          <T v="h2">Dexcom</T>
          <T v="small" color={live ? colors.greenText : colors.secondary}>
            {live
              ? t('dexcom.connected', { time: dx.lastSyncAt ? new Date(dx.lastSyncAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—' })
              : t('dexcom.notConnected')}
          </T>
        </View>
      </Row>
      {!backendConfigured ? (
        <T v="small" color={colors.secondary}>
          {t('dexcom.notConfigured')}
        </T>
      ) : busy ? (
        <ActivityIndicator color={colors.greenText} />
      ) : live ? (
        <Button kind="ghost" label={t('dexcom.disconnect')} onPress={disconnect} />
      ) : (
        <Button label={t('dexcom.connect')} onPress={connect} />
      )}
      {(err || dx.error) && (
        <T v="small" color={colors.coralText}>
          {err ?? t('dexcom.errSync')}
        </T>
      )}
      <T v="small" color={colors.secondary}>
        {t('dexcom.privacy')}
      </T>
    </View>
  );
}
