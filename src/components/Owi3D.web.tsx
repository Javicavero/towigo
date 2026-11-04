/**
 * Owi en 3D (web). Carga el cuerpo esculpido (assets/owi/owi.glb) y le añade en tiempo
 * real la cara (ojos, párpados, cejas, boca), los accesorios y la animación de cada
 * estado de ánimo. El Owi definitivo de un diseñador debe respetar los nombres de nodos
 * del GLB (ver docs/OWI_MODELO.md) para sustituirlo sin tocar este código.
 */
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { OwiProps } from './Owi3D.types';
import { HAIR_COLORS, HOODIE_COLORS, SHOE_COLORS, SKIN_TONES } from '../data/avatarOptions';
import type { Mood } from '../state/types';

const OWI_URL = Asset.fromModule(require('../../assets/owi/owi.glb')).uri;
const PANTS = '#2E3A44';
const HEAD_PIVOT = new THREE.Vector3(0, 2.5, 0);

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

// ---------- utilidades de geometría ----------
function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.3);
  s.bezierCurveTo(-0.05, -0.2, -0.35, -0.05, -0.35, 0.12);
  s.bezierCurveTo(-0.35, 0.3, -0.12, 0.36, 0, 0.2);
  s.bezierCurveTo(0.12, 0.36, 0.35, 0.3, 0.35, 0.12);
  s.bezierCurveTo(0.35, -0.05, 0.05, -0.2, 0, -0.3);
  return s;
}

function textTexture(text: string, color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.font = '800 104px Nunito_800ExtraBold, Nunito, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function tube(points: [number, number, number][], r: number) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, 24, r, 8, false);
}

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

function Eye({ x, face, skin, blink }: { x: number; face: Face; skin: string; blink: React.RefObject<number> }) {
  const upper = useRef<THREE.Mesh>(null);
  const lower = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // Párpado superior: rota hacia abajo para cerrar. lid 0 = abierto, 1 = cerrado.
    const lid = Math.max(face.lid, blink.current ?? 0);
    if (upper.current) upper.current.rotation.x = -1.35 + lid * 1.45;
    if (lower.current) lower.current.rotation.x = 1.6 - (face.lowerLid ?? 0) * 0.9;
  });
  return (
    <group position={[x, 2.977, 0.302]}>
      <mesh scale={[1, 1.08, 0.9]}>
        <sphereGeometry args={[0.062, 28, 20]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.05]} scale={[1, 1, 0.35]}>
        <sphereGeometry args={[0.037, 24, 16]} />
        <meshStandardMaterial color="#5A3A22" roughness={0.25} />
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

function Brow({ x, face, color }: { x: number; face: Face; color: string }) {
  const geo = useMemo(() => tube([[-0.055, -0.006, -0.01], [0, 0.008, 0.004], [0.055, -0.004, -0.01]], 0.013), []);
  // Ángulo negativo = parte interior elevada (gesto de preocupación cariñosa).
  const angle = x < 0 ? -face.brow : face.brow;
  return (
    <mesh geometry={geo} position={[x, 3.075 + face.browY, 0.33]} rotation={[0.15, x < 0 ? 0.25 : -0.25, angle]}>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Heart({ big }: { big: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const shape = useMemo(heartShape, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = 3.5 + Math.sin(t * 2) * 0.06;
    const s = (big ? 0.95 : 0.7) * (1 + Math.sin(t * (big ? 6 : 4)) * 0.06);
    ref.current.scale.set(s, s, s);
    ref.current.rotation.y = Math.sin(t) * 0.4;
  });
  return (
    <group ref={ref} position={[0.62, 3.5, 0.2]}>
      <mesh position={[0, 0, -0.06]}>
        <extrudeGeometry args={[shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }]} />
        <meshStandardMaterial color="#FF7A59" roughness={0.35} />
      </mesh>
    </group>
  );
}

function Floating({ text, color, count = 1 }: { text: string; color: string; count?: number }) {
  const tex = useMemo(() => textTexture(text, color), [text, color]);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((s, i) => {
      if (!s) return;
      const k = (((t * 0.35 + i / count) % 1) + 1) % 1;
      s.position.set(0.45 + k * 0.3, 3.3 + k * 0.45, 0.1);
      const sc = 0.22 + k * 0.18;
      s.scale.set(sc, sc, sc);
      (s.material as THREE.SpriteMaterial).opacity = count > 1 ? Math.sin(k * Math.PI) : 1;
    });
  });
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <spriteMaterial map={tex} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

const CONFETTI_COLORS = ['#2BB58A', '#FF7A59', '#FFD166', '#1F8F6C', '#FFFFFF'];

function Confetti() {
  const count = 80;
  const ref = useRef<THREE.InstancedMesh>(null);
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 4 + 1,
        z: (Math.random() - 0.5) * 2,
        v: 0.6 + Math.random() * 0.9,
        r: Math.random() * Math.PI,
        rv: (Math.random() - 0.5) * 6,
      })),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!ref.current) return;
    const c = new THREE.Color();
    parts.forEach((_, i) => ref.current!.setColorAt(i, c.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length])));
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [parts]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    parts.forEach((p, i) => {
      p.y -= p.v * dt;
      p.r += p.rv * dt;
      if (p.y < -0.2) {
        p.y = 4.6;
        p.x = (Math.random() - 0.5) * 4;
      }
      dummy.position.set(p.x + Math.sin(p.y * 2 + i) * 0.1, p.y, p.z);
      dummy.rotation.set(p.r, p.r * 0.7, 0);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.09, 0.14]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.6} />
    </instancedMesh>
  );
}

// ---------- posturas ----------
type ArmPose = { sx: number; sz: number; ex: number; ez?: number };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

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

function Character({ avatar, mood, rotation }: OwiProps & { rotation: React.RefObject<number> }) {
  const gltf = useLoader(GLTFLoader, OWI_URL);
  const skin = SKIN_TONES[avatar.skin] ?? SKIN_TONES[0];
  const hairColor = HAIR_COLORS[avatar.hairColor] ?? HAIR_COLORS[0];
  const hoodie = HOODIE_COLORS[avatar.hoodie] ?? HOODIE_COLORS[0];
  const shoes = SHOE_COLORS[avatar.shoes] ?? SHOE_COLORS[0];
  const face = FACES[mood];
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const blink = useRef(0);
  const nextBlink = useRef(2);

  // Clonamos el modelo y separamos la cabeza (piel + pelo) en su propio grupo para poder inclinarla.
  const { body, headParts, arms } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const headParts: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o.name === 'skin_head' || o.name.startsWith('hair_')) headParts.push(o);
    });
    headParts.forEach((o) => o.removeFromParent());
    const get = (n: string) => scene.getObjectByName(n)!;
    return {
      body: scene,
      headParts,
      arms: { uL: get('arm_upper_L'), uR: get('arm_upper_R'), fL: get('arm_fore_L'), fR: get('arm_fore_R') },
    };
  }, [gltf]);

  // Materiales según la personalización.
  useEffect(() => {
    const mats = {
      skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.55 }),
      hoodie: new THREE.MeshStandardMaterial({ color: hoodie, roughness: 0.85 }),
      white: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.6 }),
      pants: new THREE.MeshStandardMaterial({ color: PANTS, roughness: 0.85 }),
      shoes: new THREE.MeshStandardMaterial({ color: shoes, roughness: 0.5 }),
      hair: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.65 }),
    };
    const pick = (n: string): THREE.Material | null => {
      if (n === 'skin_head' || n.startsWith('hand_')) return mats.skin;
      if (n === 'hoodie' || n.startsWith('arm_')) return mats.hoodie;
      if (n === 'hoodie_detail' || n === 'soles') return mats.white;
      if (n === 'pants') return mats.pants;
      if (n === 'shoes') return mats.shoes;
      if (n.startsWith('hair_')) return mats.hair;
      return null;
    };
    const apply = (o: THREE.Object3D) =>
      o.traverse((m) => {
        if (!(m as THREE.Mesh).isMesh) return;
        const mat = pick(m.name);
        if (mat) (m as THREE.Mesh).material = mat;
        if (m.name.startsWith('hair_')) m.visible = m.name === `hair_${avatar.hair}`;
      });
    apply(body);
    headParts.forEach(apply);
    return () => Object.values(mats).forEach((m) => m.dispose());
  }, [body, headParts, skin, hoodie, shoes, hairColor, avatar.hair]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    if (!root.current || !head.current) return;
    const p = poseFor(mood, t);
    const k = Math.min(1, dt * 8); // transición suave entre posturas
    root.current.rotation.y = (rotation.current ?? 0) + Math.sin(t * 0.6) * 0.06;
    root.current.position.y = lerp(root.current.position.y, p.bodyY, 0.5);
    root.current.rotation.z = lerp(root.current.rotation.z, p.bodyRotZ, k);
    // Brazo derecho tal cual; el izquierdo, reflejado.
    arms.uR.rotation.x = lerp(arms.uR.rotation.x, p.R.sx, k);
    arms.uR.rotation.z = lerp(arms.uR.rotation.z, p.R.sz, k);
    arms.fR.rotation.x = lerp(arms.fR.rotation.x, p.R.ex, k);
    arms.fR.rotation.z = lerp(arms.fR.rotation.z, p.R.ez ?? 0, k);
    arms.uL.rotation.x = lerp(arms.uL.rotation.x, p.L.sx, k);
    arms.uL.rotation.z = lerp(arms.uL.rotation.z, -p.L.sz, k);
    arms.fL.rotation.x = lerp(arms.fL.rotation.x, p.L.ex, k);
    arms.fL.rotation.z = lerp(arms.fL.rotation.z, -(p.L.ez ?? 0), k);
    head.current.rotation.z = lerp(head.current.rotation.z, (face.headTilt ?? 0) + Math.sin(t * 0.9) * 0.03, k);
    head.current.rotation.x = lerp(head.current.rotation.x, mood === 'sleep' ? 0.18 : mood === 'attentive' ? -0.06 : 0, k);
    // Parpadeo natural
    if (mood === 'sleep') blink.current = 1;
    else if (t > nextBlink.current) {
      const b = (t - nextBlink.current) / 0.16;
      blink.current = b < 1 ? 1 - Math.abs(1 - 2 * b) : 0;
      if (b >= 1) nextBlink.current = t + 2.5 + Math.random() * 3;
    }
  });

  return (
    <group ref={root}>
      <primitive object={body} />
      <group ref={head} position={HEAD_PIVOT.toArray()}>
        <group position={HEAD_PIVOT.clone().negate().toArray()}>
          {headParts.map((o: THREE.Object3D) => (
            <primitive key={o.uuid} object={o} />
          ))}
          <Eye x={-0.12} face={face} skin={skin} blink={blink} />
          <Eye x={0.12} face={face} skin={skin} blink={blink} />
          <Brow x={-0.12} face={face} color={hairColor} />
          <Brow x={0.12} face={face} color={hairColor} />
          <group position={[0, 2.79, 0.318]}>
            <Mouth kind={face.mouth} />
          </group>
          {[-0.18, 0.18].map((x) => (
            <mesh key={x} position={[x, 2.86, 0.27]} scale={[1, 0.6, 0.35]}>
              <sphereGeometry args={[0.065, 14, 10]} />
              <meshStandardMaterial color="#FF8F80" transparent opacity={mood === 'celebrate' || mood === 'sport' ? 0.55 : 0.32} />
            </mesh>
          ))}
          {avatar.equipped.glasses && (
            <group position={[0, 2.98, 0.375]}>
              {[-0.12, 0.12].map((x) => (
                <mesh key={x} position={[x, 0, 0]}>
                  <torusGeometry args={[0.078, 0.012, 10, 32]} />
                  <meshStandardMaterial color="#1E2A32" roughness={0.3} />
                </mesh>
              ))}
              <mesh>
                <boxGeometry args={[0.08, 0.014, 0.014]} />
                <meshStandardMaterial color="#1E2A32" />
              </mesh>
            </group>
          )}
          {(avatar.equipped.headband || mood === 'sport') && (
            <mesh position={[0, 3.16, -0.02]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
              <torusGeometry args={[0.345, 0.04, 12, 40]} />
              <meshStandardMaterial color="#FF7A59" roughness={0.6} />
            </mesh>
          )}
        </group>
      </group>
      {avatar.equipped.medal && (
        <group position={[0, 2.08, 0.29]}>
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
      {(mood === 'caringLow' || mood === 'worriedLow' || mood === 'caringHigh' || mood === 'worriedHigh') && (
        <Heart big={mood === 'worriedLow' || mood === 'worriedHigh'} />
      )}
      {mood === 'sleep' && <Floating text="Z" color="#4A5A63" count={3} />}
      {mood === 'confused' && <Floating text="?" color="#B8432A" />}
    </group>
  );
}

function LookAt() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 2.3, 0);
  }, [camera]);
  return null;
}

export default function Owi3D({ avatar, mood, height = 260, interactive = true, accessibilityLabel }: OwiProps) {
  const rotation = useRef(0);
  const drag = useRef<{ x: number; start: number } | null>(null);
  return (
    <div
      role="img"
      aria-label={accessibilityLabel}
      style={{ width: '100%', height, touchAction: 'pan-y', cursor: interactive ? 'grab' : 'default' }}
      onPointerDown={(e) => {
        if (!interactive) return;
        drag.current = { x: e.clientX, start: rotation.current };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        rotation.current = drag.current.start + (e.clientX - drag.current.x) * 0.012;
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2.6, 6.0], fov: 30 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: 'transparent' }}
      >
        <LookAt />
        <hemisphereLight args={['#FFFFFF', '#FFD9C2', 1.5]} />
        <directionalLight position={[2.5, 5, 6]} intensity={2.1} />
        <directionalLight position={[-4, 3, -4]} intensity={1.1} color="#BFE9FF" />
        <Suspense fallback={null}>
          <Character avatar={avatar} mood={mood} rotation={rotation} />
        </Suspense>
        {mood === 'celebrate' && <Confetti />}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[0.75, 32]} />
          <meshBasicMaterial color="#1E2A32" transparent opacity={0.08} />
        </mesh>
      </Canvas>
    </div>
  );
}
