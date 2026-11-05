/**
 * Registrar (§4.1): cada registro en menos de 10 segundos.
 * Solo se apunta lo que el paciente ha hecho; Towigo no calcula ni sugiere dosis (Fase 1).
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import BodyMap from '../components/BodyMap';
import { Glyph, type IconName } from '../components/icons';
import { IntakeCard, MedsCard } from '../components/cards';
import { StrengthCard } from '../components/program';
import ScreenHeader from '../components/ScreenHeader';
import FoodPhoto from '../components/FoodPhoto';
import { Button, Card, Choice, Row, Screen, T } from '../components/ui';
import { t } from '../i18n';
import { useNav, type LogSection } from '../nav';
import { useStore } from '../state/store';
import { hasDiabetes, hasT2, isT1, usesGlp1, type GlucoseContext, type InjectionSite, type InsulinKind, type SymptomId } from '../state/types';
import { colors, radius } from '../theme';

const SYMPTOMS: SymptomId[] = ['nausea', 'vomitos', 'estrenimiento', 'diarrea', 'ardor', 'fatiga', 'pocoApetito', 'mareo'];
const CONTEXTS: GlucoseContext[] = ['ayunas', 'antesComer', 'despuesComer', 'noche'];
const ICON: Record<LogSection, [IconName, string]> = {
  injection: ['syringe', '#1E63C7'],
  weight: ['scale', '#5B4BC4'],
  glucose: ['drop', '#C8372D'],
  meds: ['pill', '#17785A'],
  effects: ['heart', '#B7791F'],
  intake: ['protein', '#D9542F'],
  strength: ['dumbbell', '#5B4BC4'],
  insulin: ['syringe', '#1E63C7'],
  carbs: ['meal', '#D9542F'],
};
const WHEN = [0, 15, 30, 60];
const fmt = (n: number, d = 1) => n.toFixed(d).replace('.', ',');

function Stepper({ value, onChange, steps, unit, decimals = 0, min = 0, max = 999, label }: { value: number; onChange: (n: number) => void; steps: number[]; unit: string; decimals?: number; min?: number; max?: number; label: string }) {
  const clamp = (n: number) => Math.round(Math.max(min, Math.min(max, n)) * 100) / 100;
  return (
    <View style={{ gap: 8 }}>
      <View accessible accessibilityLabel={`${label}: ${fmt(value, decimals)} ${unit}`} style={{ alignItems: 'center' }}>
        <T v="big">{fmt(value, decimals)}</T>
        <T v="small" color={colors.secondary}>
          {unit}
        </T>
      </View>
      <Row gap={6} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {[...steps].reverse().map((s) => (
          <Choice key={`-${s}`} label={`−${fmt(s, s < 1 ? 2 : 0)}`} onPress={() => onChange(clamp(value - s))} style={{ minWidth: 60 }} />
        ))}
        {steps.map((s) => (
          <Choice key={`+${s}`} label={`+${fmt(s, s < 1 ? 2 : 0)}`} onPress={() => onChange(clamp(value + s))} style={{ minWidth: 60 }} />
        ))}
      </Row>
    </View>
  );
}

export default function LogScreen() {
  const { state, dispatch, d } = useStore();
  const { section } = useNav();
  const [open, setOpen] = useState<LogSection | null>(section);
  const [toast, setToast] = useState<string | null>(null);
  const started = useRef(Date.now());
  // Inyección
  const [site, setSite] = useState<InjectionSite | null>(null);
  const [dose, setDose] = useState(d.prescribedDose);
  // Peso
  const [kg, setKg] = useState(d.weightNow ?? 80);
  const [withComp, setWithComp] = useState(false);
  const [fat, setFat] = useState(d.fatPct ?? 35);
  const [muscle, setMuscle] = useState(d.musclePct ?? 30);
  // Glucosa
  const [gv, setGv] = useState(d.lastGlucose?.v ?? 120);
  const [ctx, setCtx] = useState<GlucoseContext>('ayunas');
  // Tipo 1
  const [insKind, setInsKind] = useState<InsulinKind>('rapid');
  const [units, setUnits] = useState(4);
  const [when, setWhen] = useState(0);
  const [carbG, setCarbG] = useState(40);
  // Efectos
  const [sym, setSym] = useState<Partial<Record<SymptomId, 1 | 2 | 3>>>({});

  useEffect(() => setOpen(section), [section]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  const glp1 = usesGlp1(state.profile);
  const t2 = hasDiabetes(state.profile);
  const t1 = isT1(state.profile);
  const sections: LogSection[] = [
    ...(t1 ? (['insulin', 'carbs'] as LogSection[]) : []),
    ...(glp1 && !d.maintenance ? (['injection'] as LogSection[]) : []),
    ...(t2 ? (['glucose'] as LogSection[]) : []),
    ...(hasT2(state.profile) ? (['meds'] as LogSection[]) : []),
    'weight',
    ...(glp1 ? (['effects'] as LogSection[]) : []),
    'intake',
    'strength',
  ];

  const toggle = (s: LogSection) => {
    setOpen(open === s ? null : s);
    started.current = Date.now();
  };
  const saved = (key: string, vars: Record<string, string | number> = {}) => {
    const secs = Math.max(1, Math.round((Date.now() - started.current) / 1000));
    setOpen(null);
    setToast(t(key, { ...vars, owi: state.pet.name, s: secs }));
  };

  return (
    <Screen>
      <ScreenHeader title={t('log.title')} subtitle={t('log.subtitle')} mood={toast ? 'celebrate' : 'attentive'} line={toast ?? t('log.owiLine')} />
      {toast && (
        <View accessibilityLiveRegion="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          <T v="small">{toast}</T>
        </View>
      )}

      {sections.map((s) => (
        <Card key={s} style={{ padding: 0, overflow: 'hidden' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open === s }}
            accessibilityLabel={t(`log.${s}`)}
            onPress={() => toggle(s)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, minHeight: 76 }}
          >
            <Glyph name={ICON[s][0]} bg={ICON[s][1]} size={44} />
            <View style={{ flex: 1 }}>
              <T v="h2">{t(`log.${s}`)}</T>
              <T v="small" color={colors.secondary}>
                {t(`log.${s}Hint`)}
              </T>
            </View>
            <T v="title" color={colors.greenText}>
              {open === s ? '−' : '+'}
            </T>
          </Pressable>

          {open === s && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
              {s === 'injection' && (
                <>
                  <T v="label">{t('log.whereInjected')}</T>
                  <BodyMap selected={site} last={d.lastInjection?.site} suggested={d.suggestedSite} onSelect={setSite} />
                  {site && (
                    <T v="label" center color={colors.greenText}>
                      {t(`site.${site}`)}
                    </T>
                  )}
                  <T v="label">{t('log.doseInjected')}</T>
                  <Stepper value={dose} onChange={setDose} steps={[0.25]} unit="mg" decimals={2} max={20} label={t('log.doseInjected')} />
                  <T v="small" color={colors.secondary} center>
                    {t('log.doseNote', { dose: fmt(d.prescribedDose, 2) })}
                  </T>
                  <Button
                    label={t('log.save')}
                    disabled={!site}
                    onPress={() => {
                      if (!site) return;
                      dispatch({ type: 'addInjection', dose, site });
                      saved('log.savedInjection', { weeks: d.injectionWeeks + 1 });
                      setSite(null);
                    }}
                  />
                </>
              )}

              {s === 'insulin' && (
                <>
                  <Row gap={8}>
                    {(['rapid', 'basal'] as InsulinKind[]).map((k) => (
                      <Choice
                        key={k}
                        style={{ flex: 1 }}
                        label={k === 'rapid' ? state.insulinPlan.rapidName : state.insulinPlan.basalName}
                        selected={insKind === k}
                        onPress={() => {
                          setInsKind(k);
                          setUnits(k === 'basal' ? state.insulinPlan.basalUnits : 4);
                        }}
                      />
                    ))}
                  </Row>
                  <Stepper value={units} onChange={setUnits} steps={[0.5, 1]} unit={t('log.units')} decimals={1} max={100} label={t('log.insulin')} />
                  <T v="label">{t('log.when')}</T>
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    {WHEN.map((m) => (
                      <Choice key={m} label={m === 0 ? t('log.whenNow') : t('log.whenAgo', { n: m })} selected={when === m} onPress={() => setWhen(m)} />
                    ))}
                  </Row>
                  <T v="small" color={colors.secondary}>
                    {insKind === 'basal' ? t('log.basalNote', { n: state.insulinPlan.basalUnits }) : t('log.rapidNote')}
                  </T>
                  <Button
                    label={t('log.save')}
                    onPress={() => {
                      dispatch({ type: 'addInsulin', units, kind: insKind, minutesAgo: when });
                      saved('log.savedInsulin', { n: fmt(units, units % 1 ? 1 : 0) });
                      setWhen(0);
                    }}
                  />
                </>
              )}

              {s === 'carbs' && (
                <>
                  <FoodPhoto onSaved={(m) => saved('log.savedFood', { m })} />
                  <T v="label">{t('log.orGrams')}</T>
                  <Stepper value={carbG} onChange={setCarbG} steps={[5, 10]} unit={t('log.carbsUnit')} max={300} label={t('log.carbs')} />
                  <T v="label">{t('log.when')}</T>
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    {WHEN.map((m) => (
                      <Choice key={m} label={m === 0 ? t('log.whenNow') : t('log.whenAgo', { n: m })} selected={when === m} onPress={() => setWhen(m)} />
                    ))}
                  </Row>
                  <Button
                    label={t('log.save')}
                    onPress={() => {
                      dispatch({ type: 'addCarbs', g: carbG, minutesAgo: when });
                      saved('log.savedCarbs', { n: carbG });
                      setWhen(0);
                    }}
                  />
                  <T v="small" color={colors.secondary}>
                    {t('log.carbsNote')}
                  </T>
                </>
              )}

              {s === 'weight' && (
                <>
                  <Stepper value={kg} onChange={setKg} steps={[0.1, 1]} unit="kg" decimals={1} min={30} max={300} label={t('log.weight')} />
                  <Pressable accessibilityRole="switch" accessibilityState={{ checked: withComp }} onPress={() => setWithComp((v) => !v)} style={{ minHeight: 48, justifyContent: 'center' }}>
                    <T v="label" color={colors.greenText}>
                      {withComp ? '☑' : '☐'} {t('log.withComp')}
                    </T>
                  </Pressable>
                  {withComp && (
                    <Row gap={8}>
                      <View style={{ flex: 1 }}>
                        <T v="small" center>
                          {t('log.fat')}
                        </T>
                        <Stepper value={fat} onChange={setFat} steps={[0.5]} unit="%" decimals={1} max={70} label={t('log.fat')} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <T v="small" center>
                          {t('log.muscle')}
                        </T>
                        <Stepper value={muscle} onChange={setMuscle} steps={[0.5]} unit="%" decimals={1} max={70} label={t('log.muscle')} />
                      </View>
                    </Row>
                  )}
                  <T v="small" color={colors.secondary}>
                    {t('log.scaleNote')}
                  </T>
                  <Button
                    label={t('log.save')}
                    onPress={() => {
                      dispatch({ type: 'addWeight', entry: withComp ? { kg, fatPct: fat, musclePct: muscle } : { kg } });
                      saved('log.savedWeight');
                    }}
                  />
                </>
              )}

              {s === 'glucose' && (
                <>
                  <Stepper value={gv} onChange={setGv} steps={[1, 10]} unit="mg/dL" min={20} max={600} label={t('log.glucose')} />
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    {CONTEXTS.map((c) => (
                      <Choice key={c} label={t(`ctx.${c}`)} selected={ctx === c} onPress={() => setCtx(c)} />
                    ))}
                  </Row>
                  <Button
                    label={t('log.save')}
                    onPress={() => {
                      dispatch({ type: 'addGlucose', v: gv, context: ctx });
                      saved(gv < 70 ? 'log.savedGlucoseLow' : 'log.savedGlucose');
                    }}
                  />
                </>
              )}

              {s === 'meds' && <MedsCard />}

              {s === 'effects' && (
                <>
                  <T v="small" color={colors.secondary}>
                    {t('log.effectsHow')}
                  </T>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {SYMPTOMS.map((id) => {
                      const lv = sym[id];
                      return (
                        <Choice
                          key={id}
                          label={`${t(`sym.${id}`)}${lv ? ` · ${t(`level.${lv}`)}` : ''}`}
                          selected={!!lv}
                          onPress={() => setSym((cur) => ({ ...cur, [id]: lv === 3 ? undefined : (((lv ?? 0) + 1) as 1 | 2 | 3) }))}
                        />
                      );
                    })}
                  </View>
                  <Button
                    label={Object.keys(sym).some((k) => sym[k as SymptomId]) ? t('log.save') : t('log.noEffects')}
                    onPress={() => {
                      const list = (Object.entries(sym).filter(([, v]) => v) as [SymptomId, 1 | 2 | 3][]).map(([id, level]) => ({ id, level }));
                      if (list.length) dispatch({ type: 'addSideEffect', symptoms: list });
                      else dispatch({ type: 'addIntake' });
                      saved(list.length ? 'log.savedEffects' : 'log.savedNoEffects');
                      setSym({});
                    }}
                  />
                  <T v="small" color={colors.secondary}>
                    {t('log.effectsNote')}
                  </T>
                </>
              )}

              {s === 'intake' && (
                <>
                  <FoodPhoto onSaved={(m) => saved('log.savedFood', { m })} />
                  <IntakeCard />
                </>
              )}
              {s === 'strength' && <StrengthCard embedded />}
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}
