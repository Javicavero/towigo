/**
 * Check-in emocional diario: "¿Cómo estás hoy?" en 5 segundos.
 * Si hay varios días duros seguidos, Owi ofrece (no obliga) avisar a la psicóloga del equipo.
 */
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { TEAM } from '../data/mock';
import { t } from '../i18n';
import { dayKeyAgo, dayKeyToDate } from '../state/dates';
import { useStore } from '../state/store';
import type { CheckIn } from '../state/types';
import { colors, fonts, MIN_TOUCH, radius } from '../theme';
import { tap } from './motion';
import { Button, Card, Choice, Row, T } from './ui';

export const MOOD_COLOR: Record<CheckIn['v'], string> = { 1: '#B3261E', 2: '#E8743B', 3: '#E8B33B', 4: '#7CB36B', 5: '#2BB58A' };
/** Web: sin el contorno de foco que pone el navegador al abrir la ventana (parecía una cara ya elegida). */
const NO_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object;
const TAGS = ['sleep', 'tired', 'stress', 'work', 'family', 'pain', 'food', 'motivated'];

const OWI_FACE = {
  1: require('../../assets/owi/scale/v1.png'),
  2: require('../../assets/owi/scale/v2.png'),
  3: require('../../assets/owi/scale/v3.png'),
  4: require('../../assets/owi/scale/v4.png'),
  5: require('../../assets/owi/scale/v5.png'),
} as const;

/** Escala de ánimo con la cara de Owi (de triste a contento). En tamaños muy pequeños, una cara sencilla de color. */
export function MoodFace({ v, size = 40 }: { v: CheckIn['v']; size?: number }) {
  if (size >= 28)
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 2, borderColor: MOOD_COLOR[v], backgroundColor: colors.softGreen }}>
        <Image source={OWI_FACE[v]} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      </View>
    );
  const curve = { 1: -7, 2: -3.5, 3: 0, 4: 3.5, 5: 7 }[v];
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={19} fill={MOOD_COLOR[v]} />
      <Circle cx={14} cy={16} r={2.4} fill="#1C1C1E" />
      <Circle cx={26} cy={16} r={2.4} fill="#1C1C1E" />
      <Path d={`M12 ${27 - curve / 2} Q20 ${27 + curve} 28 ${27 - curve / 2}`} stroke="#1C1C1E" strokeWidth={2.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckinCard({ onDone, embedded }: { onDone?: (v: CheckIn['v']) => void; embedded?: boolean }) {
  const { state, dispatch } = useStore();
  const [v, setV] = useState<CheckIn['v'] | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [share, setShare] = useState(false);
  const body = (
    <View style={{ gap: 12 }}>
      <T v="h2">{t('checkin.title', { owi: state.pet.name })}</T>
      <Row gap={4}>
        {([1, 2, 3, 4, 5] as CheckIn['v'][]).map((k) => (
          <Pressable
            key={k}
            accessibilityRole="radio"
            accessibilityState={{ selected: v === k }}
            accessibilityLabel={t(`checkin.v${k}`)}
            onPress={() => {
              tap();
              setV(k);
              setShare(k <= 2);
            }}
            style={{ alignItems: 'center', gap: 4, padding: 4, borderRadius: radius.m, borderWidth: 2, borderColor: v === k ? colors.greenText : 'transparent', backgroundColor: v === k ? colors.softGreen : 'transparent', flex: 1, minHeight: MIN_TOUCH, opacity: v === null || v === k ? 1 : 0.55, ...NO_OUTLINE }}
          >
            <MoodFace v={k} size={48} />
            <T v="small" style={{ fontSize: 11 }} center numberOfLines={1}>
              {t(`checkin.v${k}`)}
            </T>
          </Pressable>
        ))}
      </Row>
      {v !== null && (
        <>
          <T v="small" color={colors.secondary}>
            {t('checkin.why')}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map((g) => (
              <Choice key={g} label={t(`checkin.tag.${g}`)} selected={tags.includes(g)} onPress={() => setTags((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g]))} />
            ))}
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('checkin.notePh')}
            placeholderTextColor={colors.secondary}
            multiline
            accessibilityLabel={t('checkin.notePh')}
            style={{ minHeight: 60, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.white, padding: 12, fontSize: 16, fontFamily: fonts.regular, color: colors.ink }}
          />
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: share }} onPress={() => setShare((x) => !x)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH }}>
            <T v="label" style={{ flex: 1 }}>
              {t('checkin.share', { who: TEAM.psico.short })}
            </T>
            <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: share ? colors.greenText : colors.line, padding: 2, alignItems: share ? 'flex-end' : 'flex-start' }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white }} />
            </View>
          </Pressable>
          <Button
            label={t('checkin.save')}
            onPress={() => {
              dispatch({ type: 'checkin', v, tags, note: note.trim() || undefined, share });
              if (share)
                dispatch({
                  type: 'askTeam',
                  text: t('checkin.shareMsg', { mood: t(`checkin.v${v}`).toLowerCase(), tags: tags.map((g) => t(`checkin.tag.${g}`).toLowerCase()).join(', ') || '—', note: note.trim() }).trim(),
                });
              onDone?.(v);
            }}
          />
        </>
      )}
      <T v="small" color={colors.secondary}>
        {t('checkin.privacy')}
      </T>
    </View>
  );
  return embedded ? body : <Card>{body}</Card>;
}

/** Check-in diario como ventana emergente al entrar en la app (una vez al día; "Ahora no" lo deja para luego). */
export function CheckinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(6,10,22,0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 440, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 26, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 10 }}>
            <CheckinCard embedded onDone={onClose} />
            <Button kind="ghost" label={t('checkin.later')} onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Recordatorio discreto en Hoy si se dejó el check-in para luego. */
export function CheckinPill({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('checkin.pill')}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, opacity: pressed ? 0.8 : 1 })}
    >
      <Row gap={-10}>
        {([1, 3, 5] as CheckIn['v'][]).map((v) => (
          <MoodFace key={v} v={v} size={34} />
        ))}
      </Row>
      <View style={{ flex: 1 }}>
        <T v="label">{t('checkin.pill')}</T>
        <T v="small" color={colors.secondary}>
          {t('checkin.pillSub')}
        </T>
      </View>
    </Pressable>
  );
}

/** Últimos 14 días de ánimo (Progreso). */
export function MoodHistory() {
  const { state } = useStore();
  const days = Array.from({ length: 14 }, (_, i) => dayKeyAgo(13 - i));
  const by = Object.fromEntries(state.checkins.map((c) => [c.date, c]));
  const done = state.checkins.filter((c) => days.includes(c.date));
  return (
    <Card>
      <T v="h2">{t('checkin.history')}</T>
      <Row style={{ justifyContent: 'space-between' }}>
        {days.map((d) => {
          const c = by[d];
          return (
            <View key={d} accessible accessibilityLabel={`${dayKeyToDate(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}: ${c ? t(`checkin.v${c.v}`) : t('checkin.none')}`} style={{ alignItems: 'center', gap: 4 }}>
              {c ? <MoodFace v={c.v} size={20} /> : <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.line }} />}
              <T v="small" style={{ fontSize: 10 }} color={colors.secondary}>
                {dayKeyToDate(d).getDate()}
              </T>
            </View>
          );
        })}
      </Row>
      <T v="small" color={colors.secondary}>
        {done.length ? t('checkin.historyNote', { n: done.length }) : t('checkin.historyEmpty')}
      </T>
    </Card>
  );
}
