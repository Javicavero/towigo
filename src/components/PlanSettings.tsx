/**
 * "Mi plan y avisos": horarios que el paciente (o su equipo) fija para que Owi avise.
 * Fase 1: solo horarios. La app no decide ni calcula dosis.
 */
import { Pressable, View } from 'react-native';
import { t } from '../i18n';
import { useStore } from '../state/store';
import type { Plan } from '../state/types';
import { colors, MIN_TOUCH } from '../theme';
import { Button, Card, Choice, Row, T } from './ui';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH }}
    >
      <T v="label" style={{ flex: 1 }}>
        {label}
      </T>
      <View style={{ width: 54, height: 32, borderRadius: 16, backgroundColor: on ? colors.greenText : colors.line, padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white }} />
      </View>
    </Pressable>
  );
}

export default function PlanSettings() {
  const { state, dispatch } = useStore();
  const p = state.plan;
  const set = <K extends keyof Plan>(k: K, patch: Partial<Plan[K]>) => dispatch({ type: 'setPlan', patch: { [k]: { ...p[k], ...patch } } as Partial<Plan> });
  const sensorEnds = new Date(new Date(p.sensor.insertedAt).getTime() + (p.sensor.model === 'libre' ? 14 : 10) * 86400e3);

  return (
    <Card>
      <T v="h2">{t('plan.title')}</T>
      <T v="small" color={colors.secondary}>
        {t('plan.note')}
      </T>

      <Toggle on={p.insulin.enabled} onPress={() => set('insulin', { enabled: !p.insulin.enabled })} label={t('plan.insulin')} />
      {p.insulin.enabled && (
        <View style={{ gap: 6 }}>
          <T v="small" color={colors.secondary}>
            {t('plan.basalAt')}
          </T>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {['21:00', '22:00', '23:00', '08:00'].map((h) => (
              <Choice key={h} label={h} selected={p.insulin.basalTime === h} onPress={() => set('insulin', { basalTime: h })} />
            ))}
          </Row>
          <T v="small" color={colors.secondary}>
            {t('plan.rapidAt', { times: p.insulin.rapidTimes.join(' · ') })}
          </T>
        </View>
      )}

      <Toggle on={p.sport.enabled} onPress={() => set('sport', { enabled: !p.sport.enabled })} label={t('plan.sport')} />
      {p.sport.enabled && (
        <View style={{ gap: 6 }}>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {DAYS.map((d, i) => (
              <Choice
                key={d}
                label={d}
                style={{ minWidth: MIN_TOUCH, paddingHorizontal: 0 }}
                selected={p.sport.days.includes(i)}
                onPress={() => set('sport', { days: p.sport.days.includes(i) ? p.sport.days.filter((x) => x !== i) : [...p.sport.days, i].sort() })}
              />
            ))}
          </Row>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {[20, 30, 45, 60].map((m) => (
              <Choice key={m} label={t('plan.minutes', { n: m })} selected={p.sport.minutes === m} onPress={() => set('sport', { minutes: m })} />
            ))}
          </Row>
        </View>
      )}

      <Toggle on={p.sensor.enabled} onPress={() => set('sensor', { enabled: !p.sensor.enabled })} label={t('plan.sensor')} />
      {p.sensor.enabled && (
        <View style={{ gap: 6 }}>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {(['g7', 'g6', 'libre'] as const).map((m) => (
              <Choice key={m} label={t(`plan.model.${m}`)} selected={p.sensor.model === m} onPress={() => set('sensor', { model: m })} />
            ))}
          </Row>
          <T v="small" color={colors.secondary}>
            {t('plan.sensorEnds', { date: sensorEnds.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) })}
          </T>
          <Button kind="secondary" label={t('plan.sensorToday')} onPress={() => set('sensor', { insertedAt: new Date().toISOString() })} />
        </View>
      )}

      <Toggle on={p.meals.enabled} onPress={() => set('meals', { enabled: !p.meals.enabled })} label={t('plan.meals', { times: p.meals.times.join(' · ') })} />
      <Toggle on={p.water.enabled} onPress={() => set('water', { enabled: !p.water.enabled })} label={t('plan.water', { times: p.water.times.join(' · ') })} />
    </Card>
  );
}
