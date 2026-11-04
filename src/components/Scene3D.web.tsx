/** Escena 3D (web): tu avatar y Owi, juntos. Se puede girar arrastrando. */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Confetti, lerp } from './three/common';
import Hedgehog from './three/Hedgehog';
import Human from './three/Human';
import type { SceneProps } from './three/Scene.types';

const FRAMING = {
  pair: { pos: [0.4, 2.1, 7.2], look: [0.4, 1.6, 0], fov: 30 },
  pet: { pos: [0, 1.15, 3.9], look: [0, 0.78, 0], fov: 30 },
  avatar: { pos: [0, 2.5, 6.3], look: [0, 2.0, 0], fov: 30 },
} as const;

function Rig({ mode }: { mode: SceneProps['mode'] }) {
  const { camera } = useThree();
  const f = FRAMING[mode];
  useEffect(() => {
    camera.position.set(f.pos[0], f.pos[1], f.pos[2]);
    camera.lookAt(f.look[0], f.look[1], f.look[2]);
  }, [camera, f]);
  return null;
}

function Spin({ rotation, children }: { rotation: React.RefObject<number>; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = lerp(ref.current.rotation.y, rotation.current ?? 0, 0.2);
  });
  return <group ref={ref}>{children}</group>;
}

export default function Scene3D({ mode, avatar, avatarMood = 'happy', petMood = 'happy', petLevel = 1, height = 280, interactive = true, accessibilityLabel, onTap }: SceneProps) {
  const rotation = useRef(0);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const showHuman = mode !== 'pet' && avatar;
  const showPet = mode !== 'avatar';
  return (
    <div
      role="img"
      aria-label={accessibilityLabel}
      style={{ width: '100%', height, touchAction: 'pan-y', cursor: interactive ? 'grab' : 'default' }}
      onPointerDown={(e) => {
        if (!interactive) return;
        drag.current = { x: e.clientX, start: rotation.current, moved: false };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 6) drag.current.moved = true;
        rotation.current = drag.current.start + dx * 0.012;
      }}
      onPointerUp={() => {
        if (drag.current && !drag.current.moved) onTap?.();
        drag.current = null;
      }}
      onPointerLeave={() => (drag.current = null)}
    >
      <Canvas dpr={[1, 2]} camera={{ fov: FRAMING[mode].fov }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }} style={{ background: 'transparent' }}>
        <Rig mode={mode} />
        <hemisphereLight args={['#FFFFFF', '#FFD9C2', 1.5]} />
        <directionalLight position={[2.5, 5, 6]} intensity={2.1} />
        <directionalLight position={[-4, 3, -4]} intensity={1.1} color="#BFE9FF" />
        <Spin rotation={rotation}>
          <Suspense fallback={null}>
            {showHuman && <Human avatar={avatar} mood={avatarMood} position={mode === 'pair' ? [-0.75, 0, 0] : [0, 0, 0]} facing={mode === 'pair' ? 0.18 : 0} />}
          </Suspense>
          {showPet && <Hedgehog mood={petMood} level={petLevel} size={mode === 'pair' ? 1.4 : 1} position={mode === 'pair' ? [1.35, 0, 0.35] : [0, 0, 0]} facing={mode === 'pair' ? -0.35 : 0} showEffects />}
          {/* Sombras suaves en el suelo */}
          {showHuman && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mode === 'pair' ? -0.75 : 0, 0.005, 0]}>
              <circleGeometry args={[0.7, 32]} />
              <meshBasicMaterial color="#1E2A32" transparent opacity={0.08} />
            </mesh>
          )}
          {showPet && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mode === 'pair' ? 1.35 : 0, 0.005, mode === 'pair' ? 0.35 : 0]}>
              <circleGeometry args={[0.55, 32]} />
              <meshBasicMaterial color="#1E2A32" transparent opacity={0.08} />
            </mesh>
          )}
        </Spin>
        {avatarMood === 'celebrate' && mode !== 'pet' && <Confetti width={4.5} top={4.4} />}
      </Canvas>
    </div>
  );
}
