/**
 * "Yo": ajustes en secciones desplegables (estilo Ajustes de iOS): solo se abre lo que se necesita.
 * Avatar, Owi, perfil, plan y avisos, conexiones, letra, privacidad (RGPD §8.3) y demostración.
 */
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import AvatarBadge from '../components/AvatarBadge';
import AvatarEditor from '../components/AvatarEditor';
import DexcomCard from '../components/DexcomCard';
import { Glyph } from '../components/icons';
import OwiAnimated from '../components/OwiAnimated';
import OwiSticker from '../components/OwiSticker';
import PlanSettings from '../components/PlanSettings';
import { CrewSettings } from '../components/crew';
import { ReportCard } from '../components/program';
import { buildWidgetSnapshot } from '../widgets/snapshot';
import WidgetPreview from '../widgets/WidgetPreview';
import { buildLiveActivity } from '../widgets/liveActivity';
import { Button, Card, Choice, Disclosure, Row, Screen, SectionTitle, T } from '../components/ui';
import { APP_NAME, FLAGS } from '../config';
import { ACCESSORIES } from '../data/avatarOptions';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { hasDiabetes, hasT2, usesGlp1, type Profile, type ReminderKind, type Scenario, type TextScale } from '../state/types';
import { colors, fonts, MIN_TOUCH, readAppearancePref, setAppearancePref, type Appearance_ } from '../theme';
import { openPro } from '../pro/openPro';

type Section = 'appearance' | 'pro' | 'crew' | 'avatar' | 'owi' | 'widgets' | 'profile' | 'plan' | 'report' | 'sensor' | 'text' | 'privacy' | 'demo';
const SCENARIOS: Scenario[] = ['normal', 'injectionDay', 'missedInjection', 'sideEffects', 'plateau', 'milestone', 'highGlucose', 'lowGlucose', 'night'];
const DEMO_REMINDERS: ReminderKind[] = ['injection', 'insulin', 'meds', 'weigh', 'meal', 'sport', 'water'];

export default function Me() {
  const { state, dispatch, d } = useStore();
  const [open, setOpen] = useState<Section | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toggle = (s: Section) => setOpen((o) => (o === s ? null : s));
  const glp1 = usesGlp1(state.profile);
  const t2 = hasDiabetes(state.profile);

  return (
    <Screen>
      <T v="display" accessibilityRole="header">
        {t('tab.me')}
      </T>
      <Card>
        <Row gap={14}>
          <AvatarBadge avatar={d.owiAvatar} size={64} label={t('avatar.you', { name: state.userName })} />
          <View style={{ flex: 1 }}>
            <T v="h2">{state.userName || t('common.friend')}</T>
            <T v="small" color={colors.secondary}>
              {t(`profile.${state.profile}`)}
            </T>
          </View>
        </Row>
      </Card>

      <SectionTitle>{t('me.personal')}</SectionTitle>
      <Disclosure icon={<Glyph name="heart" bg="#5B4BC4" />} title={t('crew.title')} subtitle={t('crew.sub', { n: state.crew.length })} open={open === 'crew'} onToggle={() => toggle('crew')}>
        <CrewSettings />
      </Disclosure>
      <Disclosure icon={<Glyph name="user" bg="#5F6670" />} title={t('me.avatarTitle')} subtitle={t('me.avatarSub')} open={open === 'avatar'} onToggle={() => toggle('avatar')}>
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
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH, opacity: unlocked ? 1 : 0.5 }}
            >
              <T v="label" style={{ flex: 1 }}>
                {t(`acc.${a.id}`)} {unlocked ? '' : `· ${t('progress.unlockAt', { n: a.unlockDays })}`}
              </T>
              <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: on ? colors.greenText : colors.line, padding: 2, alignItems: on ? 'flex-end' : 'flex-start' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white }} />
              </View>
            </Pressable>
          );
        })}
      </Disclosure>
      <Disclosure icon={<OwiSticker mood="happy" size={34} />} title={t('me.petTitle', { owi: state.pet.name })} subtitle={t('me.petSub', { n: d.petLevel })} open={open === 'owi'} onToggle={() => toggle('owi')}>
        <Row gap={12}>
          <OwiAnimated mood="happy" level={d.petLevel} size={80} />
          <T v="small" color={colors.secondary} style={{ flex: 1 }}>
            {t('me.petNote')}
          </T>
        </Row>
        <TextInput
          value={state.pet.name}
          onChangeText={(n) => dispatch({ type: 'setPetName', name: n.slice(0, 20) || 'Owi' })}
          accessibilityLabel={t('me.petRename')}
          style={{ minHeight: MIN_TOUCH, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.white, paddingHorizontal: 14, fontSize: 17, fontFamily: fonts.medium, color: colors.ink }}
        />
      </Disclosure>
      <Disclosure icon={<Glyph name="widget" bg="#5B4BC4" />} title={t('me.widgets')} subtitle={t('me.widgetsSub')} open={open === 'widgets'} onToggle={() => toggle('widgets')}>
        <WidgetPreview s={buildWidgetSnapshot(state, d)} la={buildLiveActivity(state, d)} />
        <T v="small">{t('me.widgetsHow')}</T>
        <T v="small" color={colors.secondary}>
          {t('me.widgetsNote')}
        </T>
      </Disclosure>
      <Disclosure icon={<Glyph name="steth" bg="#1E63C7" />} title={t('me.profileTitle')} subtitle={t(`profile.short.${state.profile}`)} open={open === 'profile'} onToggle={() => toggle('profile')}>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {(['t1', 't2', 'glp1', 't2_glp1'] as Profile[]).map((p) => (
            <Choice key={p} label={t(`profile.short.${p}`)} selected={state.profile === p} onPress={() => dispatch({ type: 'setProfile', profile: p })} />
          ))}
        </Row>
        <T v="small" color={colors.secondary}>
          {t('me.profileNote')}
        </T>
      </Disclosure>

      <SectionTitle>{t('me.treatment')}</SectionTitle>
      <Disclosure icon={<Glyph name="clock" bg="#D9542F" />} title={t('plan.title')} subtitle={t('me.planSub')} open={open === 'plan'} onToggle={() => toggle('plan')}>
        <PlanSettings />
      </Disclosure>
      <Disclosure icon={<Glyph name="doc" bg="#1E63C7" />} title={t('report.cardTitle')} subtitle={t('report.meSub')} open={open === 'report'} onToggle={() => toggle('report')}>
        <ReportCard embedded />
      </Disclosure>
      {(state.sensor === 'dexcom' || state.sensor === 'libre') && (
        <Disclosure icon={<Glyph name="signal" bg="#1E63C7" />} title={t('me.sensorTitle')} subtitle={t(`sensor.${state.sensor}`)} open={open === 'sensor'} onToggle={() => toggle('sensor')}>
          <DexcomCard />
        </Disclosure>
      )}

      <SectionTitle>{t('me.app')}</SectionTitle>
      <Disclosure icon={<Glyph name="steth" bg="#0B7266" />} title={t('me.pro')} subtitle={t('me.proSub')} open={open === 'pro'} onToggle={() => toggle('pro')}>
        <T v="small" color={colors.secondary}>
          {t('me.proNote')}
        </T>
        <Button label={t('me.proOpen')} onPress={openPro} />
      </Disclosure>
      <Disclosure icon={<Glyph name="widget" bg="#2F3440" />} title={t('me.appearance')} subtitle={t(`me.appearance.${readAppearancePref()}`)} open={open === 'appearance'} onToggle={() => toggle('appearance')}>
        <Row gap={8}>
          {(['system', 'light', 'dark'] as Appearance_[]).map((a) => (
            <Choice key={a} style={{ flex: 1 }} label={t(`me.appearance.${a}`)} selected={readAppearancePref() === a} onPress={() => setAppearancePref(a)} />
          ))}
        </Row>
        <T v="small" color={colors.secondary}>
          {t('me.appearanceNote')}
        </T>
      </Disclosure>
      <Disclosure icon={<Glyph name="textSize" bg="#5F6670" />} title={t('me.textSize')} subtitle={t(`me.size.${state.textScale}`)} open={open === 'text'} onToggle={() => toggle('text')}>
        <Row gap={8}>
          {([1, 1.2, 1.4] as TextScale[]).map((s) => (
            <Choice key={s} style={{ flex: 1 }} label={t(`me.size.${s}`)} selected={state.textScale === s} onPress={() => dispatch({ type: 'setTextScale', scale: s })} />
          ))}
        </Row>
      </Disclosure>
      <Disclosure icon={<Glyph name="lock" bg="#17785A" />} title={t('me.privacy')} subtitle={t('me.privacySub')} open={open === 'privacy'} onToggle={() => toggle('privacy')}>
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
      </Disclosure>

      {FLAGS.demoScenarios && (
        <Disclosure icon={<Glyph name="demo" bg="#5B4BC4" />} title={t('demo.section')} subtitle={t('demo.sectionSub')} open={open === 'demo'} onToggle={() => toggle('demo')}>
          <T v="label">{t('demo.profile')}</T>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {(['t1', 'glp1', 't2', 't2_glp1'] as Profile[]).map((p) => (
              <Choice key={p} label={t(`profile.short.${p}`)} selected={state.profile === p} onPress={() => dispatch({ type: 'setProfile', profile: p })} />
            ))}
          </Row>
          <T v="label">{t('demo.title')}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SCENARIOS.filter((s) => (glp1 || !['injectionDay', 'missedInjection', 'sideEffects', 'plateau'].includes(s)) && (t2 || !['highGlucose', 'lowGlucose'].includes(s))).map((s) => (
              <Choice key={s} label={t(`demo.${s}`)} selected={state.scenario === s && !state.demoReminder} onPress={() => dispatch({ type: 'setScenario', scenario: s })} />
            ))}
          </View>
          <T v="label">{t('demo.reminders')}</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DEMO_REMINDERS.filter((k) => (glp1 || k !== 'injection') && (hasT2(state.profile) || k !== 'meds') && (state.profile === 't1' || k !== 'insulin')).map((k) => (
              <Choice key={k} label={t(`demo.rem.${k}`)} selected={state.demoReminder === k} onPress={() => dispatch({ type: 'setDemoReminder', kind: state.demoReminder === k ? null : k })} />
            ))}
          </ScrollView>
          <T v="small" color={colors.secondary}>
            {t('demo.hint')}
          </T>
          <Button kind="ghost" label={t('me.restartDemo')} onPress={() => dispatch({ type: 'reset' })} />
        </Disclosure>
      )}

      <View style={{ gap: 4, alignItems: 'center', marginTop: 8 }}>
        <T v="small" color={colors.secondary} center>
          {t('me.footer', { app: APP_NAME })}
        </T>
        <T v="small" color={colors.secondary} center>
          {t('me.phase1')}
        </T>
      </View>
    </Screen>
  );
}
