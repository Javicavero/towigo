/** Bandeja: mensajes de pacientes pendientes de respuesta, ordenados por prioridad. */
import { Pressable, View } from 'react-native';
import { T } from '../components/ui';
import { t } from '../i18n';
import { colors } from '../theme';
import { hov, Panel, Pill, usePro } from './ProApp';

export default function Inbox() {
  const { patients, open } = usePro();
  const items = patients
    .filter((p) => p.m.pendingMsgs > 0)
    .map((p) => ({ p, last: [...p.s.messages].reverse().find((m) => m.from === 'patient' && m.text)! }))
    .sort((a, b) => b.p.m.score - a.p.m.score);
  return (
    <>
      <T v="display">{t('pro.inbox')}</T>
      <T color={colors.secondary}>{t('pro.inboxSub', { n: items.length })}</T>
      <Panel>
        {items.length === 0 && <T color={colors.secondary}>{t('pro.inboxEmpty')}</T>}
        {items.map(({ p, last }, i) => (
          <Pressable
            key={p.id}
            onPress={() => open(p.id, 'messages')}
            accessibilityRole="button"
            style={(st) => ({
              paddingVertical: 12,
              paddingHorizontal: 6,
              gap: 4,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: colors.line,
              borderRadius: 8,
              backgroundColor: hov(st) ? colors.surface2 : 'transparent',
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <T v="label">{p.name}</T>
              <T v="small" color={colors.secondary}>
                {new Date(last.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </T>
            </View>
            <T v="small" numberOfLines={2}>
              {t(last.text ?? '')}
            </T>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pill tone={p.m.priority === 'ok' ? 'ok' : p.m.priority} label={t(`pro.prio.${p.m.priority}`)} />
              <Pill tone="info" label={t(`profile.short.${p.s.profile}`)} />
            </View>
          </Pressable>
        ))}
      </Panel>
    </>
  );
}
