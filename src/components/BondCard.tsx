/** Vínculo con Owi: nivel de evolución y progreso al siguiente (tipo experiencia de juego). */
import { View } from 'react-native';
import { t } from '../i18n';
import { PET_LEVEL_AT, useStore } from '../state/store';
import type { PetLevel } from '../state/types';
import { colors } from '../theme';
import { useCountUp } from './motion';
import { Card, ProgressBar, Row, T } from './ui';

const BADGE: Record<PetLevel, string> = { 1: '🌱', 2: '🧭', 3: '🤝', 4: '🌟' };

export default function BondCard({ compact }: { compact?: boolean }) {
  const { state, d } = useStore();
  const pts = useCountUp(d.bond);
  const next = d.petLevel < 4 ? PET_LEVEL_AT[(d.petLevel + 1) as PetLevel] : null;
  return (
    <Card tone="purple">
      <Row gap={12}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#5B3CC4' }}>
          <T v="title">{BADGE[d.petLevel]}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T v="small" color={colors.purple} style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {t('bond.title', { owi: state.pet.name })}
          </T>
          <T v="h2">{t('bond.level', { n: d.petLevel, name: t(`bond.lv${d.petLevel}`) })}</T>
        </View>
        <T v="h2" color={colors.purple}>
          {pts}
        </T>
      </Row>
      <ProgressBar value={d.petProgress * 100} color={colors.purple} />
      {!compact && (
        <T v="small" color={colors.secondary}>
          {next ? t('bond.next', { n: next - d.bond, owi: state.pet.name }) : t('bond.max', { owi: state.pet.name })}
        </T>
      )}
    </Card>
  );
}
