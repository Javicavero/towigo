/**
 * Bienvenida conversacional: Owi presenta la app y pregunta lo justo (§4.4, primera semana).
 * Tres caminos: tipo 2, obesidad con GLP-1 o tipo 2 con GLP-1.
 */
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import AvatarEditor from '../components/AvatarEditor';
import AvatarFace from '../components/AvatarFace';
import { Glyph, Icon, type IconName } from '../components/icons';
import { FadeIn, Pop } from '../components/motion';
import OwiAnimated from '../components/OwiAnimated';
import { LinearGradient } from 'expo-linear-gradient';
import SpeechBubble from '../components/SpeechBubble';
import { Button, Card, Choice, ProgressBar, Row, Screen, T } from '../components/ui';
import { APP_NAME, DEFAULT_AVATAR_NAME } from '../config';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { hasDiabetes, usesGlp1, type Glp1Drug, type PetMood, type Profile, type SensorId } from '../state/types';
import { colors, fonts, MIN_TOUCH, radius } from '../theme';

const STEPS = ['hello', 'name', 'owiName', 'profile', 'treatment', 'avatar', 'consent', 'team', 'commit'] as const;
type Step = (typeof STEPS)[number];
const PROFILES: { id: Profile; icon: IconName; bg: string }[] = [
  { id: 't1', icon: 'signal', bg: '#5B4BC4' },
  { id: 't2', icon: 'drop', bg: '#C8372D' },
  { id: 'glp1', icon: 'syringe', bg: '#1E63C7' },
  { id: 't2_glp1', icon: 'steth', bg: '#17785A' },
];
const DRUGS: Glp1Drug[] = ['semaglutida', 'tirzepatida', 'liraglutida', 'otro'];
const SENSORS: SensorId[] = ['glucometro', 'libre', 'dexcom', 'none'];
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const STEP_MOOD: Record<Step, PetMood> = {
  hello: 'happy',
  name: 'attentive',
  owiName: 'confused',
  profile: 'attentive',
  treatment: 'remind',
  avatar: 'remind',
  consent: 'caringLow',
  team: 'caringHigh',
  commit: 'celebrate',
};

function Input(props: React.ComponentProps<typeof TextInput>) {
  const { state } = useStore();
  return (
    <TextInput
      placeholderTextColor={colors.secondary}
      {...props}
      style={{ minHeight: MIN_TOUCH + 4, borderRadius: radius.m, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.white, paddingHorizontal: 16, fontSize: 18 * state.textScale, fontFamily: fonts.semibold, color: colors.ink }}
    />
  );
}

function Check({ checked, onToggle, label, detail }: { checked: boolean; onToggle: () => void; label: string; detail?: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} onPress={onToggle} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: MIN_TOUCH, paddingVertical: 6 }}>
      <View style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: checked ? colors.greenText : colors.secondary, backgroundColor: checked ? colors.greenText : colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
        {checked && <Icon name="check" size={20} color={colors.onAccent} stroke={3} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{label}</T>
        {detail ? (
          <T v="small" color={colors.secondary}>
            {detail}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Onboarding() {
  const { state, dispatch, d } = useStore();
  const [i, setI] = useState(0);
  const step: Step = STEPS[i];
  const next = () => setI((n) => Math.min(STEPS.length - 1, n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));
  const [name, setName] = useState(state.userName);
  const [owiName, setOwiName] = useState('');
  const [consents, setConsents] = useState(state.consents);
  const owi = state.pet.name || DEFAULT_AVATAR_NAME;
  const glp1 = usesGlp1(state.profile);
  const t2 = hasDiabetes(state.profile);

  const bubble: Record<Step, string> = {
    hello: t('onb.hello', { app: APP_NAME }),
    name: t('onb.askName'),
    owiName: t('onb.askOwiName', { name: state.userName }),
    profile: t('onb.profile', { name: state.userName }),
    treatment: t(`onb.treatment.${state.profile}`),
    avatar: t('onb.avatar'),
    consent: t('onb.consent'),
    team: t('onb.team'),
    commit: t('onb.commit', { name: state.userName }),
  };
  const pair = step === 'team' || step === 'commit';

  return (
    <Screen padBottom={40}>
      <Row style={{ justifyContent: 'space-between', minHeight: MIN_TOUCH }}>
        {i > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={back} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={28} />
          </Pressable>
        ) : (
          <View style={{ width: MIN_TOUCH }} />
        )}
        <View style={{ flex: 1, marginHorizontal: 8 }} accessible accessibilityLabel={t('onb.progress', { n: i + 1, total: STEPS.length })}>
          <ProgressBar value={((i + 1) / STEPS.length) * 100} color={colors.owiGreen} height={16} />
        </View>
        <View style={{ width: MIN_TOUCH }} />
      </Row>

      {step !== 'avatar' && (
        <FadeIn key={pair ? 'pair' : 'owi'}>
          <View style={{ borderRadius: 28, overflow: 'hidden' }}>
            <LinearGradient colors={[colors.softGreen, colors.cream]} style={{ alignItems: 'center', paddingTop: 8 }}>
              <Row style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                {pair && <AvatarFace avatar={d.owiAvatar} size={130} expression={step === 'commit' ? 'big' : 'smile'} />}
                <OwiAnimated mood={STEP_MOOD[step]} level={1} size={pair ? 200 : 250} label={t('owi.a11y', { name: owi })} />
              </Row>
            </LinearGradient>
          </View>
        </FadeIn>
      )}
      <Pop trigger={step}>
        <SpeechBubble text={bubble[step]} name={owi} arrow={pair ? 'right' : 'center'} />
      </Pop>

      <View style={{ gap: 12, marginTop: 4 }}>
        {step === 'hello' && <Button label={t('onb.helloBtn', { owi })} onPress={next} />}

        {step === 'name' && (
          <>
            <Input value={name} onChangeText={setName} placeholder={t('onb.namePh')} accessibilityLabel={t('onb.namePh')} autoFocus />
            <Button
              label={t('common.continue')}
              disabled={!name.trim()}
              onPress={() => {
                dispatch({ type: 'setName', name: name.trim() });
                next();
              }}
            />
          </>
        )}

        {step === 'owiName' && (
          <>
            <Button
              label={t('onb.keepOwi')}
              onPress={() => {
                dispatch({ type: 'setPetName', name: DEFAULT_AVATAR_NAME });
                next();
              }}
            />
            <T v="small" color={colors.secondary} center>
              {t('onb.orRename')}
            </T>
            <Input value={owiName} onChangeText={setOwiName} placeholder={t('onb.owiNamePh')} accessibilityLabel={t('onb.owiNamePh')} />
            <Button
              kind="secondary"
              label={owiName.trim() ? t('onb.callMe', { n: owiName.trim() }) : t('onb.rename')}
              disabled={!owiName.trim()}
              onPress={() => {
                dispatch({ type: 'setPetName', name: owiName.trim() });
                next();
              }}
            />
          </>
        )}

        {step === 'profile' && (
          <>
            {PROFILES.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: state.profile === p.id }}
                accessibilityLabel={t(`profile.${p.id}`)}
                onPress={() => dispatch({ type: 'setProfile', profile: p.id })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.l, borderWidth: 2, borderColor: state.profile === p.id ? colors.greenText : 'transparent', backgroundColor: state.profile === p.id ? colors.softGreen : colors.white }}
              >
                <Glyph name={p.icon} bg={p.bg} size={40} />
                <View style={{ flex: 1 }}>
                  <T v="h2">{t(`profile.${p.id}`)}</T>
                  <T v="small" color={colors.secondary}>
                    {t(`profile.${p.id}Hint`)}
                  </T>
                </View>
              </Pressable>
            ))}
            <Button label={t('common.continue')} onPress={next} />
          </>
        )}

        {step === 'treatment' && (
          <>
            {glp1 && (
              <Card>
                <T v="label">{t('onb.whichDrug')}</T>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {DRUGS.map((dr) => (
                    <Choice key={dr} label={t(`drug.${dr}`)} selected={state.glp1.drug === dr} onPress={() => dispatch({ type: 'setGlp1', patch: { drug: dr } })} />
                  ))}
                </Row>
                <T v="label">{t('onb.whichDay')}</T>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  {DAYS.map((dd, k) => (
                    <Choice key={dd} label={dd} style={{ minWidth: MIN_TOUCH, paddingHorizontal: 0 }} selected={state.glp1.weekday === k} onPress={() => dispatch({ type: 'setGlp1', patch: { weekday: k } })} />
                  ))}
                </Row>
                <T v="small" color={colors.secondary}>
                  {t('onb.doseNote')}
                </T>
              </Card>
            )}
            {t2 && (
              <Card>
                <T v="label">{t('onb.howMeasure')}</T>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {SENSORS.map((s) => (
                    <Choice key={s} label={t(`sensor.${s}`)} selected={state.sensor === s} onPress={() => dispatch({ type: 'setSensor', sensor: s })} />
                  ))}
                </Row>
                <T v="small" color={colors.secondary}>
                  {t('onb.medsNote')}
                </T>
              </Card>
            )}
            <Button label={t('common.continue')} onPress={next} />
          </>
        )}

        {step === 'avatar' && (
          <>
            <Card>
              <AvatarEditor />
            </Card>
            <Button label={t('onb.lookDone')} onPress={next} />
          </>
        )}

        {step === 'consent' && (
          <>
            <Card>
              <Check checked={consents.healthData} onToggle={() => setConsents((c) => ({ ...c, healthData: !c.healthData }))} label={t('consent.health')} detail={t('consent.healthDetail')} />
              <Check checked={consents.careTeam} onToggle={() => setConsents((c) => ({ ...c, careTeam: !c.careTeam }))} label={t('consent.team')} detail={t('consent.teamDetail')} />
              <Check checked={consents.productAnalytics} onToggle={() => setConsents((c) => ({ ...c, productAnalytics: !c.productAnalytics }))} label={t('consent.analytics')} detail={t('consent.analyticsDetail')} />
            </Card>
            <T v="small" color={colors.secondary}>
              {t('consent.rights')}
            </T>
            <Button
              label={t('consent.accept')}
              disabled={!consents.healthData || !consents.careTeam}
              onPress={() => {
                dispatch({ type: 'setConsents', consents: { ...consents, acceptedAt: new Date().toISOString() } });
                next();
              }}
            />
          </>
        )}

        {step === 'team' && (
          <>
            {(Object.keys(TEAM) as (keyof typeof TEAM)[]).map((k) => (
              <Card key={k}>
                <Row gap={14}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: TEAM[k].color, alignItems: 'center', justifyContent: 'center' }}>
                    <T v="label" color={TEAM[k].fg}>
                      {TEAM[k].initials}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="label">{TEAM[k].name}</T>
                    <T v="small" color={colors.secondary}>
                      {t(`role.${k}`)}
                    </T>
                  </View>
                </Row>
              </Card>
            ))}
            <T v="small" color={colors.secondary} center>
              {t('onb.teamNote')}
            </T>
            <Button label={t('common.continue')} onPress={next} />
          </>
        )}

        {step === 'commit' && <Button label={t('onb.commitBtn')} onPress={() => dispatch({ type: 'finishOnboarding' })} />}
      </View>
    </Screen>
  );
}
