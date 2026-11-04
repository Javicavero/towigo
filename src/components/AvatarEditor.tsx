/** Editor del avatar humano, por pestañas: Cuerpo · Cara · Pelo · Ropa. */
import { useState } from 'react';
import { View } from 'react-native';
import {
  BODY_TYPES,
  BOTTOM_COLORS,
  BOTTOMS,
  BROWS,
  EYE_COLORS,
  FACE_SHAPES,
  FACIAL_HAIR,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  HEIGHTS,
  SHOE_COLORS,
  SKIN_TONES,
  TOP_COLORS,
  TOPS,
} from '../data/avatarOptions';
import { t } from '../i18n';
import { useStore } from '../state/store';
import type { Avatar } from '../state/types';
import { Choice, Swatch, T } from './ui';

const TABS = ['body', 'face', 'hair', 'clothes'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T v="label">{title}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );
}

export default function AvatarEditor() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>('body');
  const a = state.avatar;
  const set = (patch: Partial<Avatar>) => dispatch({ type: 'setAvatar', patch });
  const options = <K extends keyof Avatar>(key: K, values: readonly Avatar[K][], prefix: string) =>
    values.map((v) => <Choice key={String(v)} label={t(`${prefix}.${String(v)}`)} selected={a[key] === v} onPress={() => set({ [key]: v } as Partial<Avatar>)} />);
  const colors = (key: 'skin' | 'eyeColor' | 'hairColor' | 'topColor' | 'bottomColor' | 'shoes', list: string[], label: string) =>
    list.map((c, i) => <Swatch key={c} color={c} selected={a[key] === i} onPress={() => set({ [key]: i } as Partial<Avatar>)} label={t(label, { n: i + 1 })} />);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="tablist">
        {TABS.map((k) => (
          <Choice key={k} style={{ flex: 1, paddingHorizontal: 4 }} label={t(`avatar.tab.${k}`)} selected={tab === k} onPress={() => setTab(k)} />
        ))}
      </View>
      {tab === 'body' && (
        <>
          <Section title={t('avatar.skin')}>{colors('skin', SKIN_TONES, 'avatar.skinN')}</Section>
          <Section title={t('avatar.bodyType')}>{options('bodyType', BODY_TYPES, 'avatar.body')}</Section>
          <Section title={t('avatar.height')}>{options('height', HEIGHTS, 'avatar.h')}</Section>
        </>
      )}
      {tab === 'face' && (
        <>
          <Section title={t('avatar.faceShape')}>{options('faceShape', FACE_SHAPES, 'avatar.face')}</Section>
          <Section title={t('avatar.eyeColor')}>{colors('eyeColor', EYE_COLORS, 'avatar.colorN')}</Section>
          <Section title={t('avatar.brows')}>{options('brows', BROWS, 'avatar.brow')}</Section>
          <Section title={t('avatar.glasses')}>{options('glasses', GLASSES, 'avatar.gl')}</Section>
        </>
      )}
      {tab === 'hair' && (
        <>
          <Section title={t('avatar.hair')}>{options('hair', HAIR_STYLES, 'avatar.hair')}</Section>
          <Section title={t('avatar.hairColor')}>{colors('hairColor', HAIR_COLORS, 'avatar.colorN')}</Section>
          <Section title={t('avatar.facialHair')}>{options('facialHair', FACIAL_HAIR, 'avatar.fh')}</Section>
        </>
      )}
      {tab === 'clothes' && (
        <>
          <Section title={t('avatar.top')}>{options('top', TOPS, 'avatar.top')}</Section>
          <Section title={t('avatar.topColor')}>{colors('topColor', TOP_COLORS, 'avatar.colorN')}</Section>
          <Section title={t('avatar.bottom')}>{options('bottom', BOTTOMS, 'avatar.bottom')}</Section>
          <Section title={t('avatar.bottomColor')}>{colors('bottomColor', BOTTOM_COLORS, 'avatar.colorN')}</Section>
          <Section title={t('avatar.shoes')}>{colors('shoes', SHOE_COLORS, 'avatar.colorN')}</Section>
        </>
      )}
    </View>
  );
}
