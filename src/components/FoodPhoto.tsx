/**
 * Foto (o descripción) de tu comida → Owi estima raciones, carbohidratos y proteína.
 * Siempre es una estimación aproximada y editable; tu nutricionista puede revisarla. Nunca se usa para calcular insulina.
 */
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, TextInput, View } from 'react-native';
import { t } from '../i18n';
import { demoFoodEstimate } from '../owi/foodDemo';
import { backendConfigured, foodEstimate, type FoodEstimate } from '../services/backend';
import { useStore } from '../state/store';
import { isT1 } from '../state/types';
import { colors, fonts, radius } from '../theme';
import { Glyph } from './icons';
import { Button, Choice, Row, T } from './ui';

export default function FoodPhoto({ onSaved }: { onSaved?: (msg: string) => void }) {
  const { state, dispatch } = useStore();
  const t1 = isT1(state.profile);
  const [photo, setPhoto] = useState<{ uri: string; base64?: string | null; mime?: string } | null>(null);
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [est, setEst] = useState<FoodEstimate | null>(null);
  const [carbs, setCarbs] = useState(0);
  const [protein, setProtein] = useState(0);

  const pick = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, base64: true, allowsEditing: false };
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    setPhoto({ uri: a.uri, base64: a.base64, mime: a.mimeType ?? 'image/jpeg' });
    setEst(null);
  };

  const estimate = async () => {
    setBusy(true);
    let e: FoodEstimate;
    try {
      e = backendConfigured ? await foodEstimate({ imageBase64: photo?.base64 ?? undefined, mediaType: photo?.mime, description: desc || undefined }) : demoFoodEstimate(desc, !!photo);
    } catch {
      e = demoFoodEstimate(desc, !!photo);
    }
    setEst(e);
    setCarbs(e.carbs_g);
    setProtein(e.protein_g);
    setBusy(false);
  };

  const save = () => {
    if (t1) dispatch({ type: 'addCarbs', g: carbs, protein, label: est?.items.map((i) => i.name.toLowerCase()).join(', '), photo: !!photo });
    else dispatch({ type: 'addIntake', protein });
    onSaved?.(t1 ? t('food.savedT1', { c: carbs, p: protein }) : t('food.saved', { p: protein }));
    setPhoto(null);
    setDesc('');
    setEst(null);
  };

  return (
    <View style={{ gap: 10, backgroundColor: colors.cream, borderRadius: radius.m, padding: 12 }}>
      <Row gap={10}>
        <Glyph name="camera" bg="#D9542F" size={34} />
        <View style={{ flex: 1 }}>
          <T v="label">{t('food.photoTitle')}</T>
          <T v="small" color={colors.secondary}>
            {t('food.photoSub')}
          </T>
        </View>
      </Row>
      <Row gap={8}>
        <Button style={{ flex: 1 }} kind="secondary" label={t('food.camera')} onPress={() => pick(true)} />
        <Button style={{ flex: 1 }} kind="secondary" label={t('food.gallery')} onPress={() => pick(false)} />
      </Row>
      {photo && <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 180, borderRadius: 12 }} resizeMode="cover" accessibilityLabel={t('food.photoA11y')} />}
      <TextInput
        value={desc}
        onChangeText={setDesc}
        placeholder={t('food.descPh')}
        placeholderTextColor={colors.secondary}
        accessibilityLabel={t('food.descPh')}
        style={{ minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.white, paddingHorizontal: 12, fontSize: 16, fontFamily: fonts.regular, color: colors.ink }}
      />
      {busy ? (
        <ActivityIndicator color={colors.greenText} />
      ) : (
        <Button label={t('food.estimate')} disabled={!photo && !desc.trim()} onPress={estimate} />
      )}
      {est && (
        <View style={{ gap: 8, backgroundColor: colors.white, borderRadius: 12, padding: 12 }} accessibilityLiveRegion="polite">
          <T v="label">{t('food.result', { conf: est.confidence })}</T>
          {est.items.map((i, k) => (
            <T key={k} v="small">
              • {i.name} · {i.portion}
            </T>
          ))}
          {t1 && (
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="label">{t('food.carbs', { n: carbs })}</T>
              <Row gap={6}>
                <Choice label="−5" onPress={() => setCarbs((c) => Math.max(0, c - 5))} />
                <Choice label="+5" onPress={() => setCarbs((c) => c + 5)} />
              </Row>
            </Row>
          )}
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="label">{t('food.protein', { n: protein })}</T>
            <Row gap={6}>
              <Choice label="−5" onPress={() => setProtein((c) => Math.max(0, c - 5))} />
              <Choice label="+5" onPress={() => setProtein((c) => c + 5)} />
            </Row>
          </Row>
          <T v="small" color={colors.secondary}>
            {est.note} {t1 ? t('food.noteT1') : ''}
          </T>
          <Button label={t('food.save')} onPress={save} />
        </View>
      )}
    </View>
  );
}
