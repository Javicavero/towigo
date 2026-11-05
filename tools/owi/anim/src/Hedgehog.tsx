/**
 * Owi, la mascota erizo (común a todos los perfiles).
 * Cuerpo: modelo del diseño (assets/owi/owi.glb, preparado con tools/owi/prepare_owi.py).
 * Cara y gestos: los dibuja la app siguiendo las 12 visualizaciones de referencia
 * (assets/owi/*.png): feliz, atento, cariñoso/preocupado con glucosa alta y baja,
 * celebra, duerme, confundido, avisa, deporte y "te echaba de menos".
 * Evoluciona con el vínculo: tamaño y accesorios por nivel. Nunca regaña.
 */
import { useFrame, useLoader } from '@react-three/fiber';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PetLevel, PetMood } from './state/types';
import { Confetti, Floating, Heart, lerp, tube } from './common';

const OWI_URL = './owi_prepared.glb';

const C = {
  quill: '#683619',
  fur: '#F5C477',
  belly: '#FAD593',
  earInner: '#E3A879',
  nose: '#3A2216',
  ink: '#2B1A12',
  mouth: '#5A2A1C',
  tongue: '#F07B7B',
  blush: '#FF9C8C',
};

// Anclas de la cara (coordenadas del modelo preparado)
const EYE = { x: 0.215, y: 0.79, z: 0.6 };
const BROW_Y = 1.05;
const MOUTH = { y: 0.47, z: 0.635 };

type EyeKind = 'open' | 'watery' | 'happy' | 'closed' | 'squint';
type MouthKind = 'open' | 'smile' | 'o' | 'sad' | 'wobble' | 'grin';
type Arms = { lr: number; lf: number; rr: number; rf: number }; // raise / forward por brazo
type Look = {
  eye: EyeKind;
  gaze?: [number, number];
  brow: number; // >0 alegre, <0 preocupado (interior arriba)
  angry?: boolean;
  mouth: MouthKind;
};

const LOOKS: Record<PetMood, Look> = {
  happy: { eye: 'open', brow: 0.1, mouth: 'open' },
  attentive: { eye: 'open', gaze: [0.035, 0.045], brow: 0.15, mouth: 'o' },
  caringHigh: { eye: 'happy', brow: 0.1, mouth: 'smile' },
  worriedHigh: { eye: 'watery', gaze: [0, 0.02], brow: -0.45, mouth: 'sad' },
  caringLow: { eye: 'happy', brow: 0.05, mouth: 'smile' },
  worriedLow: { eye: 'open', gaze: [-0.04, 0.03], brow: -0.35, mouth: 'wobble' },
  celebrate: { eye: 'happy', brow: 0.2, mouth: 'open' },
  sleep: { eye: 'closed', brow: 0, mouth: 'o' },
  confused: { eye: 'open', gaze: [0.035, 0.05], brow: 0.1, mouth: 'o' },
  remind: { eye: 'open', brow: 0.2, mouth: 'open' },
  sport: { eye: 'squint', brow: 0.4, angry: true, mouth: 'grin' },
  missYou: { eye: 'watery', gaze: [0, 0.025], brow: -0.4, mouth: 'wobble' },
};

/** Tamaño por nivel de evolución (los accesorios se añaden abajo). */
export const LEVELS: Record<PetLevel, { scale: number }> = { 1: { scale: 0.82 }, 2: { scale: 0.9 }, 3: { scale: 0.97 }, 4: { scale: 1.0 } };

/**
 * Brazos: "raise" lo separa hacia el lado/arriba; "forward" lo levanta hacia delante
 * (mejillas, barbilla, abrazar). Valores negativos de raise lo acercan al cuerpo.
 */
/** Duración del bucle de cada emoción (s). Todas las oscilaciones son múltiplos enteros: bucles perfectos. */
export const LOOP: Record<PetMood, number> = {
  happy: 2.4, attentive: 3.2, caringHigh: 3.2, worriedHigh: 1.6, caringLow: 3.2, worriedLow: 1.6,
  celebrate: 2.4, sleep: 4, confused: 3.2, remind: 2.4, sport: 0.8, missYou: 3.2,
};

function armsFor(mood: PetMood, ph: number): Arms {
  switch (mood) {
    case 'happy':
      return { lr: 0.15 + Math.sin(ph * 2) * 0.08, lf: 0.2, rr: 2.65 + Math.sin(ph * 4) * 0.3, rf: 0 };
    case 'attentive':
    case 'worriedLow':
      return { lr: 0.05, lf: 0.2, rr: -0.7, rf: 1.25 + Math.sin(ph * 2) * 0.06 }; // mano a la barbilla
    case 'caringHigh':
      return { lr: -0.25, lf: 1.35 + Math.sin(ph * 2) * 0.08, rr: -0.25, rf: 1.35 + Math.sin(ph * 2) * 0.08 }; // abraza el corazón
    case 'caringLow':
      return { lr: -0.3, lf: 1.15 + Math.sin(ph * 2) * 0.08, rr: -0.3, rf: 1.15 + Math.sin(ph * 2) * 0.08 };
    case 'worriedHigh':
    case 'missYou':
      return { lr: -0.6, lf: 1.55, rr: -0.6, rf: 1.55 }; // manos a las mejillas
    case 'celebrate':
      return { lr: 2.5 + Math.sin(ph * 6) * 0.25, lf: 0, rr: 2.5 + Math.sin(ph * 6 + 1) * 0.25, rf: 0 };
    case 'sleep':
      return { lr: -0.2, lf: 1.4, rr: -0.2, rf: 1.4 };
    case 'confused':
      return { lr: 0.1, lf: 0.2, rr: -0.5 + Math.sin(ph) * 0.15, rf: 1.5 }; // se rasca la cabeza
    case 'remind':
      return { lr: 0.1, lf: 0.2, rr: 2.8 + Math.sin(ph * 3) * 0.3, rf: 0.2 };
    case 'sport': {
      const sw = Math.sin(ph);
      return { lr: 0.3, lf: 0.6 + sw * 0.9, rr: 0.3, rf: 0.6 - sw * 0.9 };
    }
  }
}

// ---------- cara ----------
function Eye({ side, look, blink }: { side: 1 | -1; look: Look; blink: React.RefObject<number> }) {
  const g = useRef<THREE.Group>(null);
  const [gx, gy] = look.gaze ?? [0, 0];
  const arc = useMemo(() => {
    if (look.eye === 'happy') return tube([[-0.11, -0.03, 0], [-0.05, 0.05, 0.015], [0.05, 0.05, 0.015], [0.11, -0.03, 0]], 0.022); // ^
    if (look.eye === 'closed') return tube([[-0.11, 0.02, 0], [-0.05, -0.04, 0.015], [0.05, -0.04, 0.015], [0.11, 0.02, 0]], 0.02); // ︶
    return null;
  }, [look.eye]);
  useFrame(() => {
    if (g.current) g.current.scale.y = 1 - (blink.current ?? 0) * 0.9;
  });
  const pos: [number, number, number] = [EYE.x * side, EYE.y, EYE.z];
  if (arc)
    return (
      <mesh geometry={arc} position={[pos[0], pos[1], pos[2] + 0.03]}>
        <meshStandardMaterial color={C.ink} roughness={0.4} />
      </mesh>
    );
  return (
    <group ref={g} position={pos} rotation={[0, side * 0.28, 0]}>
      <mesh scale={[0.165, 0.2, 0.09]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </mesh>
      <group position={[gx, gy, 0.06]}>
        <mesh scale={[0.105, 0.125, 0.05]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshStandardMaterial color={C.ink} roughness={0.15} />
        </mesh>
        <mesh position={[0.035, 0.045, 0.045]} scale={[0.038, 0.042, 0.02]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[-0.03, -0.045, 0.045]} scale={[0.018, 0.018, 0.01]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {look.eye === 'watery' && (
          <mesh position={[0, -0.075, 0.042]} scale={[0.08, 0.03, 0.012]}>
            <sphereGeometry args={[1, 20, 10]} />
            <meshBasicMaterial color="#BFE3FF" transparent opacity={0.9} />
          </mesh>
        )}
      </group>
      {look.eye === 'squint' && (
        // párpado superior marcado: mirada decidida
        <mesh position={[0, 0.13, 0.03]} rotation={[0, 0, side * 0.35]} scale={[0.19, 0.08, 0.1]}>
          <sphereGeometry args={[1, 20, 12]} />
          <meshStandardMaterial color={C.fur} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

function Brow({ side, look }: { side: 1 | -1; look: Look }) {
  const geo = useMemo(() => tube([[-0.07, -0.008, 0], [0, 0.012, 0.01], [0.07, -0.008, 0]], 0.022), []);
  // Interior arriba = preocupación; "angry" = interior abajo (decidido, deporte).
  const a = look.angry ? side * -0.45 : side * -look.brow;
  const y = BROW_Y + (look.brow < 0 ? 0.03 : 0) + (look.angry ? -0.04 : 0);
  return (
    <mesh geometry={geo} position={[EYE.x * side, y, 0.53]} rotation={[0.3, side * 0.3, a]}>
      <meshStandardMaterial color={C.quill} roughness={0.6} />
    </mesh>
  );
}

function Mouth({ kind }: { kind: MouthKind }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    if (kind === 'open' || kind === 'grin') {
      const w = kind === 'grin' ? 0.13 : 0.11;
      s.moveTo(-w, 0.03);
      s.quadraticCurveTo(0, 0.05, w, 0.03);
      s.quadraticCurveTo(w * 0.85, -0.13, 0, -0.14);
      s.quadraticCurveTo(-w * 0.85, -0.13, -w, 0.03);
    } else if (kind === 'sad') {
      s.moveTo(-0.08, -0.05);
      s.quadraticCurveTo(0, 0.09, 0.08, -0.05);
      s.quadraticCurveTo(0, -0.02, -0.08, -0.05);
    } else return null;
    return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
  }, [kind]);
  const line = useMemo(() => {
    if (kind === 'smile') return tube([[-0.08, 0.02, -0.01], [-0.03, -0.025, 0.01], [0.03, -0.025, 0.01], [0.08, 0.02, -0.01]], 0.016);
    if (kind === 'wobble') return tube([[-0.06, -0.015, -0.01], [-0.02, 0.01, 0.01], [0.02, -0.012, 0.01], [0.06, 0.005, -0.01]], 0.014);
    return null;
  }, [kind]);
  return (
    <group position={[0, MOUTH.y, MOUTH.z]} rotation={[-0.2, 0, 0]}>
      {geo && (
        <mesh geometry={geo} position={[0, 0, -0.02]}>
          <meshStandardMaterial color={C.mouth} roughness={0.5} />
        </mesh>
      )}
      {(kind === 'open' || kind === 'grin') && (
        <mesh position={[0, -0.085, 0.012]} scale={[0.07, 0.04, 0.02]}>
          <sphereGeometry args={[1, 20, 12]} />
          <meshStandardMaterial color={C.tongue} roughness={0.5} />
        </mesh>
      )}
      {kind === 'sad' && (
        <mesh position={[0, 0.0, 0.01]} scale={[0.04, 0.02, 0.012]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color={C.tongue} roughness={0.5} />
        </mesh>
      )}
      {line && (
        <mesh geometry={line}>
          <meshStandardMaterial color={C.mouth} roughness={0.5} />
        </mesh>
      )}
      {kind === 'o' && (
        <mesh scale={[0.032, 0.04, 0.02]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color={C.mouth} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ---------- efectos ----------
function Sparkles({ at, flip = false, color = '#FFC93C' }: { at: [number, number, number]; flip?: boolean; color?: string }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.scale.setScalar(0.9 + Math.sin(clock.getElapsedTime() * 6) * 0.12);
  });
  const sx = flip ? -1 : 1;
  return (
    <group ref={g} position={at}>
      {[0.5, 1.0, 1.5].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.17 * sx, Math.sin(a) * 0.17, 0]} rotation={[0, 0, sx > 0 ? a - Math.PI / 2 : Math.PI / 2 - a]}>
          <capsuleGeometry args={[0.022, 0.1, 4, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Sweat({ at }: { at: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = at[1] + Math.sin(clock.getElapsedTime() * 4) * 0.03;
  });
  return (
    <group ref={g} position={at}>
      {[
        [0, 0, 1],
        [0.15, -0.12, 0.75],
      ].map(([x, y, s], i) => (
        <group key={i} position={[x, y, 0]} scale={s} rotation={[0, 0, -0.5]}>
          <mesh>
            <sphereGeometry args={[0.055, 16, 12]} />
            <meshStandardMaterial color="#3FA9F5" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <coneGeometry args={[0.048, 0.09, 16]} />
            <meshStandardMaterial color="#3FA9F5" roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SpeedLines() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.x = -0.95 + Math.sin(clock.getElapsedTime() * 10) * 0.05;
  });
  return (
    <group ref={g} position={[-0.95, 0.8, 0]}>
      {[0.25, 0, -0.25].map((y, i) => (
        <mesh key={y} position={[i % 2 ? 0.08 : 0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.018, 0.28, 4, 8]} />
          <meshBasicMaterial color="#2B2B2B" />
        </mesh>
      ))}
      {[
        [0.05, -0.72, 0.09],
        [0.17, -0.68, 0.12],
        [0.28, -0.74, 0.08],
      ].map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[r, 14, 10]} />
          <meshStandardMaterial color="#F1EEE8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Owi ----------
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
  const gltf = useLoader(GLTFLoader, OWI_URL);
  const look = LOOKS[mood];
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const blink = useRef(0);
  const nextBlink = useRef(1.5);

  const { model, armL, armR, footL, footR } = useMemo(() => {
    const model = gltf.scene.clone(true);
    const get = (n: string) => model.getObjectByName(n)!;
    return { model, armL: get('arm_L'), armR: get('arm_R'), footL: get('foot_L'), footR: get('foot_R') };
  }, [gltf]);

  useEffect(() => {
    const mats = {
      quill: new THREE.MeshStandardMaterial({ color: C.quill, roughness: 0.7 }),
      fur: new THREE.MeshStandardMaterial({ color: C.fur, roughness: 0.65 }),
      belly: new THREE.MeshStandardMaterial({ color: C.belly, roughness: 0.7 }),
      earInner: new THREE.MeshStandardMaterial({ color: C.earInner, roughness: 0.7 }),
      nose: new THREE.MeshStandardMaterial({ color: C.nose, roughness: 0.25 }),
    };
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material =
        m.name === 'quills' || m.name === 'body'
          ? mats.quill
          : m.name === 'belly'
            ? mats.belly
            : m.name.startsWith('earInner')
              ? mats.earInner
              : m.name === 'nose'
                ? mats.nose
                : mats.fur;
      m.geometry.computeVertexNormals();
    });
    return () => Object.values(mats).forEach((x) => x.dispose());
  }, [model]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!root.current || !body.current) return;
    const L = LOOP[mood];
    const ph = ((t % L) / L) * Math.PI * 2; // fase 0..2π del bucle
    const k = 1; // sin retardo: cada fotograma depende solo de la fase (bucles perfectos)
    const a = armsFor(mood, ph);
    armR.rotation.z = lerp(armR.rotation.z, a.rr, k);
    armR.rotation.x = lerp(armR.rotation.x, -a.rf, k);
    armL.rotation.z = lerp(armL.rotation.z, -a.lr, k);
    armL.rotation.x = lerp(armL.rotation.x, -a.lf, k);
    let y = 0, rx = 0, ry = facing, rz = 0, sy = 1 + Math.sin(ph) * 0.015, sx = 1;
    const hop = (n: number, h: number) => Math.abs(Math.sin((ph * n) / 2)) * h;
    switch (mood) {
      case 'happy':
        y = hop(2, 0.08);
        ry = Math.sin(ph) * 0.22;
        rz = Math.sin(ph) * 0.04;
        break;
      case 'remind':
        y = hop(2, 0.05);
        ry = 0.12 + Math.sin(ph) * 0.08;
        break;
      case 'celebrate': {
        y = hop(3, 0.4);
        ry = ph; // giro completo en cada bucle
        const land = 1 - Math.abs(Math.sin((ph * 3) / 2)); // aplastado al tocar el suelo
        sy = 1 - land * 0.1;
        sx = 1 + land * 0.06;
        break;
      }
      case 'sport':
        y = 0.06 + hop(2, 0.1);
        ry = facing - 0.45;
        rx = 0.15;
        rz = Math.sin(ph) * 0.05;
        break;
      case 'sleep':
        rx = 0.22;
        y = 0.04;
        sy = 0.9 + Math.sin(ph) * 0.03;
        rz = Math.sin(ph) * 0.03;
        break;
      case 'attentive':
        rz = 0.1 + Math.sin(ph) * 0.04;
        ry = Math.sin(ph) * 0.25;
        break;
      case 'confused':
        rz = Math.sin(ph) * 0.16;
        ry = Math.sin(ph + 1) * 0.28;
        break;
      case 'caringHigh':
      case 'caringLow':
        rz = Math.sin(ph) * 0.07;
        sy = 1 + Math.sin(ph * 2) * 0.02;
        break;
      case 'worriedHigh':
      case 'worriedLow':
        rz = Math.sin(ph * 8) * 0.025;
        sy = 1 + Math.sin(ph * 2) * 0.012;
        break;
      case 'missYou':
        rz = -0.08 + Math.sin(ph) * 0.07;
        y = hop(2, 0.03);
        ry = Math.sin(ph) * 0.15;
        break;
    }
    body.current.position.y = y;
    body.current.rotation.x = rx;
    body.current.rotation.y = ry;
    body.current.rotation.z = rz;
    body.current.scale.set(sx, sy, sx);
    const run = mood === 'sport' ? Math.sin(ph) * 0.6 : 0;
    footL.rotation.x = run;
    footR.rotation.x = -run;
    // Parpadeo determinista (una vez por bucle)
    const p = (t % L) / L;
    const bl = mood === 'sleep' ? 0 : p > 0.62 && p < 0.68 ? 1 - Math.abs(1 - 2 * ((p - 0.62) / 0.06)) : 0;
    blink.current = bl;
  });

  return (
    <group ref={root} position={position} scale={LEVELS[level].scale * size}>
      <group ref={body}>
        <primitive object={model} />
        <Eye side={-1} look={look} blink={blink} />
        <Eye side={1} look={look} blink={blink} />
        <Brow side={-1} look={look} />
        <Brow side={1} look={look} />
        <Mouth kind={look.mouth} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.36 * s, 0.6, 0.53]} rotation={[0, s * 0.5, 0]} scale={[0.1, 0.055, 0.02]}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color={C.blush} transparent opacity={0.55} />
          </mesh>
        ))}
        {mood === 'sport' && (
          <group position={[0, 1.1, -0.02]} rotation={[-0.15, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.45, 0.055, 12, 40]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
            </mesh>
            {[-0.035, 0.035].map((dy) => (
              <mesh key={dy} position={[0, dy, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.455, 0.018, 8, 40]} />
                <meshStandardMaterial color="#D9342B" roughness={0.6} />
              </mesh>
            ))}
          </group>
        )}
        {level >= 3 && mood !== 'sport' && mood !== 'sleep' && (
          <group position={[0, 1.32, -0.08]} rotation={[-0.35, 0, 0]}>
            <mesh scale={[1, 0.75, 1]}>
              <sphereGeometry args={[0.34, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#3A7BEA" roughness={0.85} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.335, 0.045, 10, 32]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
              <sphereGeometry args={[0.075, 14, 10]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
            </mesh>
          </group>
        )}
        {level >= 2 && mood !== 'sleep' && (
          <group position={[0, 0.3, 0.6]} rotation={[-0.35, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI]} scale={[1.3, 1, 0.22]}>
              <coneGeometry args={[0.19, 0.24, 3]} />
              <meshStandardMaterial color="#FF7A59" roughness={0.85} />
            </mesh>
          </group>
        )}
        {level >= 4 && mood !== 'sleep' && (
          <mesh position={[0.22, 0.25, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.025, 24]} />
            <meshStandardMaterial color="#FFD166" metalness={0.5} roughness={0.3} />
          </mesh>
        )}
        {showEffects && mood === 'caringHigh' && <Heart at={[0, 0.5, 0.78]} size={0.75} />}
        {showEffects && mood === 'caringLow' && <Heart at={[0, 0.42, 0.78]} size={0.38} />}
      </group>
      {showEffects && mood === 'caringHigh' && <Heart at={[0.72, 1.42, 0.1]} size={0.3} />}
      {showEffects && mood === 'missYou' && <Heart at={[0.75, 1.4, 0.1]} size={0.38} fast />}
      {showEffects && (mood === 'happy' || mood === 'remind') && <Sparkles at={[mood === 'remind' ? 0.75 : -0.78, 1.32, 0.1]} flip={mood !== 'remind'} />}
      {showEffects && mood === 'attentive' && <Sparkles at={[0.75, 1.32, 0.1]} />}
      {showEffects && mood === 'worriedHigh' && <Sweat at={[0.75, 1.35, 0.1]} />}
      {showEffects && mood === 'sleep' && <Floating text="Z" color="#7E5BEF" at={[0.5, 1.2, 0.2]} count={3} size={0.3} />}
      {showEffects && mood === 'confused' && <Floating text="?" color="#7E5BEF" at={[0.7, 1.45, 0.2]} size={0.45} />}
      {showEffects && mood === 'remind' && <Floating text="!" color="#FFC93C" at={[0.55, 1.55, 0.2]} size={0.5} />}
      {showEffects && mood === 'sport' && <SpeedLines />}
      {showEffects && mood === 'celebrate' && <Confetti width={2.4} top={2.4} />}
    </group>
  );
}
