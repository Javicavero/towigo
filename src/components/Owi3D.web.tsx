/**
 * Owi en 3D (versión web del prototipo), hecho con primitivas de Three.js
 * a través de React Three Fiber. En la app final lo sustituirá un modelo
 * glTF de un diseñador 3D, conservando estas mismas propiedades.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { OwiProps } from './Owi3D.types';
import { HAIR_COLORS, HOODIE_COLORS, SHOE_COLORS, SKIN_TONES } from '../data/avatarOptions';

const PANTS = '#2E3A44';

function Mat({ color, rough = 0.75 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} />;
}

function Hair({ style, color }: { style: OwiProps['avatar']['hair']; color: string }) {
  const capTheta = style === 'rapado' ? Math.PI * 0.36 : Math.PI * 0.5;
  const capR = style === 'rapado' ? 0.565 : 0.6;
  const cap = (
    <mesh position={[0, 0.04, -0.03]} rotation={[-0.25, 0, 0]}>
      <sphereGeometry args={[capR, 32, 16, 0, Math.PI * 2, 0, capTheta]} />
      <Mat color={color} />
    </mesh>
  );
  if (style === 'rizos') {
    const curls: [number, number, number][] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const ring = i % 2 === 0 ? 0.5 : 0.36;
      curls.push([Math.cos(a) * ring, 0.32 + (i % 2 === 0 ? 0 : 0.18), Math.sin(a) * ring - 0.06]);
    }
    return (
      <group>
        {cap}
        {curls.map((p, i) =>
          p[2] > 0.42 ? null : (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.15, 12, 10]} />
              <Mat color={color} />
            </mesh>
          ),
        )}
        <mesh position={[0, 0.55, -0.05]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <Mat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === 'melena') {
    return (
      <group>
        {cap}
        <mesh position={[0, -0.28, -0.2]} scale={[1.08, 1.25, 0.75]}>
          <sphereGeometry args={[0.55, 24, 16]} />
          <Mat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === 'mono') {
    return (
      <group>
        {cap}
        <mesh position={[0, 0.5, -0.32]}>
          <sphereGeometry args={[0.24, 20, 14]} />
          <Mat color={color} />
        </mesh>
      </group>
    );
  }
  return cap; // corto y rapado
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

function Heart() {
  const ref = useRef<THREE.Group>(null);
  const shape = useMemo(heartShape, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = 3.55 + Math.sin(t * 2) * 0.08;
    const s = 1 + Math.sin(t * 4) * 0.06;
    ref.current.scale.set(s, s, s);
    ref.current.rotation.y = Math.sin(t) * 0.4;
  });
  return (
    <group ref={ref} position={[0.75, 3.55, 0.2]}>
      <mesh position={[0, 0, -0.06]}>
        <extrudeGeometry args={[shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 }]} />
        <meshStandardMaterial color="#FF7A59" roughness={0.4} />
      </mesh>
    </group>
  );
}

const CONFETTI_COLORS = ['#2BB58A', '#FF7A59', '#FFD166', '#1F8F6C', '#FFFFFF'];

function Confetti() {
  const count = 70;
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

function Character({ avatar, mood, rotation }: OwiProps & { rotation: React.RefObject<number> }) {
  const root = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const skin = SKIN_TONES[avatar.skin] ?? SKIN_TONES[0];
  const hairColor = HAIR_COLORS[avatar.hairColor] ?? HAIR_COLORS[0];
  const hoodie = HOODIE_COLORS[avatar.hoodie] ?? HOODIE_COLORS[0];
  const shoes = SHOE_COLORS[avatar.shoes] ?? SHOE_COLORS[0];
  const nextBlink = useRef(2);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!root.current || !armL.current || !armR.current || !eyes.current) return;
    // Rotación: la del arrastre del usuario más un leve balanceo.
    root.current.rotation.y = (rotation.current ?? 0) + Math.sin(t * 0.6) * 0.08;
    if (mood === 'celebrate') {
      root.current.position.y = Math.abs(Math.sin(t * 5)) * 0.35;
      armL.current.rotation.z = -2.35 - Math.sin(t * 10) * 0.15;
      armR.current.rotation.z = 2.35 + Math.sin(t * 10) * 0.15;
    } else if (mood === 'concern') {
      root.current.position.y = Math.sin(t * 1.5) * 0.03;
      armL.current.rotation.z = -0.12;
      armR.current.rotation.z = 2.0 + Math.sin(t * 5) * 0.3; // saluda con cariño
    } else {
      root.current.position.y = Math.sin(t * 2) * 0.04;
      armL.current.rotation.z = -0.12 - Math.sin(t * 2) * 0.04;
      armR.current.rotation.z = 0.12 + Math.sin(t * 2) * 0.04;
    }
    // Parpadeo
    if (t > nextBlink.current) {
      const k = (t - nextBlink.current) / 0.14;
      eyes.current.scale.y = k < 1 ? Math.max(0.1, Math.abs(1 - 2 * k)) : 1;
      if (k >= 1) nextBlink.current = t + 2 + Math.random() * 3;
    }
  });

  const happyMouth = mood !== 'concern';
  return (
    <group ref={root}>
      {/* Piernas y zapatillas */}
      {[-0.22, 0.22].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.55, 0]}>
            <cylinderGeometry args={[0.17, 0.15, 0.8, 16]} />
            <Mat color={PANTS} />
          </mesh>
          <mesh position={[x, 0.1, 0.08]} scale={[1, 0.7, 1.5]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <Mat color={shoes} rough={0.5} />
          </mesh>
          <mesh position={[x, 0.02, 0.08]} scale={[1.05, 0.25, 1.55]}>
            <sphereGeometry args={[0.2, 16, 8]} />
            <Mat color="#FFFFFF" rough={0.5} />
          </mesh>
        </group>
      ))}
      {/* Sudadera */}
      <mesh position={[0, 1.42, 0]}>
        <capsuleGeometry args={[0.52, 0.5, 8, 20]} />
        <Mat color={hoodie} />
      </mesh>
      <mesh position={[0, 1.95, -0.22]} scale={[1, 0.6, 0.7]}>
        <torusGeometry args={[0.32, 0.12, 12, 24]} />
        <Mat color={hoodie} />
      </mesh>
      {/* Bolsillo */}
      <mesh position={[0, 1.18, 0.47]} scale={[1, 0.5, 0.2]}>
        <sphereGeometry args={[0.3, 16, 10]} />
        <Mat color={hoodie} rough={0.9} />
      </mesh>
      {/* Cordones de la capucha */}
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 1.75, 0.5]}>
          <cylinderGeometry args={[0.02, 0.02, 0.32, 6]} />
          <Mat color="#FFFFFF" />
        </mesh>
      ))}
      {/* Brazos con pivote en el hombro */}
      <group ref={armL} position={[-0.58, 1.82, 0]}>
        <mesh position={[0, -0.42, 0]}>
          <capsuleGeometry args={[0.14, 0.55, 6, 12]} />
          <Mat color={hoodie} />
        </mesh>
        <mesh position={[0, -0.86, 0]}>
          <sphereGeometry args={[0.14, 14, 12]} />
          <Mat color={skin} />
        </mesh>
      </group>
      <group ref={armR} position={[0.58, 1.82, 0]}>
        <mesh position={[0, -0.42, 0]}>
          <capsuleGeometry args={[0.14, 0.55, 6, 12]} />
          <Mat color={hoodie} />
        </mesh>
        <mesh position={[0, -0.86, 0]}>
          <sphereGeometry args={[0.14, 14, 12]} />
          <Mat color={skin} />
        </mesh>
      </group>
      {/* Cuello y cabeza */}
      <mesh position={[0, 2.02, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.2, 14]} />
        <Mat color={skin} />
      </mesh>
      <group position={[0, 2.6, 0]}>
        <mesh>
          <sphereGeometry args={[0.55, 32, 24]} />
          <Mat color={skin} rough={0.6} />
        </mesh>
        {/* Orejas */}
        {[-0.54, 0.54].map((x) => (
          <mesh key={x} position={[x, -0.02, 0]} scale={[0.5, 1, 0.8]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <Mat color={skin} />
          </mesh>
        ))}
        <Hair style={avatar.hair} color={hairColor} />
        {/* Ojos */}
        <group ref={eyes} position={[0, 0.04, 0]}>
          {[-0.19, 0.19].map((x) => (
            <group key={x}>
              <mesh position={[x, 0, 0.5]}>
                <sphereGeometry args={[0.075, 16, 12]} />
                <meshStandardMaterial color="#1E2A32" roughness={0.3} />
              </mesh>
              <mesh position={[x + 0.025, 0.03, 0.565]}>
                <sphereGeometry args={[0.022, 8, 6]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </group>
          ))}
        </group>
        {/* Cejas: en preocupación se elevan por dentro (gesto cariñoso, no enfadado) */}
        {[-0.19, 0.19].map((x) => (
          <mesh
            key={x}
            position={[x, 0.2, 0.5]}
            rotation={[0, 0, mood === 'concern' ? (x < 0 ? -0.35 : 0.35) : x < 0 ? 0.1 : -0.1]}
          >
            <capsuleGeometry args={[0.022, 0.12, 4, 8]} />
            <Mat color={hairColor} />
          </mesh>
        ))}
        {/* Mejillas */}
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, -0.12, 0.44]} scale={[1, 0.6, 0.3]}>
            <sphereGeometry args={[0.08, 12, 8]} />
            <meshStandardMaterial color="#FF9A86" transparent opacity={0.55} />
          </mesh>
        ))}
        {/* Boca */}
        {mood === 'celebrate' ? (
          <mesh position={[0, -0.17, 0.48]} rotation={[0.2, 0, 0]} scale={[1, 0.8, 0.5]}>
            <sphereGeometry args={[0.12, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color="#8C2F2F" side={THREE.DoubleSide} />
          </mesh>
        ) : (
          // En preocupación: sonrisa pequeña y suave (cariño, nunca reproche).
          <mesh position={[0, happyMouth ? -0.1 : -0.13, 0.51]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[happyMouth ? 0.14 : 0.075, 0.025, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#1E2A32" />
          </mesh>
        )}
        {/* Accesorios */}
        {avatar.equipped.glasses && (
          <group position={[0, 0.04, 0.55]}>
            {[-0.19, 0.19].map((x) => (
              <mesh key={x} position={[x, 0, 0]}>
                <torusGeometry args={[0.13, 0.022, 8, 24]} />
                <meshStandardMaterial color="#1E2A32" />
              </mesh>
            ))}
            <mesh>
              <boxGeometry args={[0.12, 0.025, 0.025]} />
              <meshStandardMaterial color="#1E2A32" />
            </mesh>
          </group>
        )}
        {avatar.equipped.headband && (
          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
            <torusGeometry args={[0.52, 0.06, 10, 32]} />
            <meshStandardMaterial color="#FF7A59" roughness={0.6} />
          </mesh>
        )}
      </group>
      {avatar.equipped.medal && (
        <group position={[0, 1.6, 0.5]}>
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, 0.18, 0]} rotation={[0, 0, x < 0 ? -0.5 : 0.5]}>
              <boxGeometry args={[0.07, 0.4, 0.02]} />
              <meshStandardMaterial color="#2BB58A" />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
            <meshStandardMaterial color="#FFD166" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      )}
      {mood === 'concern' && <Heart />}
    </group>
  );
}

function LookAt() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 1.75, 0);
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
        camera={{ position: [0, 2.0, 6.6], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <LookAt />
        <ambientLight intensity={1.1} />
        <hemisphereLight args={['#FFFFFF', '#FFE2CC', 0.8]} />
        <directionalLight position={[3, 6, 5]} intensity={1.6} />
        <directionalLight position={[-4, 2, -2]} intensity={0.5} />
        <Character avatar={avatar} mood={mood} rotation={rotation} />
        {mood === 'celebrate' && <Confetti />}
        {/* Sombra suave en el suelo */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshBasicMaterial color="#1E2A32" transparent opacity={0.08} />
        </mesh>
      </Canvas>
    </div>
  );
}
