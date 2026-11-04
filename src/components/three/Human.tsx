/**
 * Avatar humano del usuario (se parece a la persona): complexión, altura, cara, ojos, cejas,
 * pelo, barba, gafas y ropa. Carga el cuerpo esculpido (assets/avatar/avatar.glb) y le añade
 * la cara y las posturas en tiempo real. El modelo definitivo de un diseñador debe respetar
 * los nombres de nodos (docs/AVATAR_MODELO.md).
 * El avatar no juzga: no muestra preocupación por la glucosa; eso lo acompaña Owi.
 */
import { useFrame, useLoader } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  BODY_SCALE,
  BOTTOM_COLORS,
  EYE_COLORS,
  FACE_SCALE,
  HAIR_COLORS,
  HEIGHT_SCALE,
  SHOE_COLORS,
  SKIN_TONES,
  TOP_COLORS,
} from '../../data/avatarOptions';
import type { Avatar, Mood } from '../../state/types';
import { lerp, tube } from './common';

const AVATAR_URL = Asset.fromModule(require('../../../assets/avatar/avatar.glb')).uri;
const HEAD_PIVOT = new THREE.Vector3(0, 2.5, 0);
const HEAD_CENTER = new THREE.Vector3(0, 2.92, 0);
const BROW_R = { finas: 0.009, normales: 0.013, gruesas: 0.02 } as const;

// ---------- Expresión de cada estado ----------
type MouthKind = 'smile' | 'soft' | 'flat' | 'wavy' | 'big' | 'o' | 'sleep';
type Face = { lid: number; lowerLid?: number; brow: number; browY: number; mouth: MouthKind; headTilt?: number };

const FACES: Record<Mood, Face> = {
  happy: { lid: 0.25, brow: 0.08, browY: 0, mouth: 'smile' },
  attentive: { lid: 0.2, brow: -0.05, browY: 0.012, mouth: 'flat', headTilt: 0.12 },
  caringHigh: { lid: 0.32, brow: -0.22, browY: 0.012, mouth: 'soft', headTilt: -0.08 },
  worriedHigh: { lid: 0.22, brow: -0.38, browY: 0.02, mouth: 'wavy' },
  caringLow: { lid: 0.3, brow: -0.25, browY: 0.012, mouth: 'soft', headTilt: 0.1 },
  worriedLow: { lid: 0.18, brow: -0.42, browY: 0.024, mouth: 'o' },
  celebrate: { lid: 0.42, lowerLid: 0.3, brow: 0.15, browY: 0.02, mouth: 'big' },
  sleep: { lid: 1, brow: 0.05, browY: -0.01, mouth: 'sleep', headTilt: 0.22 },
  confused: { lid: 0.25, brow: -0.1, browY: 0.015, mouth: 'wavy', headTilt: -0.18 },
  remind: { lid: 0.2, brow: 0.12, browY: 0.016, mouth: 'smile' },
  sport: { lid: 0.3, lowerLid: 0.15, brow: 0.05, browY: 0.008, mouth: 'big' },
};

const MOUTH_COLOR = '#5B2423';

function Mouth({ kind }: { kind: MouthKind }) {
  const geo = useMemo(() => {
    switch (kind) {
      case 'smile':
        return tube([[-0.075, 0.018, -0.018], [-0.035, -0.022, 0], [0, -0.032, 0.004], [0.035, -0.022, 0], [0.075, 0.018, -0.018]], 0.011);
      case 'soft':
        return tube([[-0.048, 0.006, -0.008], [0, -0.014, 0.002], [0.048, 0.006, -0.008]], 0.01);
      case 'flat':
        return tube([[-0.042, -0.004, -0.006], [0, 0, 0.002], [0.042, 0.002, -0.006]], 0.0095);
      case 'wavy':
        return tube([[-0.055, -0.012, -0.01], [-0.02, 0.004, 0], [0.02, -0.01, 0], [0.055, 0.004, -0.01]], 0.0095);
      default:
        return null;
    }
  }, [kind]);
  const big = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.085, 0.02);
    s.quadraticCurveTo(0, 0.034, 0.085, 0.02);
    s.quadraticCurveTo(0.07, -0.085, 0, -0.088);
    s.quadraticCurveTo(-0.07, -0.085, -0.085, 0.02);
    return new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 });
  }, []);
  if (kind === 'big')
    return (
      <group>
        <mesh geometry={big} position={[0, 0, -0.012]}>
          <meshStandardMaterial color="#7A2A2A" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.006, 0.004]} scale={[1, 0.28, 0.4]}>
          <sphereGeometry args={[0.06, 16, 8]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.06, 0.0]} scale={[1, 0.5, 0.4]}>
          <sphereGeometry args={[0.045, 16, 8]} />
          <meshStandardMaterial color="#E86A6A" roughness={0.6} />
        </mesh>
      </group>
    );
  if (kind === 'o' || kind === 'sleep') {
    const r = kind === 'o' ? 0.028 : 0.016;
    return (
      <group>
        <mesh>
          <torusGeometry args={[r, 0.009, 8, 24]} />
          <meshStandardMaterial color={MOUTH_COLOR} />
        </mesh>
        <mesh position={[0, 0, -0.004]}>
          <circleGeometry args={[r, 24]} />
          <meshStandardMaterial color="#7A2A2A" />
        </mesh>
      </group>
    );
  }
  return (
    <mesh geometry={geo!}>
      <meshStandardMaterial color={MOUTH_COLOR} roughness={0.5} />
    </mesh>
  );
}

function Eye({ x, face, skin, iris, blink }: { x: number; face: Face; skin: string; iris: string; blink: React.RefObject<number> }) {
  const upper = useRef<THREE.Mesh>(null);
  const lower = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // Párpado superior: rota hacia abajo para cerrar. lid 0 = abierto, 1 = cerrado.
    const lid = Math.max(face.lid, blink.current ?? 0);
    if (upper.current) upper.current.rotation.x = -Math.PI / 2 + lid * Math.PI * 0.98;
    if (lower.current) lower.current.rotation.x = -Math.PI / 2 - (face.lowerLid ?? 0) * 2.36;
  });
  return (
    <group position={[x, 2.977, 0.302]}>
      <mesh scale={[1, 1.08, 0.9]}>
        <sphereGeometry args={[0.062, 28, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.05]} scale={[1, 1, 0.35]}>
        <sphereGeometry args={[0.037, 24, 16]} />
        <meshStandardMaterial color={iris} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.056]} scale={[1, 1, 0.35]}>
        <sphereGeometry args={[0.02, 20, 12]} />
        <meshStandardMaterial color="#120B08" roughness={0.1} />
      </mesh>
      <mesh position={[0.014, 0.016, 0.062]}>
        <sphereGeometry args={[0.009, 10, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Párpados: media esfera de piel que gira sobre el ojo */}
      <mesh ref={upper}>
        <sphereGeometry args={[0.066, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={skin} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={lower}>
        <sphereGeometry args={[0.065, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={skin} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Brow({ x, face, color, r }: { x: number; face: Face; color: string; r: number }) {
  const geo = useMemo(() => tube([[-0.055, -0.006, -0.01], [0, 0.008, 0.004], [0.055, -0.004, -0.01]], r), [r]);
  // Ángulo negativo = parte interior elevada.
  const angle = x < 0 ? -face.brow : face.brow;
  return (
    <mesh geometry={geo} position={[x, 3.075 + face.browY, 0.33]} rotation={[0.15, x < 0 ? 0.25 : -0.25, angle]}>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Glasses({ kind }: { kind: Avatar['glasses'] }) {
  if (kind === 'ninguna') return null;
  const round = kind === 'redondas';
  return (
    <group position={[0, 2.98, 0.372]}>
      {[-0.12, 0.12].map((x) =>
        round ? (
          <mesh key={x} position={[x, 0, 0]}>
            <torusGeometry args={[0.08, 0.012, 10, 32]} />
            <meshStandardMaterial color="#1E2A32" roughness={0.3} />
          </mesh>
        ) : (
          <group key={x} position={[x, 0, 0]}>
            {[
              [0, 0.058, 0.17, 0.02],
              [0, -0.058, 0.17, 0.02],
              [0.085, 0, 0.02, 0.135],
              [-0.085, 0, 0.02, 0.135],
            ].map(([px, py, w, h], i) => (
              <mesh key={i} position={[px, py, 0]}>
                <boxGeometry args={[w, h, 0.02]} />
                <meshStandardMaterial color="#1E2A32" roughness={0.3} />
              </mesh>
            ))}
          </group>
        ),
      )}
      <mesh>
        <boxGeometry args={[0.07, 0.014, 0.014]} />
        <meshStandardMaterial color="#1E2A32" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[0.2 * sx, 0.01, -0.17]} rotation={[0, sx * 0.12, 0]}>
          <boxGeometry args={[0.012, 0.012, 0.34]} />
          <meshStandardMaterial color="#1E2A32" />
        </mesh>
      ))}
    </group>
  );
}

// ---------- posturas ----------
type ArmPose = { sx: number; sz: number; ex: number; ez?: number };

/** Postura de los brazos (hombro x/z, codo x/z) en el instante t. Valores del brazo derecho; el izquierdo se refleja. */
function poseFor(mood: Mood, t: number): { L: ArmPose; R: ArmPose; bodyY: number; bodyRotZ: number } {
  const rest: ArmPose = { sx: 0.05, sz: 0.1 + Math.sin(t * 2) * 0.03, ex: -0.15 };
  switch (mood) {
    case 'celebrate':
      return {
        L: { sx: 0, sz: 2.55 + Math.sin(t * 10) * 0.15, ex: 0, ez: 0.3 },
        R: { sx: 0, sz: 2.55 + Math.sin(t * 10 + 1) * 0.15, ex: 0, ez: 0.3 },
        bodyY: Math.abs(Math.sin(t * 5)) * 0.35,
        bodyRotZ: 0,
      };
    case 'caringLow':
      return { L: rest, R: { sx: 0, sz: 2.4, ex: 0, ez: 0.45 + Math.sin(t * 5) * 0.35 }, bodyY: Math.sin(t * 1.5) * 0.02, bodyRotZ: 0 };
    case 'worriedLow':
    case 'worriedHigh':
      // Las dos manos al pecho: "estoy contigo".
      return { L: { sx: -0.55, sz: -0.35, ex: -1.75 }, R: { sx: -0.55, sz: -0.35, ex: -1.75 }, bodyY: Math.sin(t * 1.5) * 0.02, bodyRotZ: 0 };
    case 'caringHigh':
      return { L: { sx: -0.5, sz: -0.3, ex: -1.7 }, R: rest, bodyY: Math.sin(t * 1.5) * 0.02, bodyRotZ: Math.sin(t) * 0.02 };
    case 'attentive':
      // Mano en la barbilla
      return { L: rest, R: { sx: -0.75, sz: -0.3, ex: -2.25 }, bodyY: 0, bodyRotZ: 0 };
    case 'confused':
      // Se rasca la cabeza
      return { L: rest, R: { sx: -0.2, sz: 2.25, ex: 0, ez: 1.5 + Math.sin(t * 8) * 0.12 }, bodyY: 0, bodyRotZ: Math.sin(t * 0.8) * 0.03 };
    case 'remind':
      // Señala hacia arriba, al bocadillo
      return { L: rest, R: { sx: -0.15, sz: 2.65, ex: 0, ez: 0.1 }, bodyY: Math.abs(Math.sin(t * 2.5)) * 0.06, bodyRotZ: 0 };
    case 'sport': {
      const s = Math.sin(t * 9);
      return {
        L: { sx: -0.1 + s * 0.7, sz: 0.15, ex: -1.4 },
        R: { sx: -0.1 - s * 0.7, sz: 0.15, ex: -1.4 },
        bodyY: Math.abs(Math.sin(t * 9)) * 0.12,
        bodyRotZ: s * 0.02,
      };
    }
    case 'sleep':
      return { L: { sx: 0, sz: 0.05, ex: -0.1 }, R: { sx: 0, sz: 0.05, ex: -0.1 }, bodyY: Math.sin(t * 1.2) * 0.015, bodyRotZ: 0 };
    default:
      return { L: rest, R: { ...rest, sz: 0.1 + Math.sin(t * 2 + 0.5) * 0.03 }, bodyY: Math.sin(t * 2) * 0.03, bodyRotZ: 0 };
  }
}

/** Qué mallas se ven según la ropa y el pelo elegidos. */
function visibleFor(name: string, a: Avatar): boolean {
  const long = a.top !== 'camiseta';
  if (name.startsWith('hair_')) return name === `hair_${a.hair}`;
  if (name.startsWith('beard_')) return name === `beard_${a.facialHair}`;
  if (name === 'top_hoodie' || name === 'top_hoodie_detail') return a.top === 'sudadera';
  if (name === 'top_tshirt') return a.top === 'camiseta';
  if (name === 'top_shirt' || name === 'top_shirt_detail') return a.top === 'camisa';
  if (name.startsWith('sleeve_long_')) return long;
  if (name.startsWith('sleeve_short_') || name.startsWith('skin_upper_') || name.startsWith('skin_fore_')) return !long;
  if (name === 'bottom_pants') return a.bottom === 'pantalon';
  if (name === 'bottom_shorts') return a.bottom === 'corto';
  if (name === 'bottom_skirt') return a.bottom === 'falda';
  if (name === 'legs_skin') return a.bottom !== 'pantalon';
  return true;
}

export default function Human({
  avatar,
  mood,
  position = [0, 0, 0],
  facing = 0,
}: {
  avatar: Avatar;
  mood: Mood;
  position?: [number, number, number];
  facing?: number;
}) {
  const gltf = useLoader(GLTFLoader, AVATAR_URL);
  const skin = SKIN_TONES[avatar.skin] ?? SKIN_TONES[0];
  const hairColor = HAIR_COLORS[avatar.hairColor] ?? HAIR_COLORS[0];
  const iris = EYE_COLORS[avatar.eyeColor] ?? EYE_COLORS[0];
  const face = FACES[mood];
  const width = BODY_SCALE[avatar.bodyType];
  const tall = HEIGHT_SCALE[avatar.height];
  const faceScale = FACE_SCALE[avatar.faceShape];
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const blink = useRef(0);
  const nextBlink = useRef(2);

  // Clonamos el modelo; separamos cabeza (piel, pelo, barba) y torso/piernas para escalarlos aparte.
  const { torso, headParts, arms } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const headParts: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o.name === 'skin_head' || o.name.startsWith('hair_') || o.name.startsWith('beard_')) headParts.push(o);
    });
    headParts.forEach((o) => o.removeFromParent());
    const get = (n: string) => scene.getObjectByName(n)!;
    return {
      torso: scene,
      headParts,
      arms: { uL: get('arm_upper_L'), uR: get('arm_upper_R'), fL: get('arm_fore_L'), fR: get('arm_fore_R') },
    };
  }, [gltf]);

  // Materiales y visibilidad según la personalización.
  useEffect(() => {
    const mats = {
      skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.55 }),
      top: new THREE.MeshStandardMaterial({ color: TOP_COLORS[avatar.topColor] ?? TOP_COLORS[0], roughness: 0.85 }),
      white: new THREE.MeshStandardMaterial({ color: avatar.topColor === 6 ? '#D9DDE0' : '#FFFFFF', roughness: 0.6 }),
      bottom: new THREE.MeshStandardMaterial({ color: BOTTOM_COLORS[avatar.bottomColor] ?? BOTTOM_COLORS[0], roughness: 0.85 }),
      shoes: new THREE.MeshStandardMaterial({ color: SHOE_COLORS[avatar.shoes] ?? SHOE_COLORS[0], roughness: 0.5 }),
      soles: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.6 }),
      hair: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.65 }),
    };
    const pick = (n: string): THREE.Material | null => {
      if (n === 'skin_head' || n.startsWith('hand_') || n.startsWith('skin_') || n === 'legs_skin') return mats.skin;
      if (n.endsWith('_detail')) return mats.white;
      if (n.startsWith('top_') || n.startsWith('sleeve_')) return mats.top;
      if (n.startsWith('bottom_')) return mats.bottom;
      if (n === 'shoes') return mats.shoes;
      if (n === 'soles') return mats.soles;
      if (n.startsWith('hair_') || n.startsWith('beard_')) return mats.hair;
      return null;
    };
    const apply = (o: THREE.Object3D) =>
      o.traverse((m) => {
        if (!(m as THREE.Mesh).isMesh) return;
        const mat = pick(m.name);
        if (mat) (m as THREE.Mesh).material = mat;
        m.visible = visibleFor(m.name, avatar);
      });
    apply(torso);
    headParts.forEach(apply);
    return () => Object.values(mats).forEach((m) => m.dispose());
  }, [torso, headParts, skin, hairColor, avatar]);

  // Complexión: ensanchamos torso y piernas, y separamos los hombros.
  useEffect(() => {
    torso.traverse((o) => {
      if (/^(top_|bottom_|legs_skin)/.test(o.name)) o.scale.set(width, 1, 0.5 + width * 0.5);
    });
    const shoulder = 0.44 + (width - 1) * 0.42;
    arms.uL.position.x = -shoulder;
    arms.uR.position.x = shoulder;
    arms.uL.scale.setScalar(0.85 + width * 0.15);
    arms.uR.scale.setScalar(0.85 + width * 0.15);
  }, [torso, arms, width]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    if (!root.current || !head.current) return;
    const p = poseFor(mood, t);
    const k = Math.min(1, dt * 8);
    root.current.position.y = lerp(root.current.position.y, position[1] + p.bodyY, 0.5);
    root.current.rotation.z = lerp(root.current.rotation.z, p.bodyRotZ, k);
    root.current.rotation.y = lerp(root.current.rotation.y, facing + Math.sin(t * 0.6) * 0.05, k);
    arms.uR.rotation.x = lerp(arms.uR.rotation.x, p.R.sx, k);
    arms.uR.rotation.z = lerp(arms.uR.rotation.z, p.R.sz + (width - 1) * 0.15, k);
    arms.fR.rotation.x = lerp(arms.fR.rotation.x, p.R.ex, k);
    arms.fR.rotation.z = lerp(arms.fR.rotation.z, p.R.ez ?? 0, k);
    arms.uL.rotation.x = lerp(arms.uL.rotation.x, p.L.sx, k);
    arms.uL.rotation.z = lerp(arms.uL.rotation.z, -p.L.sz - (width - 1) * 0.15, k);
    arms.fL.rotation.x = lerp(arms.fL.rotation.x, p.L.ex, k);
    arms.fL.rotation.z = lerp(arms.fL.rotation.z, -(p.L.ez ?? 0), k);
    head.current.rotation.z = lerp(head.current.rotation.z, (face.headTilt ?? 0) + Math.sin(t * 0.9) * 0.03, k);
    head.current.rotation.x = lerp(head.current.rotation.x, mood === 'sleep' ? 0.18 : 0, k);
    if (mood === 'sleep') blink.current = 1;
    else if (t > nextBlink.current) {
      const b = (t - nextBlink.current) / 0.16;
      blink.current = b < 1 ? 1 - Math.abs(1 - 2 * b) : 0;
      if (b >= 1) nextBlink.current = t + 2.5 + Math.random() * 3;
    }
  });

  const showMouth = avatar.facialHair !== 'barba' || face.mouth === 'big';
  return (
    <group position={[position[0], 0, position[2]]} scale={tall}>
      <group ref={root}>
        <primitive object={torso} />
        <group ref={head} position={HEAD_PIVOT.toArray()}>
          <group position={HEAD_PIVOT.clone().negate().toArray()}>
            {/* Forma de la cara: escalamos la cabeza alrededor de su centro */}
            <group position={HEAD_CENTER.toArray()} scale={faceScale}>
              <group position={HEAD_CENTER.clone().negate().toArray()}>
                {headParts.map((o: THREE.Object3D) => (
                  <primitive key={o.uuid} object={o} />
                ))}
                <Eye x={-0.12} face={face} skin={skin} iris={iris} blink={blink} />
                <Eye x={0.12} face={face} skin={skin} iris={iris} blink={blink} />
                <Brow x={-0.12} face={face} color={hairColor} r={BROW_R[avatar.brows]} />
                <Brow x={0.12} face={face} color={hairColor} r={BROW_R[avatar.brows]} />
                {showMouth && (
                  <group position={[0, 2.79, avatar.facialHair === 'barba' ? 0.36 : 0.318]}>
                    <Mouth kind={face.mouth} />
                  </group>
                )}
                {[-0.18, 0.18].map((x) => (
                  <mesh key={x} position={[x, 2.86, 0.27]} scale={[1, 0.6, 0.35]}>
                    <sphereGeometry args={[0.065, 14, 10]} />
                    <meshStandardMaterial color="#FF8F80" transparent opacity={mood === 'celebrate' || mood === 'sport' ? 0.5 : 0.28} />
                  </mesh>
                ))}
                <Glasses kind={avatar.glasses} />
                {(avatar.equipped.headband || mood === 'sport') && (
                  <mesh position={[0, 3.16, -0.02]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
                    <torusGeometry args={[0.345, 0.04, 12, 40]} />
                    <meshStandardMaterial color="#FF7A59" roughness={0.6} />
                  </mesh>
                )}
              </group>
            </group>
          </group>
        </group>
        {avatar.equipped.medal && (
          <group position={[0, 2.08, 0.29 * (0.5 + width * 0.5)]}>
            {[-0.08, 0.08].map((x) => (
              <mesh key={x} position={[x, 0.15, -0.02]} rotation={[0, 0, x < 0 ? -0.5 : 0.5]}>
                <boxGeometry args={[0.05, 0.32, 0.015]} />
                <meshStandardMaterial color="#1F8F6C" />
              </mesh>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.03, 28]} />
              <meshStandardMaterial color="#FFD166" metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
