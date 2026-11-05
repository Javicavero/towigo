/**
 * Ficha del paciente: resumen clínico (KPIs, AGP, peso y composición, inyecciones, efectos, ánimo),
 * pauta y objetivos (llegan a la app del paciente), mensajes y notas de consulta.
 */
import { useState } from 'react';
import { Pressable, TextInput, useWindowDimensions, View } from 'react-native';
import TrendChart from '../components/TrendChart';
import { Button, Choice, Row, Segmented, T } from '../components/ui';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { buildReportHtml } from '../report/buildReport';
import { exportReport } from '../report/exportReport';
import { hasDiabetes, hasT2, isT1, usesGlp1, type TitrationStep } from '../state/types';
import { colors, fonts } from '../theme';
import { AgpChart, InjectionStrip, MoodStrip, TirStack } from './charts';
import { Kpi, Panel, Pill, usePro } from './ProApp';
import Thread from './Thread';

const f1 = (n: number) => n.toFixed(1).replace('.', ',');
const f2 = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');
type Tab = 'summary' | 'plan' | 'messages' | 'notes';

export default function PatientDetail({ id, tab: initial, onBack }: { id: string; tab?: string; onBack: () => void }) {
  const { get } = usePro();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [tab, setTab] = useState<Tab>((initial as Tab) ?? 'summary');
  const p = get(id);
  if (!p) return null;
  const { s, m } = p;
  const d = m.d;

  return (
    <>
      <Pressable onPress={onBack} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
        <T v="small" color={colors.greenText}>
          ← {t('pro.backList')}
        </T>
      </Pressable>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <View style={{ gap: 6 }}>
          <T v="display">{p.name}</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            <Pill tone="info" label={t(`profile.short.${s.profile}`)} />
            <Pill tone={m.priority === 'ok' ? 'ok' : m.priority} label={t(`pro.prio.${m.priority}`)} />
            {m.flags.map((f) => (
              <Pill key={f.k} tone={f.tone === 'high' ? 'high' : f.tone === 'med' ? 'med' : 'info'} label={t(`pro.flag.${f.k}`)} />
            ))}
          </Row>
          <T v="small" color={colors.secondary}>
            {t('pro.age', { n: p.age })} ·{' '}
            {usesGlp1(s.profile)
              ? `${t(`drug.${s.glp1.drug}`)} · ${f2(d.prescribedDose)} mg/sem`
              : isT1(s.profile)
                ? `${s.insulinPlan.basalName} ${s.insulinPlan.basalUnits} u · ${s.insulinPlan.rapidName}`
                : s.meds.map((x) => `${x.name} ${x.dose}`).join(' · ')}
          </T>
        </View>
        <Row gap={8}>
          <Button kind="secondary" label={t('pro.message')} onPress={() => setTab('messages')} style={{ minHeight: 40 }} />
          <Button
            label={t('pro.report')}
            onPress={() => exportReport(buildReportHtml(s, d, 12), t('report.title')).catch(() => {})}
            style={{ minHeight: 40 }}
          />
        </Row>
      </Row>

      <Segmented
        options={[
          { id: 'summary', label: t('pro.tab.summary') },
          { id: 'plan', label: t('pro.tab.plan') },
          { id: 'messages', label: `${t('pro.tab.messages')}${m.pendingMsgs ? ` (${m.pendingMsgs})` : ''}` },
          { id: 'notes', label: t('pro.tab.notes') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'summary' && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {isT1(s.profile) && (
              <>
                <Kpi
                  label={t('pro.kpi.tir14')}
                  value={m.tir14 !== null ? String(m.tir14) : '—'}
                  unit="%"
                  sub={t('pro.kpi.tirTarget')}
                  tone={m.tir14 !== null && m.tir14 < 70 ? colors.coralText : colors.greenText}
                />
                <Kpi
                  label={t('pro.kpi.tbr')}
                  value={m.tbr14 !== null ? String(m.tbr14) : '—'}
                  unit="%"
                  sub={t('pro.kpi.tbrTarget')}
                  tone={m.tbr14 !== null && m.tbr14 >= 4 ? colors.coralText : colors.ink}
                />
                <Kpi label="GMI" value={m.gmi !== null ? f1(m.gmi) : '—'} unit="%" sub={t('pro.kpi.gmiSub')} />
                <Kpi
                  label={t('pro.kpi.cv')}
                  value={m.cv !== null ? String(m.cv) : '—'}
                  unit="%"
                  sub={t('pro.kpi.cvTarget')}
                  tone={m.cv !== null && m.cv > 36 ? colors.coralText : colors.ink}
                />
              </>
            )}
            {usesGlp1(s.profile) && (
              <Kpi
                label={t('pro.kpi.adh')}
                value={m.adherencePct !== null ? String(m.adherencePct) : '—'}
                unit="%"
                sub={t('pro.kpi.adhSub', { n: d.injectionWeeks })}
              />
            )}
            {d.weightNow !== null && (
              <Kpi
                label={t('pro.kpi.weight')}
                value={f1(d.weightNow)}
                unit="kg"
                sub={d.lostKg > 0 ? t('pro.kpi.lost', { kg: f1(d.lostKg), pct: f1(d.lostPct) }) : t('pro.kpi.stable')}
              />
            )}
            {d.musclePct !== null && <Kpi label={t('pro.kpi.muscle')} value={f1(d.musclePct)} unit="%" sub={t('pro.kpi.fat', { n: f1(d.fatPct ?? 0) })} />}
            {hasDiabetes(s.profile) && !isT1(s.profile) && (
              <Kpi
                label={t('pro.kpi.fasting')}
                value={m.avgFasting !== null ? String(m.avgFasting) : '—'}
                unit="mg/dL"
                sub={t('pro.kpi.inTarget', { n: d.glucoseInTargetPct })}
              />
            )}
            {hasDiabetes(s.profile) && d.hba1cNow !== null && (
              <Kpi label="HbA1c" value={f1(d.hba1cNow)} unit="%" sub={d.hba1cPrev !== null ? t('pro.kpi.prev', { v: f1(d.hba1cPrev) }) : ''} />
            )}
          </View>

          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12, alignItems: 'stretch' }}>
            {isT1(s.profile) && (
              <>
                <Panel title={t('pro.agp')} style={{ flex: 2 }}>
                  <AgpChart s={s} />
                </Panel>
                <Panel title={t('pro.tirRanges')} style={{ flex: 1 }}>
                  <TirStack s={s} />
                </Panel>
              </>
            )}
            {hasDiabetes(s.profile) && !isT1(s.profile) && (
              <Panel title={t('pro.fastingTrend')} style={{ flex: 1 }}>
                <TrendChart
                  points={s.glucose.filter((g) => g.context === 'ayunas').map((g) => ({ t: new Date(g.at).getTime(), v: g.v }))}
                  band={s.goals.fastingRange}
                  color={colors.coralText}
                  unit=""
                  label={t('pro.fastingTrend')}
                />
              </Panel>
            )}
          </View>

          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
            {s.weights.length > 1 && (
              <Panel title={t('pro.weightTrend')} style={{ flex: 1 }}>
                <TrendChart
                  points={s.weights.map((w) => ({ t: new Date(w.at).getTime(), v: w.kg }))}
                  unit=" kg"
                  decimals={1}
                  color={colors.purple}
                  label={t('pro.weightTrend')}
                  height={170}
                />
                {d.fatPct !== null && (
                  <T v="small" color={colors.secondary}>
                    {t('pro.compNote', { fat: f1(d.fatPct), muscle: f1(d.musclePct ?? 0) })}
                  </T>
                )}
              </Panel>
            )}
            {usesGlp1(s.profile) && s.glp1.status !== 'maintenance' && (
              <Panel title={t('pro.injections12')} style={{ flex: 1 }}>
                <InjectionStrip s={s} />
                <T v="small" color={colors.secondary}>
                  {t('pro.injNote', { phase: f2(d.prescribedDose), w: d.phaseWeek, b: d.phaseWeeks || '∞' })}
                </T>
              </Panel>
            )}
          </View>

          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
            {usesGlp1(s.profile) && (
              <Panel title={t('pro.sideEffects')} style={{ flex: 1 }}>
                {s.sideEffects.length ? (
                  s.sideEffects.slice(0, 5).map((e) => (
                    <Row key={e.id} style={{ justifyContent: 'space-between' }}>
                      <T v="small" color={colors.secondary}>
                        {new Date(e.at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </T>
                      <T v="small" style={{ flex: 1, marginLeft: 12 }}>
                        {e.symptoms.map((x) => `${t(`sym.${x.id}`)} (${t(`level.${x.level}`)})`).join(', ')}
                      </T>
                    </Row>
                  ))
                ) : (
                  <T v="small" color={colors.secondary}>
                    {t('pro.none')}
                  </T>
                )}
              </Panel>
            )}
            <Panel title={t('pro.mood14')} style={{ flex: 1 }}>
              <MoodStrip s={s} />
              <T v="small" color={colors.secondary}>
                {t('pro.moodNote')}
              </T>
            </Panel>
            <Panel title={t('pro.habits')} style={{ flex: 1 }}>
              <T v="small">
                {t('pro.habitsValue', { streak: d.streak, s: d.strengthThisWeek, sg: s.goals.strengthPerWeek, p: d.proteinToday, pg: s.goals.proteinG })}
              </T>
              {!!s.consultQuestions.length && (
                <>
                  <T v="small" color={colors.secondary} style={{ fontFamily: fonts.semibold }}>
                    {t('pro.questions')}
                  </T>
                  {s.consultQuestions.map((q, i) => (
                    <T key={i} v="small">
                      • {q}
                    </T>
                  ))}
                </>
              )}
            </Panel>
          </View>
        </>
      )}

      {tab === 'plan' && <PlanEditor id={id} />}
      {tab === 'messages' && (
        <Panel>
          <Thread id={id} />
        </Panel>
      )}
      {tab === 'notes' && <Notes id={id} />}
    </>
  );
}

/** Editor de pauta y objetivos. Lo que se guarda llega a la app del paciente (y se le avisa con un mensaje). */
function PlanEditor({ id }: { id: string }) {
  const { get, send, role } = usePro();
  const p = get(id)!;
  const s = p.s;
  const [steps, setSteps] = useState<TitrationStep[]>(s.glp1.titration);
  const [basal, setBasal] = useState(s.insulinPlan.basalUnits);
  const [goals, setGoals] = useState(s.goals);
  const [saved, setSaved] = useState(false);
  const r = (n: number) => Math.round(Math.max(0, n) * 100) / 100;
  const Num = ({ label, value, onChange, step, unit }: { label: string; value: number; onChange: (n: number) => void; step: number; unit: string }) => (
    <Row style={{ justifyContent: 'space-between', minHeight: 44 }}>
      <T v="label" style={{ flex: 1 }}>
        {label}
      </T>
      <Row gap={6}>
        <Choice label="−" style={{ minWidth: 40, minHeight: 36 }} onPress={() => onChange(r(value - step))} />
        <T v="label" style={{ minWidth: 80, textAlign: 'center' }}>
          {f2(value)} {unit}
        </T>
        <Choice label="+" style={{ minWidth: 40, minHeight: 36 }} onPress={() => onChange(r(value + step))} />
      </Row>
    </Row>
  );
  const save = () => {
    if (usesGlp1(s.profile)) send(id, { type: 'setTitration', steps });
    if (isT1(s.profile)) send(id, { type: 'setInsulinPlan', patch: { basalUnits: basal } });
    send(id, { type: 'setGoals', patch: goals });
    send(id, { type: 'teamMessage', from: role, text: t('pro.planUpdatedMsg') });
    setSaved(true);
  };
  return (
    <>
      {usesGlp1(s.profile) && (
        <Panel title={t('pro.titration')}>
          <T v="small" color={colors.secondary}>
            {t('pro.titrationNote')}
          </T>
          {steps.map((st, i) => (
            <Row key={i} gap={8} style={{ flexWrap: 'wrap', minHeight: 44 }}>
              <T v="small" color={colors.secondary} style={{ width: 70 }}>
                {t('pro.phase', { n: i + 1 })}
              </T>
              <Choice
                label="−"
                style={{ minWidth: 40, minHeight: 36 }}
                onPress={() => setSteps(steps.map((x, j) => (j === i ? { ...x, dose: r(x.dose - 0.25) } : x)))}
              />
              <T v="label" style={{ width: 80, textAlign: 'center' }}>
                {f2(st.dose)} mg
              </T>
              <Choice
                label="+"
                style={{ minWidth: 40, minHeight: 36 }}
                onPress={() => setSteps(steps.map((x, j) => (j === i ? { ...x, dose: r(x.dose + 0.25) } : x)))}
              />
              <Choice
                label="−"
                style={{ minWidth: 40, minHeight: 36 }}
                onPress={() => setSteps(steps.map((x, j) => (j === i ? { ...x, weeks: Math.max(0, x.weeks - 1) } : x)))}
              />
              <T v="label" style={{ width: 110, textAlign: 'center' }}>
                {st.weeks ? t('report.weeks', { n: st.weeks }) : t('report.maintenance')}
              </T>
              <Choice
                label="+"
                style={{ minWidth: 40, minHeight: 36 }}
                onPress={() => setSteps(steps.map((x, j) => (j === i ? { ...x, weeks: x.weeks + 1 } : x)))}
              />
              {i === p.m.d.phaseIndex && <Pill tone="info" label={t('report.current')} />}
            </Row>
          ))}
          <Row gap={8}>
            <Choice label={t('tit.add')} onPress={() => setSteps([...steps, { dose: steps[steps.length - 1]?.dose ?? 0.25, weeks: 0 }])} />
            {steps.length > 1 && <Choice label={t('tit.remove')} onPress={() => setSteps(steps.slice(0, -1))} />}
          </Row>
        </Panel>
      )}
      {isT1(s.profile) && (
        <Panel title={t('pro.insulin')}>
          <Num label={t('pro.basalUnits', { name: s.insulinPlan.basalName })} value={basal} onChange={setBasal} step={1} unit="u" />
          <T v="small" color={colors.secondary}>
            {t('pro.insulinNote')}
          </T>
        </Panel>
      )}
      <Panel title={t('pro.goals')}>
        <Num label={t('pro.goal.weight')} value={goals.weightKg} onChange={(v) => setGoals({ ...goals, weightKg: v })} step={1} unit="kg" />
        <Num label={t('pro.goal.protein')} value={goals.proteinG} onChange={(v) => setGoals({ ...goals, proteinG: v })} step={5} unit="g/día" />
        <Num label={t('pro.goal.perKg')} value={goals.proteinPerKg} onChange={(v) => setGoals({ ...goals, proteinPerKg: v })} step={0.1} unit="g/kg" />
        <Num label={t('pro.goal.strength')} value={goals.strengthPerWeek} onChange={(v) => setGoals({ ...goals, strengthPerWeek: v })} step={1} unit="/sem" />
        <Num label={t('pro.goal.water')} value={goals.waterGlasses} onChange={(v) => setGoals({ ...goals, waterGlasses: v })} step={1} unit="vasos" />
        {hasDiabetes(s.profile) && (
          <>
            <Num
              label={t('pro.goal.fastLo')}
              value={goals.fastingRange[0]}
              onChange={(v) => setGoals({ ...goals, fastingRange: [v, goals.fastingRange[1]] })}
              step={5}
              unit="mg/dL"
            />
            <Num
              label={t('pro.goal.fastHi')}
              value={goals.fastingRange[1]}
              onChange={(v) => setGoals({ ...goals, fastingRange: [goals.fastingRange[0], v] })}
              step={5}
              unit="mg/dL"
            />
            <Num label={t('pro.goal.post')} value={goals.postMealMax} onChange={(v) => setGoals({ ...goals, postMealMax: v })} step={5} unit="mg/dL" />
          </>
        )}
      </Panel>
      {hasT2(s.profile) && (
        <Panel title={t('pro.meds')}>
          {s.meds.map((x) => (
            <T key={x.id} v="small">
              • {x.name} {x.dose} · {x.times.join(' y ')}
            </T>
          ))}
        </Panel>
      )}
      <Row gap={10} style={{ flexWrap: 'wrap' }}>
        <Button label={t('pro.savePlan')} onPress={save} />
        {saved && (
          <T v="small" color={colors.greenText} style={{ alignSelf: 'center' }}>
            {p.isMe ? t('pro.savedMe') : t('pro.saved')}
          </T>
        )}
      </Row>
      <T v="small" color={colors.secondary}>
        {t('pro.planSafety', { who: TEAM[role].name })}
      </T>
    </>
  );
}

function Notes({ id }: { id: string }) {
  const { notes, addNote } = usePro();
  const [text, setText] = useState('');
  const list = notes[id] ?? [];
  return (
    <Panel title={t('pro.notes')}>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        placeholder={t('pro.notePh')}
        placeholderTextColor={colors.secondary}
        accessibilityLabel={t('pro.notePh')}
        style={{
          minHeight: 120,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface2,
          padding: 12,
          fontFamily: fonts.regular,
          fontSize: 15,
          color: colors.ink,
          textAlignVertical: 'top',
        }}
      />
      <Button
        label={t('pro.saveNote')}
        disabled={!text.trim()}
        onPress={() => {
          addNote(id, text.trim());
          setText('');
        }}
        style={{ alignSelf: 'flex-start', minHeight: 40 }}
      />
      {list.map((n) => (
        <View key={n.id} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 4 }}>
          <T v="small" color={colors.secondary}>
            {new Date(n.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {TEAM[n.author].name}
          </T>
          <T>{n.text}</T>
        </View>
      ))}
      <T v="small" color={colors.secondary}>
        {t('pro.notesPrivacy')}
      </T>
    </Panel>
  );
}
