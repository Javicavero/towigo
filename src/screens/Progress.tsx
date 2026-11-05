/**
 * Logros y progreso. Rachas de HÁBITOS (nunca de resultados); evolución de peso, glucosa y HbA1c
 * como información; Owi crece con tu vínculo.
 */
import { View } from 'react-native';
import BondCard from '../components/BondCard';
import { Icon } from '../components/icons';
import OwiAnimated from '../components/OwiAnimated';
import OwiSticker from '../components/OwiSticker';
import TrendChart from '../components/TrendChart';
import { Button, Card, ProgressBar, Row, Screen, T } from '../components/ui';
import { ACCESSORIES } from '../data/avatarOptions';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { hasT2, usesGlp1, type PetLevel, type PetMood } from '../state/types';
import { colors } from '../theme';

const LEVELS = [7, 30, 100, 365];
const LEVEL_MOOD: Record<PetLevel, PetMood> = { 1: 'happy', 2: 'remind', 3: 'caringLow', 4: 'celebrate' };
const fmt = (n: number) => n.toFixed(1).replace('.', ',');

export default function Progress() {
  const { state, dispatch, d } = useStore();
  const glp1 = usesGlp1(state.profile);
  const t2 = hasT2(state.profile);
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const nextLevel = LEVELS.find((l) => l > d.streak) ?? 365;
  const weeks = [...state.injections].sort((a, b) => a.at.localeCompare(b.at)).slice(-12);

  const achievements = [
    { id: 'firstLog', done: d.habitsToday.log, emoji: '✍️' },
    ...(glp1 ? [{ id: 'injections4', done: d.injectionWeeks >= 4, emoji: '💉' }] : []),
    ...(t2 ? [{ id: 'medsWeek', done: d.medsToday.length > 0 && d.medsToday.every((m) => m.taken), emoji: '💊' }] : []),
    { id: 'lost5', done: d.lostPct >= 5, emoji: '⚖️' },
    { id: 'week', done: d.streak >= 7, emoji: '🔥' },
    { id: 'firstAudio', done: d.habitsToday.listen, emoji: '🎧' },
  ];

  return (
    <Screen>
      <T v="title" accessibilityRole="header">
        {t('progress.title')}
      </T>

      <Card tone="yellow" style={{ alignItems: 'center' }}>
        <Icon name="flame" size={52} color={colors.coralDark} />
        <T v="display">{d.streak}</T>
        <T v="h2" center>
          {t('progress.streakDays')}
        </T>
        <T v="small" color={colors.secondary} center>
          {t('progress.streakNote')}
        </T>
        <Row gap={6} style={{ marginTop: 6 }}>
          {days.map((label, i) => {
            const off = todayIdx - i;
            const done = off > 0 ? off <= d.streakBefore : off === 0 ? d.todayDone : false;
            return (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.coral : colors.white, borderWidth: off === 0 ? 3 : 0, borderColor: colors.ink }}>
                  {done && <Icon name="check" size={18} color={colors.ink} stroke={3} />}
                </View>
                <T v="small">{label}</T>
              </View>
            );
          })}
        </Row>
        <View style={{ width: '100%', gap: 4, marginTop: 6 }}>
          <ProgressBar value={(d.streak / nextLevel) * 100} color={colors.coral} />
          <T v="small" color={colors.secondary} center>
            {t('progress.nextLevel', { n: nextLevel })}
          </T>
        </View>
      </Card>

      <Card>
        <Row gap={12}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#D6E9F8', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={26} color="#2D5F8A" />
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

      {glp1 && (
        <Card>
          <T v="h2">{t('progress.injTitle', { n: d.injectionWeeks })}</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {weeks.map((w) => (
              <View key={w.id} accessible accessibilityLabel={new Date(w.at).toLocaleDateString('es-ES')} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: colors.blueDark }}>
                <Icon name="check" size={18} color={colors.white} stroke={3} />
              </View>
            ))}
          </Row>
          <T v="small" color={colors.secondary}>
            {t('progress.injNote')}
          </T>
        </Card>
      )}

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">{t('progress.weight')}</T>
          <T v="label" color={colors.purple}>
            {d.lostKg > 0 ? `−${fmt(d.lostKg)} kg` : ''}
          </T>
        </Row>
        <TrendChart points={state.weights.map((w) => ({ t: new Date(w.at).getTime(), v: w.kg }))} unit=" kg" decimals={1} color={colors.purple} label={t('progress.weight')} />
        {d.fatPct !== null && (
          <>
            <T v="label">{t('progress.comp')}</T>
            <TrendChart points={state.weights.filter((w) => w.fatPct).map((w) => ({ t: new Date(w.at).getTime(), v: w.fatPct! }))} unit=" %" decimals={1} color={colors.coralText} height={120} label={t('progress.fat')} />
            <T v="small" color={colors.secondary}>
              {t('progress.compNote', { fat: fmt(d.fatPct), muscle: fmt(d.musclePct ?? 0) })}
            </T>
          </>
        )}
      </Card>

      {t2 && d.hba1cNow !== null && (
        <Card>
          <T v="h2">{t('progress.hba1c')}</T>
          <Row style={{ justifyContent: 'space-around', alignItems: 'flex-end', height: 130 }}>
            {state.hba1c.map((h) => (
              <View key={h.at} style={{ alignItems: 'center', gap: 4 }}>
                <T v="label">{fmt(h.v)} %</T>
                <View style={{ width: 44, height: (h.v - 5) * 34, borderRadius: 10, backgroundColor: colors.coral, borderBottomWidth: 4, borderBottomColor: colors.coralShadow }} />
                <T v="small" color={colors.secondary}>
                  {new Date(h.at).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
                </T>
              </View>
            ))}
          </Row>
          <T v="small" color={colors.secondary}>
            {t('progress.hba1cNote')}
          </T>
        </Card>
      )}

      <Card>
        <T v="h2">{t('progress.achievements')}</T>
        {achievements.map((a) => (
          <Row key={a.id} gap={12} style={{ minHeight: 48, opacity: a.done ? 1 : 0.55 }}>
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

      <Card tone="purple">
        <T v="h2">{t('progress.owiEvolution', { owi: state.pet.name })}</T>
        <View style={{ alignItems: 'center' }}>
          <OwiAnimated mood={d.petMood} level={d.petLevel} size={170} label={t('owi.a11y', { name: state.pet.name })} />
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          {([1, 2, 3, 4] as PetLevel[]).map((l) => (
            <View key={l} style={{ alignItems: 'center', flex: 1, opacity: d.petLevel >= l ? 1 : 0.4 }}>
              {d.petLevel >= l ? <OwiSticker mood={LEVEL_MOOD[l]} size={48} /> : <T v="title">🔒</T>}
              <T v="small" center>
                {t(`bond.lv${l}`)}
              </T>
              <T v="small" color={colors.secondary} center style={{ fontSize: 11 }}>
                {t(`progress.petGift${l}`)}
              </T>
            </View>
          ))}
        </Row>
      </Card>

      <BondCard />

      <Card tone="green">
        <T v="h2">{t('progress.avatarRewards')}</T>
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
      </Card>
    </Screen>
  );
}
