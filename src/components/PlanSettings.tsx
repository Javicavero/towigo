/**
 * "Mi plan y avisos": tratamiento y horarios que fija el paciente con su equipo.
 * Fase 1: la app solo recuerda; nunca decide ni calcula dosis.
 */
import { Pressable, View } from 'react-native';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { hasT2, usesGlp1, type Glp1Drug, type Plan } from '../state/types';
import { colors, MIN_TOUCH } from '../theme';
import { Card, Choice, Row, T } from './ui';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DRUGS: Glp1Drug[] = ['semaglutida', 'tirzepatida', 'liraglutida', 'otro'];

function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH }}>
      <T v="label" style={{ flex: 1 }}>
        {label}
      </T>
      <View style={{ width: 54, height: 32, borderRadius: 16, backgroundColor: on ? colors.greenText : colors.line, padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white }} />
      </View>
    </Pressable>
  );
}

function DayPicker({ value, onChange, multi }: { value: number[]; onChange: (d: number[]) => void; multi?: boolean }) {
  return (
    <Row gap={6} style={{ flexWrap: 'wrap' }}>
      {DAYS.map((d, i) => (
        <Choice
          key={d}
          label={d}
          style={{ minWidth: MIN_TOUCH, paddingHorizontal: 0 }}
          selected={value.includes(i)}
          onPress={() => onChange(multi ? (value.includes(i) ? value.filter((x) => x !== i) : [...value, i].sort()) : [i])}
        />
      ))}
    </Row>
  );
}

export default function PlanSettings() {
  const { state, dispatch } = useStore();
  const p = state.plan;
  const set = <K extends keyof Plan>(k: K, patch: Partial<Plan[K]>) => dispatch({ type: 'setPlan', patch: { [k]: { ...p[k], ...patch } } as Partial<Plan> });

  return (
    <Card>
      <T v="h2">{t('plan.title')}</T>
      <T v="small" color={colors.secondary}>
        {t('plan.note')}
      </T>

      {usesGlp1(state.profile) && (
        <View style={{ gap: 8 }}>
          <Toggle on={p.injection.enabled} onPress={() => set('injection', { enabled: !p.injection.enabled })} label={t('plan.injection')} />
          <T v="small" color={colors.secondary}>
            {t('plan.drug')}
          </T>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {DRUGS.map((dr) => (
              <Choice key={dr} label={t(`drug.${dr}`)} selected={state.glp1.drug === dr} onPress={() => dispatch({ type: 'setGlp1', patch: { drug: dr } })} />
            ))}
          </Row>
          <T v="small" color={colors.secondary}>
            {t('plan.injectionDay')}
          </T>
          <DayPicker value={[state.glp1.weekday]} onChange={(d) => dispatch({ type: 'setGlp1', patch: { weekday: d[0] } })} />
          <T v="small" color={colors.secondary}>
            {t('plan.doseByDoctor', { dose: String(state.glp1.currentDose).replace('.', ',') })}
          </T>
        </View>
      )}

      {hasT2(state.profile) && (
        <View style={{ gap: 6 }}>
          <Toggle on={p.meds.enabled} onPress={() => set('meds', { enabled: !p.meds.enabled })} label={t('plan.meds')} />
          {state.meds.map((m) => (
            <T key={m.id} v="small" color={colors.secondary}>
              • {m.name} {m.dose} · {m.times.join(' y ')}
            </T>
          ))}
          <T v="small" color={colors.secondary}>
            {t('plan.medsByTeam')}
          </T>
        </View>
      )}

      <Toggle on={p.weigh.enabled} onPress={() => set('weigh', { enabled: !p.weigh.enabled })} label={t('plan.weigh')} />
      {p.weigh.enabled && <DayPicker value={[p.weigh.weekday]} onChange={(d) => set('weigh', { weekday: d[0] })} />}

      <Toggle on={p.sport.enabled} onPress={() => set('sport', { enabled: !p.sport.enabled })} label={t('plan.sport')} />
      {p.sport.enabled && <DayPicker multi value={p.sport.days} onChange={(d) => set('sport', { days: d })} />}

      <Toggle on={p.meals.enabled} onPress={() => set('meals', { enabled: !p.meals.enabled })} label={t('plan.meals', { times: p.meals.times.join(' · ') })} />
      <Toggle on={p.water.enabled} onPress={() => set('water', { enabled: !p.water.enabled })} label={t('plan.water', { times: p.water.times.join(' · ') })} />
    </Card>
  );
}
