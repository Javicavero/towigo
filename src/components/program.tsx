/**
 * Mejoras del benchmark (v0.9):
 * - Informe para la consulta (PDF).
 * - Pauta de escalado que fija el médico (solo se muestra y se recuerda).
 * - Programa de constancia: hitos y "hablar con mi equipo" en momentos difíciles.
 * - Fuerza y proteína para proteger el músculo.
 * Fase 1: ninguna de estas piezas calcula dosis ni da indicaciones clínicas.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { TEAM } from '../data/mock';
import { PROTEIN_FOODS, ROUTINES } from '../data/strength';
import { t } from '../i18n';
import { useNav } from '../nav';
import { buildReportHtml } from '../report/buildReport';
import { exportReport } from '../report/exportReport';
import { MILESTONES, useStore } from '../state/store';
import { usesGlp1 } from '../state/types';
import { colors, radius } from '../theme';
import { Glyph, Icon } from './icons';
import { Button, Card, Choice, ProgressBar, Row, T } from './ui';

const f2 = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');
const dayLong = (x: number | string) => new Date(x).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

// ---------- Informe para la consulta ----------
export function ReportCard({ embedded }: { embedded?: boolean }) {
  const { state, d } = useStore();
  const [weeks, setWeeks] = useState(12);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const create = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await exportReport(buildReportHtml(state, d, weeks), t('report.title'));
      setMsg(t('report.ready'));
    } catch {
      setMsg(t('report.error'));
    }
    setBusy(false);
  };
  const Wrap = embedded ? View : Card;
  return (
    <Wrap style={{ gap: 12 }}>
      <Row gap={10}>
        <Glyph name="doc" bg="#1E63C7" />
        <View style={{ flex: 1 }}>
          <T v="h2">{t('report.cardTitle')}</T>
          <T v="small" color={colors.secondary}>
            {t('report.cardSub')}
          </T>
        </View>
      </Row>
      <Row gap={8}>
        {[4, 12, 26].map((w) => (
          <Choice key={w} style={{ flex: 1 }} label={t('report.weeksShort', { n: w })} selected={weeks === w} onPress={() => setWeeks(w)} />
        ))}
      </Row>
      <Button label={busy ? t('report.creating') : t('report.create')} disabled={busy} onPress={create} />
      {msg && (
        <View accessibilityLiveRegion="polite">
          <T v="small" color={colors.greenText}>
            {msg}
          </T>
        </View>
      )}
      <T v="small" color={colors.secondary}>
        {t('report.cardNote')}
      </T>
    </Wrap>
  );
}

// ---------- Pauta de escalado del médico ----------
export function TitrationCard() {
  const { state, d } = useStore();
  if (!usesGlp1(state.profile)) return null;
  const steps = state.glp1.titration;
  return (
    <Card tone={d.phaseChangeSoon ? 'yellow' : 'white'}>
      <Row gap={10}>
        <Glyph name="steps" bg="#1E63C7" />
        <View style={{ flex: 1 }}>
          <T v="h2">{t('tit.title')}</T>
          <T v="small" color={colors.secondary}>
            {t('tit.by', { who: TEAM.endo.name })}
          </T>
        </View>
      </Row>
      <T v="title">{t('tit.now', { dose: f2(d.prescribedDose) })}</T>
      {d.phaseWeeks > 0 && (
        <View style={{ gap: 4 }}>
          <ProgressBar value={(d.phaseWeek / d.phaseWeeks) * 100} color={colors.blue} />
          <T v="small" color={colors.secondary}>
            {t('tit.week', { a: Math.min(d.phaseWeek, d.phaseWeeks), b: d.phaseWeeks })}
          </T>
        </View>
      )}
      {d.nextPhase && (
        <T v="label" color={d.phaseChangeSoon ? colors.ink : colors.secondary}>
          {d.phaseChangeSoon ? t('tit.nextSoon', { dose: f2(d.nextPhase.dose), date: dayLong(d.nextPhase.at) }) : t('tit.next', { dose: f2(d.nextPhase.dose), date: dayLong(d.nextPhase.at) })}
        </T>
      )}
      {/* Calendario de fases */}
      <View style={{ gap: 6 }}>
        {steps.map((s, i) => {
          const done = i < d.phaseIndex;
          const cur = i === d.phaseIndex;
          return (
            <View
              key={i}
              accessible
              accessibilityLabel={`${f2(s.dose)} mg, ${s.weeks ? t('report.weeks', { n: s.weeks }) : t('report.maintenance')}${cur ? `, ${t('report.current')}` : ''}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? colors.blue : cur ? colors.white : colors.line,
                  borderWidth: cur ? 3 : 0,
                  borderColor: colors.blue,
                }}
              >
                {done && <Icon name="check" size={14} color={colors.onAccent} stroke={3} />}
              </View>
              <T v={cur ? 'label' : 'body'} style={{ flex: 1 }} color={done ? colors.secondary : colors.ink}>
                {f2(s.dose)} mg
              </T>
              <T v="small" color={colors.secondary}>
                {s.weeks ? t('report.weeks', { n: s.weeks }) : t('report.maintenance')}
              </T>
            </View>
          );
        })}
      </View>
      <T v="small" color={colors.secondary}>
        {t('tit.note')}
      </T>
    </Card>
  );
}

// ---------- Programa de constancia ----------
export function JourneyCard() {
  const { state, d } = useStore();
  const glp1 = usesGlp1(state.profile);
  return (
    <Card>
      <Row gap={10}>
        <Glyph name="flag" bg="#17785A" />
        <View style={{ flex: 1 }}>
          <T v="h2">{t('journey.title')}</T>
          <T v="small" color={colors.secondary}>
            {t(d.maintenance ? 'journey.subMaint' : glp1 ? 'journey.subGlp1' : 'journey.subT2', { n: d.treatmentWeek })}
          </T>
        </View>
      </Row>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {MILESTONES.map((m) => {
          const ok = d.treatmentWeek >= m;
          const next = m === d.nextMilestone;
          return (
            <View key={m} style={{ alignItems: 'center', flex: 1, gap: 4 }} accessible accessibilityLabel={`${t('journey.week', { n: m })}: ${ok ? t('common.done') : t('common.pending')}`}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ok ? colors.greenText : colors.white,
                  borderWidth: ok ? 0 : 2,
                  borderColor: next ? colors.greenText : colors.borderStrong,
                }}
              >
                {ok ? <Icon name="check" size={20} color={colors.onAccent} stroke={3} /> : <T v="label">{m}</T>}
              </View>
              <T v="small" center color={ok || next ? colors.ink : colors.secondary}>
                {t(`journey.m${m}`)}
              </T>
            </View>
          );
        })}
      </Row>
      {d.nextMilestone && (
        <T v="small">{d.nextMilestone === d.treatmentWeek ? t('journey.thisWeek') : t('journey.next', { n: d.nextMilestone - d.treatmentWeek })}</T>
      )}
      <T v="small" color={colors.secondary}>
        {t(glp1 ? 'journey.noteGlp1' : 'journey.noteT2')}
      </T>
    </Card>
  );
}

/** Aparece en momentos en los que suele ayudar hablar con una persona del equipo. */
export function SupportCard() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  if (!d.supportReason) return null;
  const r = d.supportReason;
  return (
    <Card tone="yellow">
      <Row gap={10}>
        <Glyph name="chat" bg="#17785A" />
        <T v="h2" style={{ flex: 1 }}>
          {t(`support.${r}.title`)}
        </T>
      </Row>
      <T>{t(`support.${r}.text`, { owi: state.pet.name })}</T>
      <Row gap={8}>
        <Button
          style={{ flex: 1 }}
          label={t('support.ask')}
          onPress={() => {
            dispatch({ type: 'askTeam', text: t(`support.${r}.msg`) });
            go('team');
          }}
        />
        <Button style={{ flex: 1 }} kind="secondary" label={t('support.notNow')} onPress={() => dispatch({ type: 'dismissSupport' })} />
      </Row>
    </Card>
  );
}

// ---------- Fuerza ----------
export function StrengthCard({ embedded }: { embedded?: boolean }) {
  const { state, dispatch, d } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const goal = state.goals.strengthPerWeek;
  const body = (
    <>
      {!embedded && (
        <Row gap={10}>
          <Glyph name="dumbbell" bg="#5B4BC4" />
          <T v="h2" style={{ flex: 1 }}>
            {t('str.title')}
          </T>
          <T v="label" color={colors.greenText}>
            {d.strengthThisWeek}/{goal}
          </T>
        </Row>
      )}
      <ProgressBar value={Math.min(100, (d.strengthThisWeek / goal) * 100)} color={colors.purple} />
      <T v="small" color={colors.secondary}>
        {t('str.why', { n: goal, who: TEAM.nutri.short })}
      </T>
      {done && (
        <View accessibilityLiveRegion="polite">
          <T v="label" color={colors.greenText}>
            {t('str.saved', { owi: state.pet.name })}
          </T>
        </View>
      )}
      {ROUTINES.map((r) => {
        const isOpen = open === r.id;
        return (
          <View key={r.id} style={{ borderRadius: radius.m, backgroundColor: colors.cream, padding: 12, gap: 8 }}>
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <T v="label">{t(`routine.${r.id}`)}</T>
                <T v="small" color={colors.secondary}>
                  {t('str.meta', { min: r.minutes, level: t(`str.level${r.level}`) })}
                </T>
              </View>
              <Button kind={isOpen ? 'ghost' : 'secondary'} label={isOpen ? t('str.close') : t('str.see')} onPress={() => setOpen(isOpen ? null : r.id)} />
            </Row>
            {isOpen && (
              <>
                {r.exercises.map((e) => (
                  <View key={e.id} style={{ gap: 2 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <T v="label">{t(`ex.${e.id}`)}</T>
                      <T v="small" color={colors.purple}>
                        {e.reps}
                      </T>
                    </Row>
                    <T v="small" color={colors.secondary}>
                      {t(`ex.${e.id}.how`)}
                    </T>
                  </View>
                ))}
                <Button
                  label={t('str.did')}
                  onPress={() => {
                    dispatch({ type: 'addStrength', routine: r.id });
                    setOpen(null);
                    setDone(r.id);
                  }}
                />
              </>
            )}
          </View>
        );
      })}
      <T v="small" color={colors.secondary}>
        {t('str.safety')}
      </T>
    </>
  );
  return embedded ? <View style={{ gap: 10 }}>{body}</View> : <Card>{body}</Card>;
}

/** Raciones rápidas de proteína (aprox.). */
export function ProteinFoods() {
  const { dispatch } = useStore();
  return (
    <View style={{ gap: 6 }}>
      <T v="small" color={colors.secondary}>
        {t('food.title')}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PROTEIN_FOODS.map((f) => (
          <Choice key={f.id} label={`${t(`food.${f.id}`)} · ${f.g} g`} onPress={() => dispatch({ type: 'addIntake', protein: f.g })} />
        ))}
      </View>
    </View>
  );
}

// ---------- Mantenimiento después del GLP-1 ----------
/** Cuando el médico retira o reduce el GLP-1: zona de mantenimiento de ±2 kg, fuerza y proteína. */
export function MaintenanceCard() {
  const { state, d } = useStore();
  const ref = state.glp1.maintenanceKg ?? d.weightNow ?? 0;
  const delta = d.maintDeltaKg ?? 0;
  const inZone = Math.abs(delta) <= 2;
  const f1 = (n: number) => n.toFixed(1).replace('.', ',');
  return (
    <Card tone={inZone ? 'green' : 'yellow'}>
      <Row gap={10}>
        <Glyph name="shield" bg="#17785A" />
        <View style={{ flex: 1 }}>
          <T v="h2">{t('maint.title')}</T>
          <T v="small" color={colors.secondary}>
            {t('maint.week', { n: d.maintWeeks })}
          </T>
        </View>
      </Row>
      <T v="title">{inZone ? t('maint.inZone') : t('maint.outZone')}</T>
      <View style={{ gap: 4 }}>
        {/* Zona: de −2 a +2 kg respecto al peso al empezar el mantenimiento */}
        <View style={{ height: 14, borderRadius: 7, backgroundColor: colors.line, overflow: 'hidden', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: '25%', width: '50%', height: '100%', backgroundColor: 'rgba(43,181,138,0.35)' }} />
          <View style={{ position: 'absolute', left: `${Math.max(2, Math.min(98, 50 + (delta / 4) * 50))}%`, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: inZone ? colors.greenText : colors.coralText }} />
        </View>
        <T v="small" color={colors.secondary}>
          {t('maint.zone', { a: f1(ref - 2), b: f1(ref + 2), now: f1(d.weightNow ?? ref) })}
        </T>
      </View>
      <T v="small">{t('maint.keys', { p: state.goals.proteinG, s: state.goals.strengthPerWeek })}</T>
      <T v="small" color={colors.secondary}>
        {t('maint.noteCard')}
      </T>
    </Card>
  );
}
