/**
 * Rachas de HÁBITOS (nunca de resultados glucémicos), protector de racha y logros (§4.4).
 * Un día fuera de rango no rompe nada.
 */
import { View } from 'react-native';
import { Icon } from '../components/icons';
import Owi3D from '../components/Owi3D';
import { Button, Card, ProgressBar, Row, Screen, T } from '../components/ui';
import { ACCESSORIES } from '../data/avatarOptions';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { colors } from '../theme';

const LEVELS = [7, 30, 100, 365];

export default function Progress() {
  const { state, dispatch, d } = useStore();
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const nextLevel = LEVELS.find((l) => l > d.streak) ?? 365;

  const achievements = [
    { id: 'firstLog', done: state.logs.length > 0 || d.habitsToday.log, emoji: '✍️' },
    { id: 'firstAudio', done: d.habitsToday.listen, emoji: '🎧' },
    { id: 'walker', done: d.habitsToday.walk, emoji: '👟' },
    { id: 'week', done: d.streak >= 7, emoji: '🔥' },
  ];

  return (
    <Screen>
      <T v="title" accessibilityRole="header">
        {t('progress.title')}
      </T>

      <Card tone="yellow" style={{ alignItems: 'center' }}>
        <Icon name="flame" size={56} color={colors.coralDark} />
        <T v="display">{d.streak}</T>
        <T v="h2" center>
          {t('progress.streakDays', { n: d.streak })}
        </T>
        <T v="small" color={colors.secondary} center>
          {t('progress.streakNote')}
        </T>
        <Row gap={6} style={{ marginTop: 8 }}>
          {days.map((label, i) => {
            const offset = todayIdx - i;
            const done = offset > 0 ? offset <= d.streakBefore : offset === 0 ? d.todayDone : false;
            const frozen = offset === 0 && state.freezeActiveToday;
            return (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: frozen ? '#D6E9F8' : done ? colors.coral : colors.white,
                    borderWidth: offset === 0 ? 3 : 0,
                    borderColor: colors.ink,
                  }}
                >
                  {frozen ? <Icon name="shield" size={18} color="#2D5F8A" /> : done ? <Icon name="check" size={18} color={colors.ink} stroke={3} /> : null}
                </View>
                <T v="small">{label}</T>
              </View>
            );
          })}
        </Row>
      </Card>

      <Card>
        <Row gap={12}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#D6E9F8', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={28} color="#2D5F8A" />
          </View>
          <View style={{ flex: 1 }}>
            <T v="h2">{t('progress.freezeTitle', { n: state.freezes })}</T>
            <T v="small" color={colors.secondary}>
              {t('progress.freezeNote')}
            </T>
          </View>
        </Row>
        {state.freezeActiveToday ? (
          <T v="label" color={colors.greenText}>
            {t('progress.freezeActive')}
          </T>
        ) : (
          <Button kind="secondary" label={t('progress.freezeUse')} disabled={state.freezes <= 0} onPress={() => dispatch({ type: 'useFreeze' })} />
        )}
      </Card>

      <Card>
        <T v="h2">{t('progress.nextLevel', { n: nextLevel })}</T>
        <ProgressBar value={(d.streak / nextLevel) * 100} color={colors.coral} />
        <Row style={{ justifyContent: 'space-between' }}>
          {LEVELS.map((l) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <T v="h2">{d.streak >= l ? '🏆' : '○'}</T>
              <T v="small" color={colors.secondary}>
                {t('progress.days', { n: l })}
              </T>
            </View>
          ))}
        </Row>
      </Card>

      <Card>
        <T v="h2">{t('progress.achievements')}</T>
        {achievements.map((a) => (
          <Row key={a.id} gap={12} style={{ minHeight: 48, opacity: a.done ? 1 : 0.6 }}>
            <T v="title">{a.emoji}</T>
            <View style={{ flex: 1 }}>
              <T v="label">{t(`ach.${a.id}`)}</T>
              <T v="small" color={colors.secondary}>
                {a.done ? t('common.done') : t(`ach.${a.id}Hint`)}
              </T>
            </View>
          </Row>
        ))}
      </Card>

      <Card tone="green">
        <T v="h2">{t('progress.owiRewards', { owi: state.avatar.name })}</T>
        <Owi3D avatar={d.owiAvatar} mood={d.streak >= 7 ? 'celebrate' : 'happy'} height={200} accessibilityLabel={t('owi.a11y', { name: state.avatar.name })} />
        {ACCESSORIES.map((a) => (
          <Row key={a.id} gap={12} style={{ minHeight: 44 }}>
            <T v="title">{d.unlocked[a.id] ? a.emoji : '🔒'}</T>
            <View style={{ flex: 1 }}>
              <T v="label">{t(`acc.${a.id}`)}</T>
              <T v="small" color={colors.secondary}>
                {d.unlocked[a.id] ? t('progress.unlocked') : t('progress.unlockAt', { n: a.unlockDays })}
              </T>
            </View>
          </Row>
        ))}
        <T v="small" color={colors.secondary}>
          {t('progress.equipHint')}
        </T>
      </Card>
    </Screen>
  );
}
