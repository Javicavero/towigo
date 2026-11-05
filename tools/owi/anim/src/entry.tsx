import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import Hedgehog from './Hedgehog';
import type { PetMood } from './state/types';

let T = 0;
const fakeClock = { getElapsedTime: () => T, get elapsedTime() { return T; }, getDelta: () => 1 / 30, start() {}, stop() {}, running: true } as unknown as THREE.Clock;

function Driver() {
  const { set, advance, gl, camera } = useThree();
  useEffect(() => {
    set({ clock: fakeClock });
    camera.position.set(0, 1.08, 4.7);
    camera.lookAt(0, 0.98, 0);
    (window as any).frame = (t: number) => {
      T = t;
      advance(t * 1000, true);
      return gl.domElement.toDataURL('image/png');
    };
    (window as any).ready = true;
  }, []);
  return null;
}

function App() {
  const [mood, setMood] = useState<PetMood>((new URLSearchParams(location.search).get('mood') as PetMood) || 'happy');
  (window as any).setMood = setMood;
  return (
    <Canvas frameloop="never" dpr={1} style={{ width: 720, height: 720 }} camera={{ fov: 30 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <Driver />
      <hemisphereLight args={['#FFFFFF', '#FFD9C2', 1.5]} />
      <directionalLight position={[2.5, 5, 6]} intensity={2.1} />
      <directionalLight position={[-4, 3, -4]} intensity={1.1} color="#BFE9FF" />
      <Suspense fallback={null}>
        <Hedgehog mood={mood} level={1} size={1.2} position={[0, 0, 0]} facing={0} showEffects />
      </Suspense>
    </Canvas>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
