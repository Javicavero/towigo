/**
 * Subventanas: la pantalla muestra solo lo esencial y el detalle se abre al tocar.
 * - Sheet: ventana que sube desde abajo, con título, botón de cerrar y contenido desplazable.
 * - DrillRow: fila "título · resumen ›" que abre una subventana.
 * - DrillGroup: agrupa filas en una tarjeta limpia.
 */
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { colors, fonts, isDark } from '../theme';
import { Icon, type IconName } from './icons';
import { Row, T } from './ui';

export function Sheet({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,10,22,0.5)' }} />
        <View
          accessibilityViewIsModal
          style={{ width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '88%', backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(27,22,48,0.15)' }} />
          </View>
          <Row style={{ justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ flex: 1 }}>
              <T v="h2" accessibilityRole="header">
                {title}
              </T>
              {subtitle ? (
                <T v="small" color={colors.secondary}>
                  {subtitle}
                </T>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color={colors.ink} />
            </Pressable>
          </Row>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) + 16, gap: 12 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function DrillGroup({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : colors.white, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,22,48,0.07)', borderRadius: 20, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

export function DrillRow({ icon, title, value, onPress, last, color }: { icon: IconName; title: string; value?: string; onPress: () => void; last?: boolean; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}: ${value}` : title}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        minHeight: 56,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(27,22,48,0.06)',
        backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(27,22,48,0.03)') : 'transparent',
      })}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color={color ?? colors.greenText} />
      </View>
      <T v="label" style={{ flex: 1 }}>
        {title}
      </T>
      {value ? (
        <T v="small" color={colors.secondary} style={{ fontFamily: fonts.medium, maxWidth: 150 }} numberOfLines={1}>
          {value}
        </T>
      ) : null}
      <Icon name="next" size={16} color={colors.secondary} />
    </Pressable>
  );
}
