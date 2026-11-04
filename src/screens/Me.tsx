/**
 * "Yo": personalizar a Owi, accesibilidad y privacidad (RGPD §8.3).
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import AvatarEditor from '../components/AvatarEditor';
import DexcomCard from '../components/DexcomCard';
import PlanSettings from '../components/PlanSettings';
import { Icon } from '../components/icons';
import Owi3D from '../components/Owi3D';
import { Button, Card, Choice, Row, Screen, T } from '../components/ui';
import { APP_NAME } from '../config';
import { ACCESSORIES } from '../data/avatarOptions';
import { t } from '../i18n';
import { useStore } from '../state/store';
import type { TextScale } from '../state/types';
import { colors, MIN_TOUCH } from '../theme';

export default function Me() {
  const { state, dispatch, d } = useStore();
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Screen>
      <T v="title" accessibilityRole="header">
        {t('me.title', { name: state.userName || t('common.friend') })}
      </T>

      <Card>
        <T v="h2">{t('me.owiTitle', { owi: state.avatar.name })}</T>
        <Owi3D avatar={d.owiAvatar} mood="happy" height={260} accessibilityLabel={t('owi.a11y', { name: state.avatar.name })} />
        <T v="small" color={colors.secondary} center>
          {t('onb.dragHint')}
        </T>
        <AvatarEditor />
        <T v="label">{t('me.accessories')}</T>
        {ACCESSORIES.map((a) => {
          const unlocked = d.unlocked[a.id];
          const on = state.avatar.equipped[a.id] && unlocked;
          return (
            <Pressable
              key={a.id}
              accessibilityRole="switch"
              accessibilityState={{ checked: on, disabled: !unlocked }}
              accessibilityLabel={t(`acc.${a.id}`)}
              disabled={!unlocked}
              onPress={() => dispatch({ type: 'toggleAccessory', id: a.id })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH, opacity: unlocked ? 1 : 0.55 }}
            >
              <T v="title">{unlocked ? a.emoji : '🔒'}</T>
              <View style={{ flex: 1 }}>
                <T v="label">{t(`acc.${a.id}`)}</T>
                {!unlocked && (
                  <T v="small" color={colors.secondary}>
                    {t('progress.unlockAt', { n: a.unlockDays })}
                  </T>
                )}
              </View>
              <View style={{ width: 54, height: 32, borderRadius: 16, backgroundColor: on ? colors.greenText : colors.line, padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white }} />
              </View>
            </Pressable>
          );
        })}
      </Card>

      <DexcomCard />
      <PlanSettings />

      <Card>
        <T v="h2">{t('me.textSize')}</T>
        <Row gap={8}>
          {([1, 1.2, 1.4] as TextScale[]).map((s) => (
            <Choice key={s} style={{ flex: 1 }} label={t(`me.size.${s}`)} selected={state.textScale === s} onPress={() => dispatch({ type: 'setTextScale', scale: s })} />
          ))}
        </Row>
        <T v="small" color={colors.secondary}>
          {t('me.textSizeNote')}
        </T>
      </Card>

      <Card>
        <Row gap={10}>
          <Icon name="shield" color={colors.greenText} />
          <T v="h2">{t('me.privacy')}</T>
        </Row>
        <T v="small" color={colors.secondary}>
          {t('me.privacyNote')}
        </T>
        {(['healthData', 'careTeam', 'productAnalytics'] as const).map((k) => (
          <Row key={k} style={{ justifyContent: 'space-between' }}>
            <T v="label" style={{ flex: 1 }}>
              {t(`me.consent.${k}`)}
            </T>
            <T v="small" color={state.consents[k] ? colors.greenText : colors.secondary}>
              {state.consents[k] ? t('me.granted') : t('me.notGranted')}
            </T>
          </Row>
        ))}
        {notice && (
          <View accessibilityLiveRegion="polite">
            <T v="small" color={colors.greenText}>
              {notice}
            </T>
          </View>
        )}
        <Button kind="secondary" label={t('me.export')} onPress={() => setNotice(t('me.exportDone'))} />
        {confirmDelete ? (
          <Card tone="coral">
            <T v="label">{t('me.deleteConfirm')}</T>
            <Row gap={8}>
              <Button style={{ flex: 1 }} kind="secondary" label={t('common.cancel')} onPress={() => setConfirmDelete(false)} />
              <Button style={{ flex: 1 }} kind="coral" label={t('me.deleteYes')} onPress={() => dispatch({ type: 'reset' })} />
            </Row>
          </Card>
        ) : (
          <Button kind="ghost" label={t('me.delete')} onPress={() => setConfirmDelete(true)} />
        )}
      </Card>

      <View style={{ gap: 4, alignItems: 'center', marginTop: 8 }}>
        <T v="small" color={colors.secondary} center>
          {t('me.footer', { app: APP_NAME })}
        </T>
        <T v="small" color={colors.secondary} center>
          {t('me.phase1')}
        </T>
      </View>
      <Button kind="ghost" label={t('me.restartDemo')} onPress={() => dispatch({ type: 'reset' })} />
    </Screen>
  );
}
