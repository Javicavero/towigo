/** Piezas 3D compartidas por el avatar y por Owi (corazón, confeti, letras flotantes...). */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function tube(points: [number, number, number][], r: number) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, 24, r, 8, false);
}

export function textTexture(text: string, color: string) {
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

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.3);
  s.bezierCurveTo(-0.05, -0.2, -0.35, -0.05, -0.35, 0.12);
  s.bezierCurveTo(-0.35, 0.3, -0.12, 0.36, 0, 0.2);
  s.bezierCurveTo(0.12, 0.36, 0.35, 0.3, 0.35, 0.12);
  s.bezierCurveTo(0.35, -0.05, 0.05, -0.2, 0, -0.3);
  return s;
}

/** Corazón que late. `at` es la posición base; `size` su escala. */
export function Heart({ at, size = 1, fast = false }: { at: [number, number, number]; size?: number; fast?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const shape = useMemo(heartShape, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = at[1] + Math.sin(t * 2) * 0.05;
    const s = size * (1 + Math.sin(t * (fast ? 7 : 4)) * 0.07);
    ref.current.scale.set(s, s, s);
    ref.current.rotation.y = Math.sin(t) * 0.4;
  });
  return (
    <group ref={ref} position={at}>
      <mesh position={[0, 0, -0.06]}>
        <extrudeGeometry args={[shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }]} />
        <meshStandardMaterial color="#FF6B6B" roughness={0.35} />
      </mesh>
    </group>
  );
}

/** Letras que flotan y suben (Zzz, ?, !). */
export function Floating({ text, color, at, count = 1, size = 0.3 }: { text: string; color: string; at: [number, number, number]; count?: number; size?: number }) {
  const tex = useMemo(() => textTexture(text, color), [text, color]);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((s, i) => {
      if (!s) return;
      if (count === 1) {
        // Un solo símbolo: rebota en su sitio.
        s.position.set(at[0], at[1] + Math.abs(Math.sin(t * 4)) * 0.12, at[2]);
        const sc = size * (1 + Math.sin(t * 8) * 0.05);
        s.scale.set(sc, sc, sc);
        return;
      }
      const k = (((t * 0.35 + i / count) % 1) + 1) % 1;
      s.position.set(at[0] + k * 0.3, at[1] + k * 0.45, at[2]);
      const sc = size * (0.7 + k * 0.6);
      s.scale.set(sc, sc, sc);
      (s.material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI);
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

const CONFETTI_COLORS = ['#2BB58A', '#FF7A59', '#FFD166', '#4C8DFF', '#FFFFFF', '#B57BFF'];

export function Confetti({ width = 4, top = 4.6 }: { width?: number; top?: number }) {
  const count = 90;
  const ref = useRef<THREE.InstancedMesh>(null);
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * width,
        y: Math.random() * top,
        z: (Math.random() - 0.5) * 2,
        v: 0.6 + Math.random() * 0.9,
        r: Math.random() * Math.PI,
        rv: (Math.random() - 0.5) * 6,
      })),
    [width, top],
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
        p.y = top;
        p.x = (Math.random() - 0.5) * width;
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
