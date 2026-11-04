/**
 * Owi, la mascota: un erizo compañero (común a todos los perfiles: tipo 1, tipo 2 y GLP-1).
 * - Emociones según el momento (glucosa, avisos, noche, celebraciones, reencuentro).
 * - Evoluciona con el vínculo (hábitos e interacciones): crece, le salen más púas y gana accesorios.
 * Nunca regaña: hasta en los peores momentos, su gesto es de cariño.
 * Hecho con primitivas a propósito: un personaje estilizado y blandito, fácil de animar.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { PetLevel, PetMood } from '../../state/types';
import { Confetti, Floating, Heart, lerp, tube } from './common';

const SPIKE = '#7A4E2D';
const SPIKE_TIP = '#C99A6B';
const FUR = '#F3D9B8';
const SNOUT = '#F7E6CF';
const INNER_EAR = '#F2A7A0';

type Face = { lid: number; lowerLid?: number; brow: number; browY?: number; mouth: 'smile' | 'open' | 'soft' | 'o' | 'wavy' | 'sleep'; tilt?: number; pupil?: number };

const FACES: Record<PetMood, Face> = {
  happy: { lid: 0.18, brow: 0.1, mouth: 'smile' },
  attentive: { lid: 0.1, brow: -0.1, browY: 0.02, mouth: 'o', tilt: 0.18, pupil: 1.1 },
  caringHigh: { lid: 0.3, brow: -0.3, browY: 0.015, mouth: 'soft', tilt: -0.1 },
  worriedHigh: { lid: 0.12, brow: -0.45, browY: 0.03, mouth: 'wavy', pupil: 1.15 },
  caringLow: { lid: 0.28, brow: -0.3, browY: 0.015, mouth: 'soft', tilt: 0.12 },
  worriedLow: { lid: 0.1, brow: -0.5, browY: 0.035, mouth: 'o', pupil: 1.2 },
  celebrate: { lid: 0.45, lowerLid: 0.35, brow: 0.2, browY: 0.03, mouth: 'open' },
  sleep: { lid: 1, brow: 0.05, mouth: 'sleep', tilt: 0.25 },
  confused: { lid: 0.2, brow: -0.15, browY: 0.02, mouth: 'wavy', tilt: -0.28 },
  remind: { lid: 0.1, brow: 0.2, browY: 0.03, mouth: 'open' },
  sport: { lid: 0.35, lowerLid: 0.2, brow: 0.05, mouth: 'open' },
  missYou: { lid: 0.3, lowerLid: 0.25, brow: -0.2, browY: 0.02, mouth: 'open', tilt: 0.12 },
};

/** Tamaño, púas y accesorios por nivel de evolución. */
export const LEVELS: Record<PetLevel, { scale: number; spikes: number; spikeLen: number }> = {
  1: { scale: 0.78, spikes: 46, spikeLen: 0.2 },
  2: { scale: 0.88, spikes: 64, spikeLen: 0.25 },
  3: { scale: 0.96, spikes: 82, spikeLen: 0.29 },
  4: { scale: 1.0, spikes: 96, spikeLen: 0.31 },
};

function Spikes({ count, len }: { count: number; len: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.075, len, 7);
    g.translate(0, len / 2, 0);
    return g;
  }, [len]);
  const placements = useMemo(() => {
    // Puntos repartidos por la esfera (espiral de Fibonacci); nos quedamos con la espalda y la coronilla.
    const out: { pos: THREE.Vector3; q: THREE.Quaternion }[] = [];
    const total = count * 3;
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < total && out.length < count; i++) {
      const y = 1 - (i / (total - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      const n = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
      if (n.z > 0.18 - Math.max(0, n.y) * 0.25 || n.y < -0.45) continue;
      const pos = new THREE.Vector3(n.x * 0.58, 0.72 + n.y * 0.6, -0.04 + n.z * 0.55);
      const dir = n.clone().add(new THREE.Vector3(0, 0.25, -0.55)).normalize();
      out.push({ pos, q: new THREE.Quaternion().setFromUnitVectors(up, dir) });
    }
    return out;
  }, [count]);
  useEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    placements.forEach((p, i) => {
      m.compose(p.pos, p.q, new THREE.Vector3(1, 0.9 + ((i * 37) % 10) / 40, 1));
      ref.current!.setMatrixAt(i, m);
      ref.current!.setColorAt(i, c.set(i % 3 === 0 ? SPIKE_TIP : SPIKE));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [placements]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, placements.length]}>
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
}

function Eye({ x, face, blink }: { x: number; face: Face; blink: React.RefObject<number> }) {
  const upper = useRef<THREE.Mesh>(null);
  const lower = useRef<THREE.Mesh>(null);
  const pupil = face.pupil ?? 1;
  useFrame(() => {
    const lid = Math.max(face.lid, blink.current ?? 0);
    if (upper.current) upper.current.rotation.x = -Math.PI / 2 + lid * Math.PI * 0.98;
    if (lower.current) lower.current.rotation.x = -Math.PI / 2 - (face.lowerLid ?? 0) * 2.36;
  });
  return (
    <group position={[x, 0.87, 0.53]} rotation={[0, x > 0 ? 0.3 : -0.3, 0]}>
      <mesh scale={[1, 1.1, 0.75]}>
        <sphereGeometry args={[0.125, 28, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </mesh>
      <mesh position={[0, -0.005, 0.072]} scale={[pupil, pupil, 0.5]}>
        <sphereGeometry args={[0.092, 24, 16]} />
        <meshStandardMaterial color="#2A1A12" roughness={0.1} />
      </mesh>
      <mesh position={[0.032, 0.038, 0.12]}>
        <sphereGeometry args={[0.024, 12, 10]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.028, -0.032, 0.12]}>
        <sphereGeometry args={[0.011, 10, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh ref={upper} scale={[1, 1.1, 0.78]}>
        <sphereGeometry args={[0.132, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={FUR} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={lower} scale={[1, 1.1, 0.78]}>
        <sphereGeometry args={[0.13, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={FUR} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Mouth({ kind }: { kind: Face['mouth'] }) {
  const geo = useMemo(() => {
    if (kind === 'smile') return tube([[-0.07, 0.02, -0.02], [-0.035, -0.015, 0], [0, -0.02, 0.006], [0.035, -0.015, 0], [0.07, 0.02, -0.02]], 0.012);
    if (kind === 'soft') return tube([[-0.045, 0.006, -0.01], [0, -0.012, 0.002], [0.045, 0.006, -0.01]], 0.011);
    if (kind === 'wavy') return tube([[-0.05, -0.01, -0.01], [-0.017, 0.006, 0], [0.017, -0.008, 0], [0.05, 0.006, -0.01]], 0.011);
    return null;
  }, [kind]);
  if (kind === 'open')
    return (
      <group>
        <mesh scale={[1.25, 0.9, 0.5]} position={[0, -0.01, -0.01]}>
          <sphereGeometry args={[0.055, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#7A2A2A" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.04, 0.004]} scale={[1, 0.5, 0.4]}>
          <sphereGeometry args={[0.035, 14, 8]} />
          <meshStandardMaterial color="#F07A7A" />
        </mesh>
      </group>
    );
  if (kind === 'o' || kind === 'sleep') {
    const r = kind === 'o' ? 0.03 : 0.016;
    return (
      <group>
        <mesh>
          <torusGeometry args={[r, 0.01, 8, 24]} />
          <meshStandardMaterial color="#4A2A20" />
        </mesh>
        <mesh position={[0, 0, -0.005]}>
          <circleGeometry args={[r, 24]} />
          <meshStandardMaterial color="#7A2A2A" />
        </mesh>
      </group>
    );
  }
  return (
    <mesh geometry={geo!}>
      <meshStandardMaterial color="#4A2A20" />
    </mesh>
  );
}

type Pose = { aL: number; aR: number; aLx?: number; aRx?: number; y: number; rotZ: number; rotY: number; squash: number };

function poseFor(mood: PetMood, t: number): Pose {
  const base: Pose = { aL: 0.25, aR: -0.25, y: 0, rotZ: 0, rotY: 0, squash: 1 + Math.sin(t * 2.2) * 0.02 };
  switch (mood) {
    case 'celebrate':
      return { aL: 2.6 + Math.sin(t * 12) * 0.2, aR: -2.6 - Math.sin(t * 12) * 0.2, y: Math.abs(Math.sin(t * 5)) * 0.45, rotZ: 0, rotY: Math.sin(t * 2.5) * 0.5, squash: 1 };
    case 'happy':
      return { ...base, aL: 0.4 + Math.sin(t * 3) * 0.1, aR: -0.4 - Math.sin(t * 3) * 0.1, y: Math.abs(Math.sin(t * 2.2)) * 0.05 };
    case 'attentive':
      return { ...base, aR: -1.2, aRx: -1.4, rotZ: 0.06 };
    case 'caringLow':
      return { ...base, aR: -2.4 + Math.sin(t * 6) * 0.35, rotZ: Math.sin(t * 1.5) * 0.04 };
    case 'caringHigh':
      return { ...base, aL: 1.2, aLx: -1.0, aR: -1.2, aRx: -1.0 }; // sostiene el corazón
    case 'worriedLow':
    case 'worriedHigh':
      return { ...base, aL: 1.5, aLx: -1.3, aR: -1.5, aRx: -1.3, squash: 0.97 + Math.sin(t * 6) * 0.01 };
    case 'sleep':
      return { ...base, aL: 0.15, aR: -0.15, squash: 0.94 + Math.sin(t * 1.3) * 0.03, rotZ: 0.05 };
    case 'confused':
      return { ...base, aR: -2.5, aRx: -0.3, rotZ: Math.sin(t * 0.9) * 0.05 };
    case 'remind':
      return { ...base, aR: -2.9 + Math.sin(t * 4) * 0.12, y: Math.abs(Math.sin(t * 3)) * 0.12 };
    case 'sport': {
      const s = Math.sin(t * 10);
      return { aL: 0.5, aR: -0.5, aLx: s * 0.9, aRx: -s * 0.9, y: Math.abs(s) * 0.14, rotZ: s * 0.04, rotY: 0, squash: 1 };
    }
    case 'missYou':
      return { aL: 1.9, aR: -1.9, aLx: -0.6, aRx: -0.6, y: Math.abs(Math.sin(t * 3)) * 0.15, rotZ: 0, rotY: 0, squash: 1 };
  }
}

export default function Hedgehog({
  mood,
  level,
  position = [0, 0, 0],
  facing = 0,
  showEffects = true,
  size = 1,
}: {
  mood: PetMood;
  level: PetLevel;
  position?: [number, number, number];
  facing?: number;
  showEffects?: boolean;
  size?: number;
}) {
  const face = FACES[mood];
  const L = LEVELS[level];
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const blink = useRef(0);
  const nextBlink = useRef(1.5);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    if (!root.current || !body.current || !head.current || !armL.current || !armR.current) return;
    const p = poseFor(mood, t);
    const k = Math.min(1, dt * 9);
    body.current.position.y = lerp(body.current.position.y, p.y, 0.5);
    body.current.rotation.z = lerp(body.current.rotation.z, p.rotZ, k);
    body.current.rotation.y = lerp(body.current.rotation.y, facing + p.rotY, k);
    body.current.scale.y = lerp(body.current.scale.y, p.squash, k);
    armL.current.rotation.z = lerp(armL.current.rotation.z, p.aL, k);
    armR.current.rotation.z = lerp(armR.current.rotation.z, p.aR, k);
    armL.current.rotation.x = lerp(armL.current.rotation.x, p.aLx ?? 0, k);
    armR.current.rotation.x = lerp(armR.current.rotation.x, p.aRx ?? 0, k);
    head.current.rotation.z = lerp(head.current.rotation.z, (face.tilt ?? 0) + Math.sin(t * 1.1) * 0.03, k);
    if (mood === 'sleep') blink.current = 1;
    else if (t > nextBlink.current) {
      const b = (t - nextBlink.current) / 0.15;
      blink.current = b < 1 ? 1 - Math.abs(1 - 2 * b) : 0;
      if (b >= 1) nextBlink.current = t + 2 + Math.random() * 3;
    }
  });

  const arm = (side: 1 | -1, ref: React.RefObject<THREE.Group | null>) => (
    <group ref={ref} position={[0.43 * side, 0.6, 0.3]}>
      <mesh position={[0, -0.13, 0]}>
        <capsuleGeometry args={[0.065, 0.16, 6, 12]} />
        <meshStandardMaterial color={FUR} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.25, 0.01]}>
        <sphereGeometry args={[0.075, 14, 12]} />
        <meshStandardMaterial color={SNOUT} roughness={0.7} />
      </mesh>
    </group>
  );

  return (
    <group ref={root} position={position} scale={L.scale * size}>
      <group ref={body}>
        {/* Cuerpo: espalda marrón con púas, barriga y cara claras */}
        <mesh position={[0, 0.72, -0.04]} scale={[1, 1.02, 0.95]}>
          <sphereGeometry args={[0.6, 40, 32]} />
          <meshStandardMaterial color={SPIKE} roughness={0.8} />
        </mesh>
        <Spikes count={L.spikes} len={L.spikeLen} />
        <mesh position={[0, 0.66, 0.15]} scale={[1, 1, 0.92]}>
          <sphereGeometry args={[0.53, 40, 32]} />
          <meshStandardMaterial color={FUR} roughness={0.65} />
        </mesh>
        {/* Pies */}
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.07, 0.3]} scale={[1, 0.5, 1.35]}>
            <sphereGeometry args={[0.12, 16, 12]} />
            <meshStandardMaterial color={SNOUT} roughness={0.7} />
          </mesh>
        ))}
        {arm(1, armL)}
        {arm(-1, armR)}
        <group ref={head} position={[0, 0.7, 0]}>
          <group position={[0, -0.7, 0]}>
            {/* Orejas */}
            {[-0.34, 0.34].map((x) => (
              <group key={x} position={[x, 1.13, 0.18]} rotation={[0, 0, x < 0 ? 0.4 : -0.4]}>
                <mesh scale={[1, 1.1, 0.6]}>
                  <sphereGeometry args={[0.1, 16, 12]} />
                  <meshStandardMaterial color={FUR} roughness={0.7} />
                </mesh>
                <mesh position={[0, 0, 0.035]} scale={[0.6, 0.7, 0.3]}>
                  <sphereGeometry args={[0.1, 14, 10]} />
                  <meshStandardMaterial color={INNER_EAR} roughness={0.7} />
                </mesh>
              </group>
            ))}
            {/* Hocico y nariz */}
            <mesh position={[0, 0.63, 0.6]} scale={[1, 0.85, 1.25]}>
              <sphereGeometry args={[0.19, 24, 18]} />
              <meshStandardMaterial color={SNOUT} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.68, 0.83]}>
              <sphereGeometry args={[0.072, 18, 14]} />
              <meshStandardMaterial color="#2A1A12" roughness={0.2} />
            </mesh>
            <mesh position={[0.02, 0.71, 0.89]}>
              <sphereGeometry args={[0.018, 8, 6]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <Eye x={-0.2} face={face} blink={blink} />
            <Eye x={0.2} face={face} blink={blink} />
            {[-0.2, 0.2].map((x) => (
              <mesh key={x} position={[x, 1.03 + (face.browY ?? 0), 0.56]} rotation={[0.3, x < 0 ? -0.3 : 0.3, x < 0 ? -face.brow : face.brow]}>
                <capsuleGeometry args={[0.016, 0.08, 4, 8]} />
                <meshStandardMaterial color="#5A3820" />
              </mesh>
            ))}
            {[-0.33, 0.33].map((x) => (
              <mesh key={x} position={[x, 0.7, 0.47]} scale={[1, 0.6, 0.3]}>
                <sphereGeometry args={[0.08, 12, 8]} />
                <meshStandardMaterial color="#FF8F80" transparent opacity={mood === 'celebrate' || mood === 'missYou' ? 0.7 : 0.45} />
              </mesh>
            ))}
            <group position={[0, 0.47, 0.69]} rotation={[-0.25, 0, 0]}>
              <Mouth kind={face.mouth} />
            </group>
            {/* Accesorios por nivel / momento */}
            {level >= 3 && mood !== 'sleep' && mood !== 'sport' && (
              <group position={[0, 1.2, -0.02]} rotation={[-0.25, 0, 0]}>
                <mesh scale={[1, 0.7, 1]}>
                  <sphereGeometry args={[0.36, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#4C8DFF" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.27, 0]}>
                  <sphereGeometry args={[0.08, 14, 10]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
                </mesh>
              </group>
            )}
            {mood === 'sleep' && (
              <group position={[0.05, 1.18, -0.02]} rotation={[-0.2, 0, -0.35]}>
                <mesh>
                  <coneGeometry args={[0.3, 0.55, 20]} />
                  <meshStandardMaterial color="#6C7BD9" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                  <sphereGeometry args={[0.07, 12, 10]} />
                  <meshStandardMaterial color="#FFFFFF" />
                </mesh>
              </group>
            )}
            {mood === 'sport' && (
              <mesh position={[0, 1.02, 0.1]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
                <torusGeometry args={[0.47, 0.045, 12, 40]} />
                <meshStandardMaterial color="#FF7A59" roughness={0.6} />
              </mesh>
            )}
          </group>
        </group>
        {level >= 2 && (
          // Pañuelo al cuello (nivel 2 en adelante)
          <group position={[0, 0.44, 0.585]} rotation={[-0.35, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI]} scale={[1.25, 1, 0.22]}>
              <coneGeometry args={[0.2, 0.26, 3]} />
              <meshStandardMaterial color="#FF7A59" roughness={0.85} />
            </mesh>
            {[-0.17, 0.17].map((x) => (
              <mesh key={x} position={[x, 0.1, -0.04]} rotation={[0, 0, x < 0 ? 0.5 : -0.5]}>
                <capsuleGeometry args={[0.035, 0.12, 4, 8]} />
                <meshStandardMaterial color="#FF7A59" roughness={0.85} />
              </mesh>
            ))}
          </group>
        )}
        {level >= 4 && (
          <group position={[0, 0.36, 0.5]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.025, 24]} />
              <meshStandardMaterial color="#FFD166" metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        )}
      </group>
      {/* Efectos de emoción */}
      {showEffects && (mood === 'caringHigh' || mood === 'caringLow') && <Heart at={[0, 0.62, 0.95]} size={0.42} />}
      {showEffects && (mood === 'worriedHigh' || mood === 'worriedLow') && <Heart at={[0.55, 1.5, 0.3]} size={0.55} fast />}
      {showEffects && mood === 'missYou' && <Heart at={[0.55, 1.55, 0.3]} size={0.45} />}
      {showEffects && mood === 'sleep' && <Floating text="Z" color="#6C7BD9" at={[0.45, 1.45, 0.2]} count={3} size={0.28} />}
      {showEffects && mood === 'confused' && <Floating text="?" color="#B8432A" at={[0.5, 1.6, 0.2]} size={0.4} />}
      {showEffects && mood === 'remind' && <Floating text="!" color="#E8A400" at={[-0.55, 1.6, 0.2]} size={0.42} />}
      {showEffects && mood === 'celebrate' && <Confetti width={2.4} top={2.6} />}
    </group>
  );
}
