/**
 * "Tu gente" (inspirado en el GluCrew de Gluroo): personas de confianza que te acompañan.
 * Tú decides qué ven y qué pueden hacer; puedes quitar permisos cuando quieras (RGPD).
 * Fase 1: no hay alertas clínicas automáticas; el aviso "Necesito ayuda" lo envías tú.
 */
import { useState } from 'react';
import { Pressable, Share, TextInput, View } from 'react-native';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { isT1, usesGlp1, type CrewPerms, type CrewRelation } from '../state/types';
import { colors, fonts, MIN_TOUCH } from '../theme';
import { Glyph } from './icons';
import { Button, Card, Choice, Row, T } from './ui';

const RELATIONS: CrewRelation[] = ['pareja', 'hijo', 'madre', 'padre', 'amistad', 'cuidador'];
const PERMS: (keyof CrewPerms)[] = ['summary', 'logForMe', 'sos'];

function Switch({ on, onPress, label, hint }: { on: boolean; onPress: () => void; label: string; hint: string }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH }}>
      <View style={{ flex: 1 }}>
        <T v="label">{label}</T>
        <T v="small" color={colors.secondary}>
          {hint}
        </T>
      </View>
      <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: on ? colors.greenText : colors.line, padding: 2, alignItems: on ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white }} />
      </View>
    </Pressable>
  );
}

/** Lo que vería tu gente (solo si das el permiso de resumen). Sin datos clínicos detallados. */
export function useCrewSummary() {
  const { state, d } = useStore();
  const parts = [t('crew.sum.streak', { name: state.userName || t('common.friend'), n: d.streak })];
  if (usesGlp1(state.profile) && !d.maintenance) parts.push(d.injectedToday || d.daysToInjection !== 0 ? t('crew.sum.injOk') : t('crew.sum.injToday'));
  if (isT1(state.profile)) parts.push(t('crew.sum.tir', { n: d.tir24 }));
  parts.push(t('crew.sum.strength', { a: d.strengthThisWeek, b: state.goals.strengthPerWeek }));
  return parts.join(' ');
}

export function CrewSettings() {
  const { state, dispatch } = useStore();
  const [name, setName] = useState('');
  const [rel, setRel] = useState<CrewRelation>('pareja');
  const [notice, setNotice] = useState<string | null>(null);
  const summary = useCrewSummary();

  return (
    <View style={{ gap: 12 }}>
      <T v="small" color={colors.secondary}>
        {t('crew.intro')}
      </T>
      {state.crew.map((c) => (
        <View key={c.id} style={{ backgroundColor: colors.cream, borderRadius: 12, padding: 12, gap: 6 }}>
          <Row gap={10}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#5B4BC4', alignItems: 'center', justifyContent: 'center' }}>
              <T v="label" color={"#FFFFFF"}>
                {c.name.slice(0, 1).toUpperCase()}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T v="label">{c.name}</T>
              <T v="small" color={colors.secondary}>
                {t(`crew.rel.${c.relation}`)} · {c.status === 'active' ? t('crew.active') : t('crew.invited', { code: c.code })}
              </T>
            </View>
          </Row>
          {PERMS.map((p) => (
            <Switch key={p} on={c.perms[p]} label={t(`crew.perm.${p}`)} hint={t(`crew.perm.${p}Hint`)} onPress={() => dispatch({ type: 'crewPerms', id: c.id, perms: { [p]: !c.perms[p] } })} />
          ))}
          <Row gap={8}>
            {c.status === 'invited' && (
              <Button
                style={{ flex: 1 }}
                kind="secondary"
                label={t('crew.share')}
                onPress={() => Share.share({ message: t('crew.inviteMsg', { name: c.name, owi: state.pet.name, code: c.code }) }).catch(() => {})}
              />
            )}
            <Button style={{ flex: 1 }} kind="ghost" label={t('crew.remove')} onPress={() => dispatch({ type: 'crewRemove', id: c.id })} />
          </Row>
        </View>
      ))}

      <T v="label">{t('crew.add')}</T>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('crew.namePh')}
        placeholderTextColor={colors.secondary}
        accessibilityLabel={t('crew.namePh')}
        style={{ minHeight: MIN_TOUCH, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.white, paddingHorizontal: 14, fontSize: 16, fontFamily: fonts.medium, color: colors.ink }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {RELATIONS.map((r) => (
          <Choice key={r} label={t(`crew.rel.${r}`)} selected={rel === r} onPress={() => setRel(r)} />
        ))}
      </View>
      <Button
        label={t('crew.invite')}
        disabled={!name.trim()}
        onPress={() => {
          dispatch({ type: 'crewInvite', name: name.trim().slice(0, 24), relation: rel });
          setName('');
          setNotice(t('crew.invitedNotice'));
        }}
      />

      <View style={{ backgroundColor: colors.softBlue, borderRadius: 12, padding: 12, gap: 4 }}>
        <T v="label">{t('crew.preview')}</T>
        <T v="small">{summary}</T>
      </View>

      {state.crew.some((c) => c.perms.sos) && (
        <Button
          kind="coral"
          label={t('crew.sos')}
          onPress={() => setNotice(t('crew.sosSent', { names: state.crew.filter((c) => c.perms.sos).map((c) => c.name).join(', ') }))}
        />
      )}
      {notice && (
        <View accessibilityLiveRegion="polite">
          <T v="small" color={colors.greenText}>
            {notice}
          </T>
        </View>
      )}
      <T v="small" color={colors.secondary}>
        {t('crew.privacy')}
      </T>
    </View>
  );
}

/** Ánimos de tu gente, entregados por Owi en "Hoy". */
export function CheerCard() {
  const { state, dispatch } = useStore();
  const c = state.cheers.find((x) => !x.read);
  if (!c) return null;
  const who = state.crew.find((m) => m.id === c.from)?.name ?? t('crew.someone');
  return (
    <Card tone="green">
      <Row gap={10}>
        <Glyph name="heart" bg="#5B4BC4" />
        <T v="h2" style={{ flex: 1 }}>
          {t('crew.cheerTitle', { who, owi: state.pet.name })}
        </T>
      </Row>
      <T>“{c.text}”</T>
      <Row gap={8}>
        <Button style={{ flex: 1 }} label={t('crew.thanks')} onPress={() => dispatch({ type: 'cheerRead', id: c.id })} />
        <Button style={{ flex: 1 }} kind="secondary" label={t('crew.later')} onPress={() => dispatch({ type: 'cheerRead', id: c.id })} />
      </Row>
    </Card>
  );
}
