/** Lista de pacientes priorizada: quién necesita revisión hoy y por qué. */
import { useState } from 'react';
import { Pressable, TextInput, useWindowDimensions, View } from 'react-native';
import { Choice, Row, T } from '../components/ui';
import { t } from '../i18n';
import { hasDiabetes, isT1, usesGlp1 } from '../state/types';
import { colors, fonts } from '../theme';
import { hov, Kpi, Pill, usePro } from './ProApp';

type Filter = 'all' | 'high' | 't1' | 't2' | 'glp1' | 'msg';
const f1 = (n: number) => n.toFixed(1).replace('.', ',');

export default function PatientList() {
  const { patients, open } = usePro();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const list = patients
    .filter((p) =>
      filter === 'high'
        ? p.m.priority === 'high'
        : filter === 't1'
          ? isT1(p.s.profile)
          : filter === 't2'
            ? p.s.profile === 't2' || p.s.profile === 't2_glp1'
            : filter === 'glp1'
              ? usesGlp1(p.s.profile)
              : filter === 'msg'
                ? p.m.pendingMsgs > 0
                : true,
    )
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.m.score - a.m.score);

  const high = patients.filter((p) => p.m.priority === 'high').length;
  const adh = patients.map((p) => p.m.adherencePct).filter((x): x is number => x !== null);
  const tir = patients.map((p) => p.m.tir14).filter((x): x is number => x !== null);
  const pend = patients.reduce((a, p) => a + p.m.pendingMsgs, 0);

  return (
    <>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <View>
          <T v="display">{t('pro.patients')}</T>
          <T color={colors.secondary}>{t('pro.patientsSub', { n: patients.length })}</T>
        </View>
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Kpi label={t('pro.kpi.review')} value={String(high)} sub={t('pro.kpi.reviewSub')} tone={high ? colors.coralText : colors.ink} />
        <Kpi
          label={t('pro.kpi.adherence')}
          value={adh.length ? String(Math.round(adh.reduce((a, b) => a + b, 0) / adh.length)) : '—'}
          unit="%"
          sub={t('pro.kpi.adherenceSub')}
        />
        <Kpi
          label={t('pro.kpi.tir')}
          value={tir.length ? String(Math.round(tir.reduce((a, b) => a + b, 0) / tir.length)) : '—'}
          unit="%"
          sub={t('pro.kpi.tirSub')}
        />
        <Kpi label={t('pro.kpi.messages')} value={String(pend)} sub={t('pro.kpi.messagesSub')} />
      </View>

      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {(['all', 'high', 'msg', 't1', 't2', 'glp1'] as Filter[]).map((f) => (
          <Choice key={f} label={t(`pro.filter.${f}`)} selected={filter === f} onPress={() => setFilter(f)} style={{ minHeight: 36 }} />
        ))}
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('pro.search')}
          placeholderTextColor={colors.secondary}
          accessibilityLabel={t('pro.search')}
          style={{
            flexGrow: 1,
            minWidth: 180,
            height: 38,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.white,
            paddingHorizontal: 12,
            fontFamily: fonts.regular,
            fontSize: 14,
            color: colors.ink,
          }}
        />
      </Row>

      <View style={{ backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
        {wide && (
          <Row style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface2 }}>
            {[
              ['pro.col.patient', 2.4],
              ['pro.col.priority', 2.6],
              ['pro.col.control', 1.3],
              ['pro.col.weight', 1.1],
              ['pro.col.lastData', 1],
              ['pro.col.mood', 0.8],
            ].map(([k, f]) => (
              <T key={k as string} v="small" color={colors.secondary} style={{ flex: f as number, fontFamily: fonts.semibold, letterSpacing: 0.3 }}>
                {t(k as string).toUpperCase()}
              </T>
            ))}
          </Row>
        )}
        {list.map((p, i) => {
          const control = isT1(p.s.profile)
            ? p.m.tir14 !== null
              ? `${p.m.tir14} % TIR`
              : '—'
            : usesGlp1(p.s.profile) && p.m.adherencePct !== null
              ? `${p.m.adherencePct} % adh.`
              : hasDiabetes(p.s.profile) && p.m.avgFasting
                ? `${p.m.avgFasting} mg/dL`
                : '—';
          const controlSub = isT1(p.s.profile) ? (p.m.gmi ? `GMI ${f1(p.m.gmi)} %` : '') : usesGlp1(p.s.profile) ? t('pro.injection') : t('pro.fastingAvg');
          const flags = p.m.flags.filter((f) => f.tone !== 'info' || f.k === 'message').slice(0, 3);
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}. ${t(`pro.prio.${p.m.priority}`)}`}
              onPress={() => open(p.id)}
              style={(st) => ({
                flexDirection: wide ? 'row' : 'column',
                alignItems: wide ? 'center' : 'stretch',
                gap: wide ? 0 : 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.line,
                backgroundColor: hov(st) || st.pressed ? colors.surface2 : 'transparent',
              })}
            >
              <Row gap={12} style={{ flex: wide ? 2.4 : undefined }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: p.isMe ? '#14B8A6' : colors.chip,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T v="small" color={p.isMe ? '#04221C' : colors.ink} style={{ fontFamily: fonts.semibold }}>
                    {p.name
                      .split(' ')
                      .slice(0, 2)
                      .map((x) => x[0])
                      .join('')}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="label">{p.name}</T>
                  <T v="small" color={colors.secondary}>
                    {t('pro.age', { n: p.age })} · {t(`profile.short.${p.s.profile}`)}
                    {p.s.glp1.status === 'maintenance' && usesGlp1(p.s.profile) ? ` · ${t('maint.maint')}` : ''}
                  </T>
                </View>
              </Row>
              <View style={{ flex: wide ? 2.6 : undefined, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Pill tone={p.m.priority === 'ok' ? 'ok' : p.m.priority} label={t(`pro.prio.${p.m.priority}`)} />
                {flags.map((f) => (
                  <Pill key={f.k} tone={f.tone === 'high' ? 'high' : f.tone === 'med' ? 'med' : 'info'} label={t(`pro.flag.${f.k}`)} />
                ))}
              </View>
              {wide ? (
                <>
                  <View style={{ flex: 1.3 }}>
                    <T v="label">{control}</T>
                    <T v="small" color={colors.secondary}>
                      {controlSub}
                    </T>
                  </View>
                  <View style={{ flex: 1.1 }}>
                    <T v="label">{p.m.weightDelta4w !== null ? `${p.m.weightDelta4w > 0 ? '+' : ''}${f1(p.m.weightDelta4w)} kg` : '—'}</T>
                    <T v="small" color={colors.secondary}>
                      {t('pro.last4w')}
                    </T>
                  </View>
                  <T v="small" color={p.m.lastDataDays >= 3 ? colors.coralText : colors.secondary} style={{ flex: 1 }}>
                    {p.m.lastDataDays === 0 ? t('pro.today') : p.m.lastDataDays >= 99 ? '—' : t('pro.daysAgo', { n: p.m.lastDataDays })}
                  </T>
                  <T v="label" style={{ flex: 0.8 }} color={p.m.moodAvg7 !== null && p.m.moodAvg7 < 2.6 ? colors.coralText : colors.ink}>
                    {p.m.moodAvg7 !== null ? `${f1(p.m.moodAvg7)}/5` : '—'}
                  </T>
                </>
              ) : (
                <T v="small" color={colors.secondary}>
                  {control} · {p.m.lastDataDays === 0 ? t('pro.today') : t('pro.daysAgo', { n: p.m.lastDataDays })}
                </T>
              )}
            </Pressable>
          );
        })}
      </View>
      <T v="small" color={colors.secondary}>
        {t('pro.priorityNote')}
      </T>
    </>
  );
}
