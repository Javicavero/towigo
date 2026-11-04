import { View } from 'react-native';
import { HAIR_COLORS, HAIR_STYLES, HOODIE_COLORS, SHOE_COLORS, SKIN_TONES } from '../data/avatarOptions';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { Choice, Swatch, T } from './ui';

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
  const a = state.avatar;
  const set = (patch: Partial<typeof a>) => dispatch({ type: 'setAvatar', patch });
  return (
    <View style={{ gap: 16 }}>
      <Section title={t('avatar.skin')}>
        {SKIN_TONES.map((c, i) => (
          <Swatch key={c} color={c} selected={a.skin === i} onPress={() => set({ skin: i })} label={t('avatar.skinN', { n: i + 1 })} />
        ))}
      </Section>
      <Section title={t('avatar.hair')}>
        {HAIR_STYLES.map((h) => (
          <Choice key={h} label={t(`avatar.hair.${h}`)} selected={a.hair === h} onPress={() => set({ hair: h })} />
        ))}
      </Section>
      <Section title={t('avatar.hairColor')}>
        {HAIR_COLORS.map((c, i) => (
          <Swatch key={c} color={c} selected={a.hairColor === i} onPress={() => set({ hairColor: i })} label={t('avatar.colorN', { n: i + 1 })} />
        ))}
      </Section>
      <Section title={t('avatar.hoodie')}>
        {HOODIE_COLORS.map((c, i) => (
          <Swatch key={c} color={c} selected={a.hoodie === i} onPress={() => set({ hoodie: i })} label={t('avatar.colorN', { n: i + 1 })} />
        ))}
      </Section>
      <Section title={t('avatar.shoes')}>
        {SHOE_COLORS.map((c, i) => (
          <Swatch key={c} color={c} selected={a.shoes === i} onPress={() => set({ shoes: i })} label={t('avatar.colorN', { n: i + 1 })} />
        ))}
      </Section>
    </View>
  );
}
