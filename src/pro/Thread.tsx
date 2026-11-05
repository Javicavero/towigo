/** Conversación con un paciente: mensajes, audios simulados y plantillas por especialidad. */
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Icon } from '../components/icons';
import { Choice, Row, T } from '../components/ui';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { colors, fonts } from '../theme';
import { usePro } from './ProApp';

const TEMPLATES: Record<'endo' | 'nutri' | 'psico', string[]> = {
  endo: ['pro.tpl.endo1', 'pro.tpl.endo2', 'pro.tpl.endo3'],
  nutri: ['pro.tpl.nutri1', 'pro.tpl.nutri2', 'pro.tpl.nutri3'],
  psico: ['pro.tpl.psico1', 'pro.tpl.psico2', 'pro.tpl.psico3'],
};

export default function Thread({ id }: { id: string }) {
  const { get, send, role } = usePro();
  const p = get(id)!;
  const [text, setText] = useState('');
  const [rec, setRec] = useState(false);
  const msgs = p.s.messages.filter((m) => m.from !== 'owi' && (m.text || m.kind === 'audio'));
  const reply = (body: string) => {
    if (!body.trim()) return;
    send(id, { type: 'teamMessage', from: role, text: body.trim() });
    setText('');
  };
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 8 }}>
        {msgs.map((m) => {
          const mine = m.from !== 'patient';
          const who = mine ? TEAM[m.from as keyof typeof TEAM] : null;
          return (
            <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', gap: 2 }}>
              <T v="small" color={colors.secondary} style={{ alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                {mine ? who?.name : p.name} · {new Date(m.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </T>
              <View
                style={{ backgroundColor: mine ? colors.softGreen : colors.surface2, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line }}
              >
                {m.kind === 'audio' ? (
                  <Row gap={8}>
                    <Icon name="play" size={18} color={colors.greenText} />
                    <T v="small">{t('pro.audio', { s: m.durationSec ?? 0 })}</T>
                  </Row>
                ) : null}
                {m.text ? (
                  <T v={m.kind === 'audio' ? 'small' : 'body'} color={m.kind === 'audio' ? colors.secondary : colors.ink}>
                    {t(m.text)}
                  </T>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {TEMPLATES[role].map((k) => (
          <Choice key={k} label={t(`${k}.label`)} onPress={() => setText(t(k, { name: p.s.userName }))} style={{ minHeight: 34 }} />
        ))}
      </Row>
      <Row gap={8} style={{ alignItems: 'flex-end' }}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder={t('pro.replyPh', { who: TEAM[role].short })}
          placeholderTextColor={colors.secondary}
          accessibilityLabel={t('pro.replyPh', { who: TEAM[role].short })}
          style={{
            flex: 1,
            minHeight: 46,
            maxHeight: 140,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.white,
            padding: 12,
            fontFamily: fonts.regular,
            fontSize: 15,
            color: colors.ink,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rec ? t('pro.stopAudio') : t('pro.recordAudio')}
          onPress={() => {
            if (rec) send(id, { type: 'teamMessage', from: role, kind: 'audio', durationSec: 34, text: t('pro.audioTranscript') });
            setRec(!rec);
          }}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: rec ? colors.coralText : colors.chip,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={rec ? 'pause' : 'mic'} size={20} color={rec ? colors.onAccent : colors.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          onPress={() => reply(text)}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.greenText, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="send" size={20} color={colors.onAccent} />
        </Pressable>
      </Row>
      <T v="small" color={colors.secondary}>
        {rec ? t('pro.recording') : t('pro.threadNote')}
      </T>
    </View>
  );
}
