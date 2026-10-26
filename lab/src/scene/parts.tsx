import { useMemo } from 'react';
import * as THREE from 'three';
import { PALETTE as P } from './layout';
import { blobTexture, leafTexture, rng, spineBands } from './textures';

type Vec3 = [number, number, number];

interface BoxProps {
  size: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
  map?: THREE.Texture;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shadow?: boolean;
  /** Brushed metal finish (robot joints, desk legs, frames). */
  metal?: boolean;
}

/** The basic blocky building element of the room. */
export function Box({ size, position, rotation, color = '#ffffff', map, roughness = 0.88, emissive, emissiveIntensity, shadow = true, metal }: BoxProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        map={map}
        roughness={metal ? 0.38 : roughness}
        metalness={metal ? 0.65 : 0}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        flatShading
      />
    </mesh>
  );
}

/** Soft contact shadow on the floor (or any horizontal surface) under an object. */
export function Blob({ position, size, opacity = 1 }: { position: Vec3; size: [number, number]; opacity?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={blobTexture()} transparent opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

export function Cyl({
  r,
  h,
  position,
  rotation,
  color,
  segments = 8,
  rTop,
  metal,
}: {
  r: number;
  h: number;
  position?: Vec3;
  rotation?: Vec3;
  color: string;
  segments?: number;
  rTop?: number;
  metal?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
      <meshStandardMaterial color={color} roughness={metal ? 0.38 : 0.85} metalness={metal ? 0.65 : 0} flatShading />
    </mesh>
  );
}

// --- plants -------------------------------------------------------------------

const LEAVES = ['#5C9A47', '#79AE52', '#3F7A36', '#68A24C', '#4E8A3E'];

interface Leaf {
  pos: Vec3;
  rot: Vec3;
  /** width, length */
  size: [number, number];
  color: number;
}

// One pointed-oval leaf, base at the origin, growing along +z.
const leafGeometry = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.62, 0.38, 0, 1);
  shape.quadraticCurveTo(-0.62, 0.38, 0, 0);
  const g = new THREE.ShapeGeometry(shape, 3);
  g.rotateX(Math.PI / 2);
  return g;
})();

let leafMaterials: THREE.MeshStandardMaterial[] | null = null;
function leafMaterial(i: number) {
  leafMaterials ??= LEAVES.map((c) => new THREE.MeshStandardMaterial({ color: c, map: leafTexture(), roughness: 0.62, side: THREE.DoubleSide }));
  return leafMaterials[i];
}

function bushLeaves(seed: number, count: number, radius: number, height: number, scale = 1): Leaf[] {
  const r = rng(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + r() * 0.7;
    const d = radius * 0.25 * r();
    const y = height * (0.1 + r() * 0.8);
    const len = (0.2 + r() * 0.16) * scale;
    return {
      pos: [Math.cos(a) * d, y, Math.sin(a) * d],
      rot: [-0.35 - r() * 0.75, Math.PI / 2 - a, (r() - 0.5) * 0.5],
      size: [len * 0.7, len],
      color: Math.floor(r() * LEAVES.length),
    };
  });
}

function vineLeaves(seed: number, strands: number, length: number, spread: number): Leaf[] {
  const r = rng(seed);
  const out: Leaf[] = [];
  for (let s = 0; s < strands; s++) {
    const a = r() * Math.PI * 2;
    const x0 = Math.cos(a) * spread;
    const z0 = Math.sin(a) * spread;
    const n = Math.floor(length * (0.5 + r() * 0.5) * 9);
    for (let i = 0; i < n; i++) {
      const sway = Math.sin(i * 0.7 + s) * 0.05;
      out.push({
        pos: [x0 * (1 + i * 0.03) + sway, -i * 0.11, z0 * (1 + i * 0.03)],
        rot: [0.6 + r() * 0.8, r() * Math.PI * 2, (r() - 0.5) * 0.6],
        size: [0.08, 0.12],
        color: Math.floor(r() * LEAVES.length),
      });
    }
  }
  return out;
}

function LeafSet({ leaves }: { leaves: Leaf[] }) {
  return (
    <>
      {leaves.map((l, i) => (
        <mesh
          key={i}
          geometry={leafGeometry}
          material={leafMaterial(l.color)}
          position={l.pos}
          rotation={new THREE.Euler(l.rot[0], l.rot[1], l.rot[2], 'YXZ')}
          scale={[l.size[0] / 0.62, 1, l.size[1]]}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

export function Plant({
  position,
  scale = 1,
  seed = 1,
  kind = 'bush',
  pot = P.terracotta,
}: {
  position: Vec3;
  scale?: number;
  seed?: number;
  kind?: 'bush' | 'trailing' | 'tall' | 'monstera';
  pot?: string;
}) {
  const leaves = useMemo(() => {
    switch (kind) {
      case 'trailing':
        return [...bushLeaves(seed, 14, 0.22, 0.2, 0.8), ...vineLeaves(seed + 5, 5, 1.4, 0.22)];
      case 'tall':
        return bushLeaves(seed, 38, 0.45, 1.4, 1.1);
      case 'monstera':
        return bushLeaves(seed, 16, 0.6, 0.55, 2.3);
      default:
        return bushLeaves(seed, 22, 0.3, 0.3);
    }
  }, [kind, seed]);
  const potH = kind === 'tall' || kind === 'monstera' ? 0.5 : 0.3;
  const potR = kind === 'tall' || kind === 'monstera' ? 0.32 : 0.2;
  return (
    <group position={position} scale={scale}>
      <Blob position={[0, 0.004, 0]} size={[potR * 4.2, potR * 4.2]} opacity={0.8} />
      <Cyl r={potR * 0.82} rTop={potR} h={potH} position={[0, potH / 2, 0]} color={pot} segments={10} />
      <Cyl r={potR * 1.04} h={0.06} position={[0, potH - 0.03, 0]} color={pot} />
      <Cyl r={potR * 0.9} h={0.02} position={[0, potH - 0.01, 0]} color="#5A3D30" />
      <group position={[0, potH, 0]}>
        <LeafSet leaves={leaves} />
        {kind === 'tall' && <Cyl r={0.025} h={1.2} position={[0, 0.6, 0]} color="#6B5A3E" segments={5} />}
      </group>
    </group>
  );
}

/** Vines hanging from a shelf edge. */
export function Vines({ position, seed = 3, strands = 4, length = 1.6 }: { position: Vec3; seed?: number; strands?: number; length?: number }) {
  const leaves = useMemo(() => vineLeaves(seed, strands, length, 0.12), [seed, strands, length]);
  return (
    <group position={position}>
      <LeafSet leaves={leaves} />
    </group>
  );
}

// --- books --------------------------------------------------------------------

const BOOK_COLORS = [P.burgundy, P.raspberry, '#2E3550', '#F2E8D8', '#F7F5F2', '#D99AAD', '#7A1E43', '#3C4A6B', '#E8C9A8'];

/** A row of standing books along local +x, starting at the origin, sitting on y=0. */
export function Books({ length, seed = 1, maxH = 0.6, depth = 0.4, lean = true }: { length: number; seed?: number; maxH?: number; depth?: number; lean?: boolean }) {
  const books = useMemo(() => {
    const r = rng(seed);
    const out: { x: number; w: number; h: number; d: number; color: string; tilt: number }[] = [];
    let x = 0;
    while (x < length) {
      const w = 0.07 + r() * 0.07;
      if (x + w > length) break;
      const h = maxH * (0.72 + r() * 0.28);
      out.push({ x: x + w / 2, w, h, d: depth * (0.85 + r() * 0.15), color: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)], tilt: 0 });
      x += w + 0.005;
    }
    if (lean && out.length > 3) {
      const last = out[out.length - 1];
      last.tilt = -0.25;
      last.x += 0.06;
    }
    return out;
  }, [length, seed, maxH, depth, lean]);
  const bands = spineBands();
  return (
    <>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, 0]} rotation={[0, 0, b.tilt]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} map={bands} roughness={0.85} flatShading />
        </mesh>
      ))}
    </>
  );
}
