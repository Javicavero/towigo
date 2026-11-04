/**
 * Registro rápido (§4.1): cada registro en menos de 10 segundos, 1-2 toques.
 * Solo se registra lo que el paciente ha hecho; Towigo no calcula ni sugiere dosis (Fase 1).
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '../components/icons';
import { Button, Card, Choice, Row, Screen, T } from '../components/ui';
import { t } from '../i18n';
import { useStore } from '../state/store';
import type { InsulinKind, LogEntry, NewLogEntry } from '../state/types';
import { colors, MIN_TOUCH, radius } from '../theme';

type Kind = 'insulin' | 'meal' | 'feeling';
const TILES: { kind: Kind; icon: IconName }[] = [
  { kind: 'insulin', icon: 'syringe' },
  { kind: 'meal', icon: 'meal' },
  { kind: 'feeling', icon: 'smile' },
];
const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
const SYMPTOMS = ['tired', 'dizzy', 'thirsty', 'headache', 'stress', 'none'] as const;
const FACES = ['😣', '😕', '😐', '🙂', '😄'];

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const btn = (label: string, delta: number, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={() => onChange(Math.max(0, Math.min(100, value + delta)))}
      style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' }}
    >
      <T v="title" color={colors.greenText}>
        {label}
      </T>
    </Pressable>
  );
  return (
    <Row style={{ justifyContent: 'center' }} gap={20}>
      {btn('−', -1, t('log.less'))}
      <View accessible accessibilityLabel={t('log.unitsA11y', { n: value })} style={{ minWidth: 90, alignItems: 'center' }}>
        <T v="big">{value}</T>
        <T v="small" color={colors.secondary}>
          {t('log.units')}
        </T>
      </View>
      {btn('+', 1, t('log.more'))}
    </Row>
  );
}

function describe(e: LogEntry) {
  if (e.type === 'insulin') return t('log.item.insulin', { n: e.units, kind: t(`log.${e.kind}`) });
  if (e.type === 'meal') return t('log.item.meal', { meal: t(`meal.${e.label}`), photo: e.hasPhoto ? ' 📷' : '' });
  return t('log.item.feeling', { face: FACES[e.level - 1], s: e.symptoms.map((s) => t(`symptom.${s}`)).join(', ') });
}

export default function LogScreen() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState<Kind | null>(null);
  const [insulinKind, setInsulinKind] = useState<InsulinKind>('rapida');
  const [units, setUnits] = useState(4);
  const [meal, setMeal] = useState<(typeof MEALS)[number]>('lunch');
  const [photo, setPhoto] = useState(false);
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const start = (k: Kind) => {
    setOpen(open === k ? null : k);
    startedAt.current = Date.now();
    setPhoto(false);
    setSymptoms([]);
  };

  const save = (entry: NewLogEntry) => {
    const secs = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    dispatch({ type: 'addLog', entry });
    setOpen(null);
    setToast(secs <= 10 ? t('log.savedFast', { owi: state.pet.name, s: secs }) : t('log.saved', { owi: state.pet.name }));
  };

  const today = state.logs.filter((l) => new Date(l.at).toDateString() === new Date().toDateString());

  return (
    <Screen>
      <T v="title" accessibilityRole="header">
        {t('log.title')}
      </T>
      <T color={colors.secondary}>{t('log.subtitle')}</T>

      {toast && (
        <Card tone="green" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="check" color={colors.greenText} stroke={3} />
          <View accessibilityLiveRegion="polite" style={{ flex: 1 }}>
            <T v="label">{toast}</T>
          </View>
        </Card>
      )}

      {TILES.map(({ kind, icon }) => (
        <Card key={kind} style={{ padding: 0, overflow: 'hidden' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open === kind }}
            accessibilityLabel={t(`log.${kind}`)}
            onPress={() => start(kind)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, minHeight: 76 }}
          >
            <View style={{ width: 52, height: 52, borderRadius: radius.m, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={28} color={colors.greenText} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="h2">{t(`log.${kind}`)}</T>
              <T v="small" color={colors.secondary}>
                {t(`log.${kind}Hint`)}
              </T>
            </View>
            <T v="title" color={colors.greenText}>
              {open === kind ? '−' : '+'}
            </T>
          </Pressable>

          {open === kind && (
            <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 14 }}>
              {kind === 'insulin' && (
                <>
                  <Row gap={10}>
                    {(['rapida', 'basal'] as InsulinKind[]).map((k) => (
                      <Choice
                        key={k}
                        style={{ flex: 1 }}
                        label={t(`log.${k}`)}
                        selected={insulinKind === k}
                        onPress={() => {
                          setInsulinKind(k);
                          setUnits(k === 'basal' ? 18 : 4);
                        }}
                      />
                    ))}
                  </Row>
                  <Stepper value={units} onChange={setUnits} />
                  <T v="small" color={colors.secondary} center>
                    {t('log.noDoseCalc')}
                  </T>
                  <Button label={t('log.save')} onPress={() => save({ type: 'insulin', kind: insulinKind, units })} />
                </>
              )}

              {kind === 'meal' && (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={photo ? t('log.photoAdded') : t('log.takePhoto')}
                    onPress={() => setPhoto(true)}
                    style={{
                      height: 130,
                      borderRadius: radius.m,
                      borderWidth: 2,
                      borderStyle: photo ? 'solid' : 'dashed',
                      borderColor: photo ? colors.greenText : colors.line,
                      backgroundColor: photo ? colors.softGreen : colors.cream,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {photo ? <T v="display">🥗</T> : <Icon name="camera" size={36} color={colors.greenText} />}
                    <T v="label" color={colors.greenText}>
                      {photo ? t('log.photoAdded') : t('log.takePhoto')}
                    </T>
                  </Pressable>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {MEALS.map((m) => (
                      <Choice key={m} label={t(`meal.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />
                    ))}
                  </View>
                  <Button label={t('log.save')} onPress={() => save({ type: 'meal', label: meal, hasPhoto: photo })} />
                </>
              )}

              {kind === 'feeling' && (
                <>
                  <Row style={{ justifyContent: 'space-between' }} gap={4}>
                    {FACES.map((f, i) => (
                      <Pressable
                        key={f}
                        accessibilityRole="button"
                        accessibilityLabel={t(`feeling.${i + 1}`)}
                        accessibilityState={{ selected: level === i + 1 }}
                        onPress={() => setLevel((i + 1) as 1 | 2 | 3 | 4 | 5)}
                        style={{
                          width: MIN_TOUCH + 4,
                          height: MIN_TOUCH + 4,
                          borderRadius: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: level === i + 1 ? colors.softYellow : 'transparent',
                          borderWidth: 2,
                          borderColor: level === i + 1 ? colors.achievement : 'transparent',
                        }}
                      >
                        <T v="title">{f}</T>
                      </Pressable>
                    ))}
                  </Row>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {SYMPTOMS.map((s) => (
                      <Choice
                        key={s}
                        label={t(`symptom.${s}`)}
                        selected={symptoms.includes(s)}
                        onPress={() =>
                          setSymptoms((cur) =>
                            s === 'none' ? ['none'] : cur.includes(s) ? cur.filter((x) => x !== s) : [...cur.filter((x) => x !== 'none'), s],
                          )
                        }
                      />
                    ))}
                  </View>
                  <Button label={t('log.save')} onPress={() => save({ type: 'feeling', level, symptoms })} />
                </>
              )}
            </View>
          )}
        </Card>
      ))}

      <T v="h2" style={{ marginTop: 8 }}>
        {t('log.today')}
      </T>
      {today.length === 0 ? (
        <T color={colors.secondary}>{t('log.empty')}</T>
      ) : (
        today.map((e) => (
          <Card key={e.id} style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="label" style={{ flex: 1 }}>
                {describe(e)}
              </T>
              <T v="small" color={colors.secondary}>
                {new Date(e.at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </T>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
