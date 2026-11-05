/**
 * Chat con Owi. Escribe como hablas ("me he puesto 4 u de rápida hace 15 min", "¿cómo voy?")
 * y Owi apunta, explica tus datos o te ayuda a preparar la consulta. Nunca da dosis ni indicaciones clínicas.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckinCard } from '../components/checkin';
import { Icon } from '../components/icons';
import { FadeIn } from '../components/motion';
import OwiAnimated from '../components/OwiAnimated';
import { Button, Row, T } from '../components/ui';
import { t } from '../i18n';
import { useNav } from '../nav';
import { owiThink, SUGGESTIONS, type Chip, type OwiAction, type OwiReply } from '../owi/brain';
import { backendConfigured, owiAsk } from '../services/backend';
import { useStore } from '../state/store';
import type { PetMood } from '../state/types';
import { colors, fonts, MIN_TOUCH, radius } from '../theme';

const hhmm = (x: string) => new Date(x).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

export default function OwiChat() {
  const { state, dispatch, d } = useStore();
  const { go } = useNav();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [confirm, setConfirm] = useState<OwiAction | null>(null);
  const [chips, setChips] = useState<Chip[]>(() => SUGGESTIONS(state.profile).map((x) => ({ label: x, send: x })));
  const [mood, setMood] = useState<PetMood>('happy');
  const [showCheckin, setShowCheckin] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const owi = state.pet.name;

  useEffect(() => {
    if (!state.owiChat.length) dispatch({ type: 'chat', from: 'owi', text: t('chat.welcome', { name: state.userName || t('common.friend'), owi }) });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reply = (r: OwiReply) => {
    dispatch({ type: 'chat', from: 'owi', text: r.text });
    setConfirm(r.confirm ?? null);
    setChips(r.chips ?? (r.confirm ? [] : SUGGESTIONS(state.profile).slice(0, 3).map((x) => ({ label: x, send: x }))));
    if (r.mood) setMood(r.mood);
  };

  const send = async (msg: string) => {
    const m = msg.trim();
    if (!m) return;
    setText('');
    setConfirm(null);
    setChips([]);
    dispatch({ type: 'chat', from: 'me', text: m });
    setTyping(true);
    let r = owiThink(m, state, d);
    // Preguntas abiertas: si el backend está activo, responde la IA (con las mismas reglas); si no, el cerebro local.
    if (backendConfigured && r.text === t('chat.unknown')) {
      try {
        const ai = await owiAsk(m, { profile: state.profile, streak: d.streak, tir24: d.tir24, lostKg: d.lostKg, injectionWeeks: d.injectionWeeks }, state.owiChat);
        r = { text: ai };
      } catch {
        /* seguimos con la respuesta local */
      }
    }
    setTimeout(() => {
      setTyping(false);
      reply(r);
    }, 650);
  };

  const run = (a: OwiAction) => {
    switch (a.type) {
      case 'askTeam':
        dispatch({ type: 'askTeam', text: a.text });
        reply({ text: t('chat.sentTeam'), chips: [{ label: t('chat.goTeam'), open: 'team' }], mood: 'happy' });
        return;
      case 'saveQuestions':
        dispatch({ type: 'saveQuestions', questions: a.questions });
        reply({ text: t('chat.savedQuestions'), mood: 'celebrate' });
        return;
      default:
        dispatch(a);
        reply({ text: t('chat.saved', { owi }), mood: 'celebrate' });
    }
  };

  const onChip = (c: Chip) => {
    if (c.send) return send(c.send);
    if (c.action) return run(c.action);
    if (c.open === 'checkin') return setShowCheckin(true);
    if (c.open === 'team') return go('team');
    if (c.open) go('log', c.open);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Cabecera */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 8, backgroundColor: colors.white, borderBottomWidth: 0.5, borderBottomColor: colors.borderStrong }}>
        <Row gap={8} style={{ maxWidth: 520, width: '100%', alignSelf: 'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => go('home')} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={26} />
          </Pressable>
          <OwiAnimated mood={typing ? 'attentive' : mood} level={d.petLevel} size={48} />
          <View style={{ flex: 1 }}>
            <T v="h2">{owi}</T>
            <T v="small" color={colors.secondary}>
              {typing ? t('chat.typing', { owi }) : t('chat.subtitle')}
            </T>
          </View>
        </Row>
      </View>

      <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 24, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        {state.owiChat.map((m) => {
          const me = m.from === 'me';
          return (
            <FadeIn key={m.id} from={6}>
              <View style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%', backgroundColor: me ? colors.greenText : colors.white, borderRadius: 18, borderBottomRightRadius: me ? 6 : 18, borderBottomLeftRadius: me ? 18 : 6, paddingHorizontal: 14, paddingVertical: 10, gap: 2 }}>
                <T color={me ? colors.onAccent : colors.ink}>{m.text}</T>
                <T v="small" color={me ? '#D7F0E6' : colors.secondary} style={{ fontSize: 11, alignSelf: 'flex-end' }}>
                  {hhmm(m.at)}
                </T>
              </View>
            </FadeIn>
          );
        })}
        {typing && (
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 }}>
            <T color={colors.secondary}>•••</T>
          </View>
        )}
        {confirm && (
          <Row gap={8}>
            <Button style={{ flex: 1 }} label={t('chat.confirmYes')} onPress={() => run(confirm)} />
            <Button
              style={{ flex: 1 }}
              kind="secondary"
              label={t('chat.confirmNo')}
              onPress={() => {
                setConfirm(null);
                reply({ text: t('chat.cancelled') });
              }}
            />
          </Row>
        )}
        {showCheckin && (
          <View style={{ backgroundColor: colors.white, borderRadius: radius.l, padding: 14 }}>
            <CheckinCard
              embedded
              onDone={(v) => {
                setShowCheckin(false);
                reply({ text: t(v <= 2 ? 'chat.checkinLow' : 'chat.checkinOk', { owi }), mood: v <= 2 ? 'caringHigh' : 'celebrate' });
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* Sugerencias y caja de texto */}
      <View style={{ paddingBottom: insets.bottom + 76, paddingTop: 6, backgroundColor: colors.cream }}>
        {chips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 8 }}>
            {chips.map((c, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                onPress={() => onChip(c)}
                style={({ pressed }) => ({ paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 20, backgroundColor: c.action || c.open ? colors.greenText : colors.white, borderWidth: 1, borderColor: colors.borderStrong, opacity: pressed ? 0.7 : 1 })}
              >
                <T v="label" color={c.action || c.open ? colors.onAccent : colors.ink}>
                  {c.label}
                </T>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Row gap={8} style={{ paddingHorizontal: 12, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => send(text)}
            placeholder={t('chat.placeholder', { owi })}
            placeholderTextColor={colors.secondary}
            accessibilityLabel={t('chat.placeholder', { owi })}
            returnKeyType="send"
            style={{ flex: 1, minHeight: MIN_TOUCH, borderRadius: 22, backgroundColor: colors.white, paddingHorizontal: 16, fontSize: 16, fontFamily: fonts.regular, color: colors.ink, borderWidth: 1, borderColor: colors.borderStrong }}
          />
          <Pressable accessibilityRole="button" accessibilityLabel={t('chat.send')} onPress={() => send(text)} style={{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, backgroundColor: colors.greenText, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={22} color={colors.onAccent} />
          </Pressable>
        </Row>
        <T v="small" color={colors.secondary} center style={{ marginTop: 6, fontSize: 11 }}>
          {t('chat.disclaimer')}
        </T>
      </View>
    </View>
  );
}
