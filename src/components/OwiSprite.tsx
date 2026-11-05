/**
 * Owi animado tipo GIF: reproduce las hojas de sprites renderizadas desde el modelo 3D
 * (tools/owi/anim → assets/owi/anim). 12 emociones, bucles perfectos a 20 fps.
 * Respeta "Reducir movimiento" del sistema (muestra un fotograma fijo).
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, View } from 'react-native';
import type { PetMood } from '../state/types';
import { OWI_STICKERS } from './OwiSticker';

const META = require('../../assets/owi/anim/meta.json') as Record<PetMood, { frames: number; cols: number; fps: number }>;
export const OWI_SHEETS: Record<PetMood, number> = {
  happy: require('../../assets/owi/anim/happy.webp'),
  attentive: require('../../assets/owi/anim/attentive.webp'),
  caringHigh: require('../../assets/owi/anim/caringHigh.webp'),
  worriedHigh: require('../../assets/owi/anim/worriedHigh.webp'),
  caringLow: require('../../assets/owi/anim/caringLow.webp'),
  worriedLow: require('../../assets/owi/anim/worriedLow.webp'),
  celebrate: require('../../assets/owi/anim/celebrate.webp'),
  sleep: require('../../assets/owi/anim/sleep.webp'),
  confused: require('../../assets/owi/anim/confused.webp'),
  remind: require('../../assets/owi/anim/remind.webp'),
  sport: require('../../assets/owi/anim/sport.webp'),
  missYou: require('../../assets/owi/anim/missYou.webp'),
};

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => (reduceMotion = v))
  .catch(() => {});

export default function OwiSprite({ mood, size = 200, paused, label }: { mood: PetMood; size?: number; paused?: boolean; label?: string }) {
  const m = META[mood];
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFrame(0);
    setLoaded(false);
  }, [mood]);

  useEffect(() => {
    if (paused || reduceMotion || !loaded) return;
    const start = Date.now();
    raf.current = setInterval(() => setFrame(Math.floor(((Date.now() - start) / 1000) * m.fps) % m.frames), 1000 / m.fps);
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, [mood, paused, loaded, m.fps, m.frames]);

  const rows = Math.ceil(m.frames / m.cols);
  const col = frame % m.cols;
  const row = Math.floor(frame / m.cols);
  return (
    <View accessible={!!label} accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size, overflow: 'hidden' }}>
      {!loaded && <Image source={OWI_STICKERS[mood]} style={{ position: 'absolute', width: size, height: size }} resizeMode="contain" />}
      <Image
        key={mood}
        source={OWI_SHEETS[mood]}
        onLoad={() => setLoaded(true)}
        fadeDuration={0}
        style={{ position: 'absolute', width: size * m.cols, height: size * rows, left: -col * size, top: -row * size, opacity: loaded ? 1 : 0 }}
      />
    </View>
  );
}
