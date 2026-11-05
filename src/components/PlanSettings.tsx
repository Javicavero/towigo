/**
 * "Mi plan y avisos": tratamiento y horarios que fija el paciente con su equipo.
 * Fase 1: la app solo recuerda; nunca decide ni calcula dosis.
 */
import { Pressable, View } from 'react-native';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { hasT2, isT1, usesGlp1, type Glp1Drug, type Plan, type TitrationStep } from '../state/types';
import { colors, MIN_TOUCH } from '../theme';
import { Choice, Row, T } from './ui';

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

const f2 = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');

/**
 * Pauta de escalado: en la app real la introduce el médico desde su panel; en el prototipo se puede editar aquí.
 * Towigo nunca propone fases ni dosis: solo guarda y muestra la pauta.
 */
function TitrationEditor() {
  const { state, dispatch, d } = useStore();
  const steps = state.glp1.titration;
  const set = (i: number, patch: Partial<TitrationStep>) => dispatch({ type: 'setTitration', steps: steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const r = (n: number) => Math.round(Math.max(0, n) * 100) / 100;
  return (
    <View style={{ gap: 8 }}>
      <T v="label">{t('tit.editTitle')}</T>
      <T v="small" color={colors.secondary}>
        {t('tit.editNote')}
      </T>
      {steps.map((s, i) => (
        <Row key={i} gap={6} style={{ flexWrap: 'wrap', opacity: i < d.phaseIndex ? 0.6 : 1 }}>
          <T v="label" style={{ width: 64 }}>
            {f2(s.dose)} mg
          </T>
          <Choice label="−" style={{ minWidth: 40 }} onPress={() => set(i, { dose: r(s.dose - 0.25) })} />
          <Choice label="+" style={{ minWidth: 40 }} onPress={() => set(i, { dose: r(s.dose + 0.25) })} />
          <T v="small" color={colors.secondary} style={{ width: 86, textAlign: 'center' }}>
            {s.weeks ? t('report.weeks', { n: s.weeks }) : t('report.maintenance')}
          </T>
          <Choice label="−" style={{ minWidth: 40 }} accessibilityLabel={t('tit.lessWeeks')} onPress={() => set(i, { weeks: Math.max(0, s.weeks - 1) })} />
          <Choice label="+" style={{ minWidth: 40 }} accessibilityLabel={t('tit.moreWeeks')} onPress={() => set(i, { weeks: s.weeks + 1 })} />
        </Row>
      ))}
      <Row gap={8}>
        <Choice label={t('tit.add')} onPress={() => dispatch({ type: 'setTitration', steps: [...steps, { dose: steps[steps.length - 1]?.dose ?? 0.25, weeks: 0 }] })} />
        {steps.length > 1 && <Choice label={t('tit.remove')} onPress={() => dispatch({ type: 'setTitration', steps: steps.slice(0, -1) })} />}
      </Row>
    </View>
  );
}

export default function PlanSettings() {
  const { state, dispatch, d } = useStore();
  const p = state.plan;
  const set = <K extends keyof Plan>(k: K, patch: Partial<Plan[K]>) => dispatch({ type: 'setPlan', patch: { [k]: { ...p[k], ...patch } } as Partial<Plan> });

  return (
    <View style={{ gap: 10 }}>
      <T v="small" color={colors.secondary}>
        {t('plan.note')}
      </T>

      {usesGlp1(state.profile) && (
        <View style={{ gap: 8 }}>
          <T v="label">{t('maint.phase')}</T>
          <Row gap={8}>
            <Choice style={{ flex: 1 }} label={t('maint.active')} selected={state.glp1.status !== 'maintenance'} onPress={() => dispatch({ type: 'setGlp1', patch: { status: 'active' } })} />
            <Choice
              style={{ flex: 1 }}
              label={t('maint.maint')}
              selected={state.glp1.status === 'maintenance'}
              onPress={() => dispatch({ type: 'setGlp1', patch: { status: 'maintenance', maintenanceSince: state.glp1.maintenanceSince ?? new Date().toISOString(), maintenanceKg: state.glp1.maintenanceKg ?? d.weightNow ?? undefined } })}
            />
          </Row>
          <T v="small" color={colors.secondary}>
            {t('maint.note')}
          </T>
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
            {t('plan.doseByDoctor', { dose: f2(d.prescribedDose) })}
          </T>
          <TitrationEditor />
        </View>
      )}

      {isT1(state.profile) && (
        <View style={{ gap: 8 }}>
          <Toggle on={p.insulin?.enabled !== false} onPress={() => set('insulin', { enabled: !(p.insulin?.enabled !== false) })} label={t('plan.basal', { name: state.insulinPlan.basalName })} />
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {['08:00', '21:00', '22:00', '23:00'].map((h) => (
              <Choice key={h} label={h} selected={state.insulinPlan.basalTime === h} onPress={() => dispatch({ type: 'setInsulinPlan', patch: { basalTime: h } })} />
            ))}
          </Row>
          <T v="small" color={colors.secondary}>
            {t('plan.basalByTeam', { n: state.insulinPlan.basalUnits })}
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
    </View>
  );
}
