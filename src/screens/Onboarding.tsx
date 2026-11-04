/**
 * Onboarding conversacional: Owi presenta la app y hace las preguntas.
 * Objetivo: menos de 2 minutos y sin formularios largos (§4.4, primera semana).
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import AvatarEditor from '../components/AvatarEditor';
import { Icon } from '../components/icons';
import Scene3D from '../components/Scene3D';
import SpeechBubble from '../components/SpeechBubble';
import { FadeIn, Pop } from '../components/motion';
import { Button, Card, Choice, ProgressBar, Row, Screen, T } from '../components/ui';
import { APP_NAME, DEFAULT_AVATAR_NAME } from '../config';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { useStore } from '../state/store';
import type { SensorId } from '../state/types';
import { colors, fonts, MIN_TOUCH, radius } from '../theme';

const STEPS = ['hello', 'name', 'owiName', 'look', 'consent', 'sensor', 'team', 'commit'] as const;
type Step = (typeof STEPS)[number];

function Input(props: React.ComponentProps<typeof TextInput>) {
  const { state } = useStore();
  return (
    <TextInput
      placeholderTextColor={colors.secondary}
      {...props}
      style={{
        minHeight: MIN_TOUCH + 4,
        borderRadius: radius.m,
        borderWidth: 2,
        borderColor: colors.line,
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        fontSize: 18 * state.textScale,
        fontFamily: fonts.semibold,
        color: colors.ink,
      }}
    />
  );
}

function Check({ checked, onToggle, label, detail }: { checked: boolean; onToggle: () => void; label: string; detail?: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: MIN_TOUCH, paddingVertical: 6 }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: checked ? colors.greenText : colors.secondary,
          backgroundColor: checked ? colors.greenText : colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {checked && <Icon name="check" size={20} color={colors.white} stroke={3} />}
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
  const [connecting, setConnecting] = useState<SensorId | null>(null);
  const [connected, setConnected] = useState<SensorId | null>(null);

  useEffect(() => {
    if (!connecting) return;
    const id = setTimeout(() => {
      dispatch({ type: 'setSensor', sensor: connecting });
      setConnected(connecting);
      setConnecting(null);
    }, 1600);
    return () => clearTimeout(id);
  }, [connecting, dispatch]);

  const owi = state.pet.name || DEFAULT_AVATAR_NAME;
  const sceneMode = step === 'look' ? 'avatar' : step === 'commit' || step === 'team' ? 'pair' : 'pet';
  const bubble: Record<Step, string> = {
    hello: t('onb.hello', { app: APP_NAME }),
    name: t('onb.askName'),
    owiName: t('onb.askOwiName', { name: state.userName }),
    look: t('onb.look'),
    consent: t('onb.consent'),
    sensor: connected ? t('onb.sensorDone', { sensor: t(`sensor.${connected}`) }) : t('onb.sensor'),
    team: t('onb.team'),
    commit: t('onb.commit', { name: state.userName }),
  };

  return (
    <Screen padBottom={40}>
      <Row style={{ justifyContent: 'space-between', minHeight: MIN_TOUCH }}>
        {i > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={back}
            style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
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

      {/* Owi se presenta solo; en "look" vemos tu avatar; al final, los dos juntos. */}
      <FadeIn key={sceneMode}>
        <Scene3D
          mode={sceneMode}
          avatar={d.owiAvatar}
          avatarMood={step === 'commit' ? 'celebrate' : 'happy'}
          petMood={step === 'commit' ? 'celebrate' : step === 'hello' ? 'missYou' : step === 'consent' ? 'attentive' : 'happy'}
          petLevel={d.petLevel}
          height={step === 'look' ? 300 : 230}
          accessibilityLabel={t('owi.a11y', { name: owi })}
        />
      </FadeIn>
      <Pop trigger={step}>
        <SpeechBubble text={bubble[step]} name={owi} arrow={sceneMode === 'pair' ? 'right' : 'center'} />
      </Pop>

      <View style={{ gap: 12, marginTop: 4 }}>
        {step === 'hello' && <Button label={t('onb.helloBtn', { owi })} onPress={next} />}

        {step === 'name' && (
          <>
            <Input
              value={name}
              onChangeText={setName}
              placeholder={t('onb.namePh')}
              accessibilityLabel={t('onb.namePh')}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => {
                if (name.trim()) {
                  dispatch({ type: 'setName', name: name.trim() });
                  next();
                }
              }}
            />
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

        {step === 'look' && (
          <>
            <T v="small" color={colors.secondary} center>
              {t('onb.dragHint')}
            </T>
            <Card>
              <AvatarEditor />
            </Card>
            <Button label={t('onb.lookDone')} onPress={next} />
          </>
        )}

        {step === 'consent' && (
          <>
            <Card>
              <Check
                checked={consents.healthData}
                onToggle={() => setConsents((c) => ({ ...c, healthData: !c.healthData }))}
                label={t('consent.health')}
                detail={t('consent.healthDetail')}
              />
              <Check
                checked={consents.careTeam}
                onToggle={() => setConsents((c) => ({ ...c, careTeam: !c.careTeam }))}
                label={t('consent.team')}
                detail={t('consent.teamDetail')}
              />
              <Check
                checked={consents.productAnalytics}
                onToggle={() => setConsents((c) => ({ ...c, productAnalytics: !c.productAnalytics }))}
                label={t('consent.analytics')}
                detail={t('consent.analyticsDetail')}
              />
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

        {step === 'sensor' && (
          <>
            {connecting ? (
              <Card tone="green" style={{ alignItems: 'center' }}>
                <ActivityIndicator color={colors.greenText} size="large" />
                <T v="label">{t('onb.connecting', { sensor: t(`sensor.${connecting}`) })}</T>
                <T v="small" color={colors.secondary} center>
                  {t('common.demoNote')}
                </T>
              </Card>
            ) : connected ? (
              <Button label={t('common.continue')} onPress={next} />
            ) : (
              <>
                {(['libre', 'dexcom', 'otro'] as SensorId[]).map((s) => (
                  <Choice key={s} label={t(`sensor.${s}`)} onPress={() => setConnecting(s)} />
                ))}
                <Button
                  kind="ghost"
                  label={t('onb.noSensor')}
                  onPress={() => {
                    dispatch({ type: 'setSensor', sensor: 'none' });
                    next();
                  }}
                />
              </>
            )}
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
