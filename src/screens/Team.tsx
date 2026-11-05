/**
 * Chat asíncrono con el equipo humano: texto y mensajes de audio (§4.3).
 * Owi hace de puente, nunca sustituye al equipo.
 */
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Icon } from '../components/icons';
import OwiSticker from '../components/OwiSticker';
import { Card, Row, Screen, T } from '../components/ui';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { useStore } from '../state/store';
import type { Message } from '../state/types';
import { colors, fonts, MIN_TOUCH, radius } from '../theme';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Avatar({ from, size = 40 }: { from: Message['from']; size?: number }) {
  const { state } = useStore();
  const isOwi = from === 'owi';
  if (isOwi) return <OwiSticker mood="happy" size={size + 6} />;
  const m = isOwi ? null : from === 'patient' ? null : TEAM[from];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isOwi ? colors.softYellow : m?.color ?? colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <T v="small" color={m?.fg ?? colors.ink}>
        {isOwi ? state.pet.name.slice(0, 2) : m?.initials ?? ''}
      </T>
    </View>
  );
}

function AudioBubble({ m, mine }: { m: Message; mine: boolean }) {
  const { dispatch } = useStore();
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const dur = m.durationSec ?? 30;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPos((p) => {
        // Prototipo: el audio es simulado y avanza 4 veces más rápido.
        const np = p + 0.4;
        if (np >= dur) {
          setPlaying(false);
          return 0;
        }
        return np;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, dur]);
  const fg = mine ? colors.onAccent : colors.ink;
  const bars = 22;
  return (
    <View style={{ gap: 8 }}>
      <Row gap={10}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t('team.pause') : t('team.play', { s: dur })}
          onPress={() => {
            setPlaying((p) => !p);
            if (!m.read || !playing) dispatch({ type: 'listened', id: m.id });
          }}
          style={{
            width: MIN_TOUCH,
            height: MIN_TOUCH,
            borderRadius: MIN_TOUCH / 2,
            backgroundColor: mine ? colors.white : colors.greenText,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={playing ? 'pause' : 'play'} size={22} color={mine ? colors.greenText : colors.onAccent} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 32 }} accessibilityElementsHidden importantForAccessibility="no">
          {Array.from({ length: bars }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 6 + Math.abs(Math.sin(i * 1.7 + m.id.length)) * 24,
                borderRadius: 2,
                backgroundColor: i / bars <= pos / dur ? (mine ? colors.white : colors.greenText) : mine ? 'rgba(255,255,255,0.45)' : colors.line,
              }}
            />
          ))}
        </View>
        <T v="small" color={fg}>
          {fmt(playing || pos ? pos : dur)}
        </T>
      </Row>
      {m.text ? (
        <T v="small" color={mine ? colors.onAccent : colors.secondary}>
          {t('team.transcript')}: {t(m.text)}
        </T>
      ) : null}
    </View>
  );
}

export default function Team() {
  const { state, dispatch } = useStore();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const lastFromPatient = [...state.messages].reverse().find((m) => m.from === 'patient');
  useEffect(() => {
    if (!lastFromPatient) return;
    const last = state.messages[state.messages.length - 1];
    if (last.from !== 'patient') return;
    const id = setTimeout(() => dispatch({ type: 'owiReply', text: t('team.owiBridge', { owi: state.pet.name }) }), 1400);
    return () => clearTimeout(id);
  }, [state.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    if (!text.trim()) return;
    dispatch({ type: 'sendMessage', kind: 'text', text: text.trim() });
    setText('');
  };

  return (
    <Screen padBottom={110} stickToEnd>
      <T v="title" accessibilityRole="header">
        {t('team.title')}
      </T>
      <Row gap={10} style={{ flexWrap: 'wrap' }}>
        {(Object.keys(TEAM) as (keyof typeof TEAM)[]).map((k) => (
          <Row key={k} gap={8} style={{ backgroundColor: colors.white, paddingRight: 14, paddingLeft: 4, paddingVertical: 4, borderRadius: 26 }}>
            <Avatar from={k} size={40} />
            <View>
              <T v="small">{TEAM[k].short}</T>
              <T v="small" color={colors.secondary} style={{ fontSize: 11 * state.textScale }}>
                {t(`role.${k}`)}
              </T>
            </View>
          </Row>
        ))}
      </Row>
      <T v="small" color={colors.secondary}>
        {t('team.responseTime')}
      </T>

      <View style={{ gap: 12 }}>
        {state.messages.map((m) => {
          const mine = m.from === 'patient';
          return (
            <View key={m.id} style={{ flexDirection: mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!mine && <Avatar from={m.from} />}
              <View
                style={{
                  maxWidth: '82%',
                  flexShrink: 1,
                  backgroundColor: mine ? colors.greenText : m.from === 'owi' ? colors.softYellow : colors.white,
                  borderRadius: radius.l,
                  borderBottomLeftRadius: mine ? radius.l : 6,
                  borderBottomRightRadius: mine ? 6 : radius.l,
                  padding: 14,
                  gap: 6,
                  minWidth: m.kind === 'audio' ? 260 : undefined,
                }}
              >
                {!mine && (
                  <T v="small" color={colors.greenText}>
                    {m.from === 'owi' ? state.pet.name : TEAM[m.from as keyof typeof TEAM].name}
                    {!m.read ? ` · ${t('team.new')}` : ''}
                  </T>
                )}
                {m.kind === 'audio' ? <AudioBubble m={m} mine={mine} /> : <T color={mine ? colors.onAccent : colors.ink}>{t(m.text ?? '')}</T>}
                <T v="small" color={mine ? 'rgba(255,255,255,0.85)' : colors.secondary} style={{ alignSelf: 'flex-end', fontSize: 11 * state.textScale }}>
                  {new Date(m.at).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </T>
              </View>
            </View>
          );
        })}
      </View>

      <Card style={{ padding: 10, marginTop: 8 }}>
        {recording ? (
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={8}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.low }} />
              <T v="label">{t('team.recording', { t: fmt(recSecs) })}</T>
            </Row>
            <Row gap={8}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                onPress={() => {
                  setRecording(false);
                  setRecSecs(0);
                }}
                style={{ minHeight: MIN_TOUCH, paddingHorizontal: 14, justifyContent: 'center' }}
              >
                <T v="label" color={colors.secondary}>
                  {t('common.cancel')}
                </T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('team.sendAudio')}
                onPress={() => {
                  dispatch({ type: 'sendMessage', kind: 'audio', durationSec: Math.max(2, recSecs) });
                  setRecording(false);
                  setRecSecs(0);
                }}
                style={{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, backgroundColor: colors.greenText, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="send" size={22} color={colors.onAccent} />
              </Pressable>
            </Row>
          </Row>
        ) : (
          <Row gap={8}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('team.placeholder')}
              placeholderTextColor={colors.secondary}
              accessibilityLabel={t('team.placeholder')}
              onSubmitEditing={send}
              style={{ flex: 1, minHeight: MIN_TOUCH, paddingHorizontal: 12, fontSize: 16 * state.textScale, fontFamily: fonts.semibold, color: colors.ink }}
            />
            {text.trim() ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('team.send')}
                onPress={send}
                style={{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, backgroundColor: colors.greenText, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="send" size={22} color={colors.onAccent} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('team.recordAudio')}
                onPress={() => setRecording(true)}
                style={{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, backgroundColor: colors.coralText, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="mic" size={24} color={colors.onAccent} />
              </Pressable>
            )}
          </Row>
        )}
      </Card>
      <T v="small" color={colors.secondary} center>
        {t('team.emergency')}
      </T>
    </Screen>
  );
}
