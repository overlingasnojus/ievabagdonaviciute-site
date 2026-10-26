import { useMemo } from 'react';
import * as THREE from 'three';
import { CABINET, DESK, PALETTE as P, ROOM, RUG, WINDOW } from './layout';
import { Blob, Books, Box, Cyl, Plant, Vines } from './parts';
import { floorTexture, keyboardTexture, pawTexture, posterTexture, posterTexture2, rugTexture, seamTexture, wallOuterTexture, wallTexture } from './textures';
import { WindowView } from './WindowView';

// The static shell and furniture of the lab. Interactive objects live in their own
// components; this file is everything you look at but don't click.

const { W, D, H, wall, floor } = ROOM;

function repeated(tex: THREE.Texture, x: number, y: number) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(x, y);
  t.needsUpdate = true;
  return t;
}

/** Box with a texture on one face and plain colour elsewhere. Face order: +x −x +y −y +z −z. */
function FacedBox({ size, position, face, map, color, rotation }: { size: [number, number, number]; position: [number, number, number]; face: number; map: THREE.Texture; color: string; rotation?: [number, number, number] }) {
  const materials = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) =>
        i === face ? new THREE.MeshStandardMaterial({ map, roughness: 0.92 }) : new THREE.MeshStandardMaterial({ color, roughness: 0.92 }),
      ),
    [face, map, color],
  );
  return (
    <mesh position={position} rotation={rotation} material={materials} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** Soft ambient-occlusion strip; darkest along its local −y edge. Euler order YXZ. */
function Seam({ position, rotation, size }: { position: [number, number, number]; rotation: [number, number, number]; size: [number, number] }) {
  return (
    <mesh position={position} rotation={new THREE.Euler(rotation[0], rotation[1], rotation[2], 'YXZ')} renderOrder={1}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={seamTexture()} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

function Occlusion() {
  // Where floor meets walls and walls meet each other, light can't quite reach.
  const L = 2 * D;
  return (
    <group>
      <Seam position={[-W + 0.35, 0.003, 0]} rotation={[-Math.PI / 2, -Math.PI / 2, 0]} size={[L, 0.7]} />
      <Seam position={[0, 0.003, -D + 0.35]} rotation={[-Math.PI / 2, Math.PI, 0]} size={[2 * W, 0.7]} />
      <Seam position={[-W + 0.004, 0.45, 0]} rotation={[0, Math.PI / 2, 0]} size={[L, 0.9]} />
      <Seam position={[0, 0.45, -D + 0.004]} rotation={[0, 0, 0]} size={[2 * W, 0.9]} />
      <Seam position={[-W + 0.004, H / 2, -D + 0.3]} rotation={[0, Math.PI / 2, -Math.PI / 2]} size={[H, 0.6]} />
      <Seam position={[-W + 0.3, H / 2, -D + 0.004]} rotation={[0, 0, Math.PI / 2]} size={[H, 0.6]} />
    </group>
  );
}

function Shell() {
  const wallTex = wallTexture();
  const outer = wallOuterTexture();
  const boardsPerUnit = 3.2 / 4; // texture holds 4 boards
  const leftLen = 2 * D + wall;
  const backPieces = useMemo(() => {
    const x0 = -W - wall;
    return [
      { x0, x1: WINDOW.x0, y0: 0, y1: H },
      { x0: WINDOW.x1, x1: W, y0: 0, y1: H },
      { x0: WINDOW.x0, x1: WINDOW.x1, y0: 0, y1: WINDOW.y0 },
      { x0: WINDOW.x0, x1: WINDOW.x1, y0: WINDOW.y1, y1: H },
    ];
  }, []);

  return (
    <group>
      {/* floor slab */}
      <mesh position={[-wall / 2, -floor / 2, -wall / 2]} receiveShadow>
        <boxGeometry args={[2 * W + wall, floor, 2 * D + wall]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            map={i === 2 ? floorTexture() : undefined}
            color={i === 2 ? '#ffffff' : '#E9CFC8'}
            roughness={0.95}
          />
        ))}
      </mesh>
      <Box size={[2 * W + wall, 0.04, 0.06]} position={[-wall / 2, -0.02, D - 0.03]} color="#E2C0BC" shadow={false} />
      <Box size={[0.06, 0.04, 2 * D + wall]} position={[W - 0.03, -0.02, -wall / 2]} color="#E2C0BC" shadow={false} />

      {/* left wall (x = -W) */}
      <FacedBox
        size={[wall, H, leftLen]}
        position={[-W - wall / 2, H / 2, -wall / 2]}
        face={0}
        map={repeated(wallTex, leftLen * boardsPerUnit, 1)}
        color="#EBC4CF"
      />
      <mesh position={[-W - wall - 0.001, H / 2, -wall / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[leftLen, H]} />
        <meshStandardMaterial map={outer} />
      </mesh>

      {/* window wall (z = -D), built around the window opening */}
      {backPieces.map((p, i) => {
        const w = p.x1 - p.x0;
        const h = p.y1 - p.y0;
        const tex = repeated(wallTex, w * boardsPerUnit, h / H);
        tex.offset.set(((p.x0 + W) * boardsPerUnit) % 1, p.y0 / H);
        return <FacedBox key={i} size={[w, h, wall]} position={[p.x0 + w / 2, p.y0 + h / 2, -D - wall / 2]} face={4} map={tex} color="#EBC4CF" />;
      })}

      {/* cream trim along the wall tops and skirting */}
      <Box size={[wall + 0.06, 0.08, leftLen + 0.03]} position={[-W - wall / 2, H + 0.04, -wall / 2]} color={P.cream} />
      <Box size={[2 * W + wall + 0.03, 0.08, wall + 0.06]} position={[-wall / 2, H + 0.04, -D - wall / 2]} color={P.cream} />
      <Box size={[0.05, 0.16, 2 * D]} position={[-W + 0.025, 0.08, 0]} color={P.cream} />
      <Box size={[2 * W, 0.16, 0.05]} position={[0, 0.08, -D + 0.025]} color={P.cream} />
    </group>
  );
}

function Window() {
  const cx = (WINDOW.x0 + WINDOW.x1) / 2;
  const cy = (WINDOW.y0 + WINDOW.y1) / 2;
  const w = WINDOW.x1 - WINDOW.x0;
  const h = WINDOW.y1 - WINDOW.y0;
  const frame = '#FBF7F2';
  const z = -D - wall / 2;
  const mullionZ = -D - wall * 0.45;
  return (
    <group>
      <WindowView />
      {/* deep painted frame lining the opening */}
      <Box size={[w + 0.2, 0.14, wall + 0.12]} position={[cx, WINDOW.y1 + 0.03, z + 0.02]} color={frame} />
      <Box size={[0.14, h + 0.1, wall + 0.12]} position={[WINDOW.x0 + 0.01, cy, z + 0.02]} color={frame} />
      <Box size={[0.14, h + 0.1, wall + 0.12]} position={[WINDOW.x1 - 0.01, cy, z + 0.02]} color={frame} />
      {/* sill with a front lip */}
      <Box size={[w + 0.36, 0.08, wall + 0.42]} position={[cx, WINDOW.y0 - 0.04, z + 0.14]} color={frame} />
      <Box size={[w + 0.3, 0.12, 0.04]} position={[cx, WINDOW.y0 - 0.12, -D + 0.3]} color="#F1E8DC" />
      {/* sash bars, set back toward the glass */}
      <Box size={[0.06, h, 0.06]} position={[cx, cy, mullionZ]} color={frame} />
      <Box size={[w, 0.06, 0.06]} position={[cx, WINDOW.y0 + h * 0.62, mullionZ]} color={frame} />
      <Box size={[w, 0.04, 0.05]} position={[cx, WINDOW.y0 + 0.05, mullionZ]} color={frame} />
      {[0, 1].map((i) => (
        <Box key={i} size={[0.03, 0.08, 0.04]} position={[cx + (i ? 0.12 : -0.12), WINDOW.y0 + h * 0.62 - 0.08, mullionZ + 0.04]} color="#C9B79A" metal />
      ))}
      {/* glass: barely there, but it catches reflections */}
      <mesh position={[cx, cy, -D - wall * 0.5]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} roughness={0.05} metalness={0.1} depthWrite={false} />
      </mesh>
      <Plant position={[WINDOW.x0 + 0.45, WINDOW.y0, -D + 0.08]} scale={0.7} seed={41} />
    </group>
  );
}

function CeilingLight() {
  // Light bar mounted flush along the top of the window wall.
  return (
    <group position={[-1.4, H - 0.14, -D + 0.2]}>
      <Box size={[3.0, 0.1, 0.3]} color="#FBF7F2" shadow={false} />
      <mesh position={[0, -0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 0.2]} />
        <meshBasicMaterial color="#FFF6E8" toneMapped={false} />
      </mesh>
    </group>
  );
}

function WallShelf() {
  // Long shelf high on the left wall, books facing into the room.
  const y = 3.95;
  const x = -W + 0.24;
  return (
    <group>
      <Box size={[0.48, 0.07, 5.6]} position={[x, y, -1.1]} color={P.cream} />
      {[-3.4, -1.1, 1.2].map((z) => (
        <Box key={z} size={[0.4, 0.22, 0.05]} position={[x - 0.02, y - 0.14, z]} color={P.metal} metal />
      ))}
      <group position={[-W + 0.26, y + 0.035, 1.55]} rotation={[0, Math.PI / 2, 0]}>
        <Books length={1.7} seed={4} maxH={0.62} depth={0.36} />
      </group>
      <group position={[-W + 0.26, y + 0.035, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        <Books length={1.3} seed={8} maxH={0.55} depth={0.36} />
      </group>
      <Box size={[0.36, 0.3, 0.42]} position={[x, y + 0.185, -3.45]} color="#F7F5F2" />
      <Box size={[0.36, 0.22, 0.42]} position={[x, y + 0.48, -3.45]} color={P.dusty} />
      <Plant position={[x, y + 0.035, -0.75]} kind="trailing" seed={12} scale={0.95} />
      <Plant position={[x, y + 0.035, -3.0]} kind="trailing" seed={19} scale={0.75} />
      <Vines position={[x + 0.18, y - 0.02, 0.2]} seed={6} strands={2} length={1.3} />
    </group>
  );
}

function Posters() {
  const a = posterTexture();
  const b = posterTexture2();
  return (
    <group>
      <mesh position={[-W + 0.01, 2.75, 1.25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.62, 0.8]} />
        <meshStandardMaterial map={a} roughness={0.9} />
      </mesh>
      <mesh position={[-W + 0.01, 2.55, -0.25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.65]} />
        <meshStandardMaterial map={b} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Leg({ x, z, h = DESK.top - DESK.thickness }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.08, h, 0.08]} position={[0, h / 2, 0]} color={P.metal} metal />
      <Box size={[0.13, 0.03, 0.13]} position={[0, 0.015, 0]} color="#2F2B33" />
      <Blob position={[0, 0.004, 0]} size={[0.5, 0.5]} opacity={0.6} />
    </group>
  );
}

function Drawer3({ x0, x1, z, y0, y1 }: { x0: number; x1: number; z: number; y0: number; y1: number }) {
  // Static drawer fronts with handles, for pedestals that don't open.
  const n = 2;
  const h = (y1 - y0) / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <Box size={[x1 - x0 - 0.06, h - 0.05, 0.04]} position={[(x0 + x1) / 2, y0 + h * (i + 0.5), z]} color={P.cream} />
          <Box size={[x1 - x0 - 0.2, h - 0.19, 0.012]} position={[(x0 + x1) / 2, y0 + h * (i + 0.5), z + 0.024]} color="#F7EFE3" />
          <Box size={[0.26, 0.035, 0.035]} position={[(x0 + x1) / 2, y0 + h * (i + 0.5) + h * 0.22, z + 0.05]} color="#B9B3BC" metal />
        </group>
      ))}
    </>
  );
}

function Desks() {
  const { a, b, top, thickness } = DESK;
  return (
    <group>
      {/* desk B along the window wall (includes the corner) */}
      <Box size={[b.x1 - b.x0, thickness * 0.7, b.z1 - b.z0]} position={[(b.x0 + b.x1) / 2, top - thickness * 0.35, (b.z0 + b.z1) / 2]} color={P.cream} />
      <Box size={[b.x1 - b.x0 - 0.04, thickness * 0.3, b.z1 - b.z0 - 0.04]} position={[(b.x0 + b.x1) / 2 - 0.02, top - thickness * 0.85, (b.z0 + b.z1) / 2 - 0.02]} color={P.creamDark} />
      <Box size={[b.x1 - b.x0, 0.03, 0.03]} position={[(b.x0 + b.x1) / 2, top - thickness - 0.015, b.z1 - 0.02]} color={P.creamDark} />
      {/* desk A along the left wall */}
      <Box size={[a.x1 - a.x0, thickness * 0.7, a.z1 - a.z0]} position={[(a.x0 + a.x1) / 2, top - thickness * 0.35, (a.z0 + a.z1) / 2]} color={P.cream} />
      <Box size={[a.x1 - a.x0 - 0.04, thickness * 0.3, a.z1 - a.z0]} position={[(a.x0 + a.x1) / 2 - 0.02, top - thickness * 0.85, (a.z0 + a.z1) / 2]} color={P.creamDark} />
      <Blob position={[a.x0 + 0.7, 0.004, a.z1 - 0.62]} size={[1.9, 1.7]} opacity={0.75} />
      <Blob position={[0.97, 0.004, -4.2]} size={[1.7, 2.0]} opacity={0.75} />
      <Box size={[0.03, 0.03, a.z1 - a.z0]} position={[a.x1 - 0.02, top - thickness - 0.015, (a.z0 + a.z1) / 2]} color={P.creamDark} />

      <Leg x={b.x1 - 0.06} z={b.z1 + 0.06 - 0.12} />
      <Leg x={b.x1 - 0.06} z={b.z0 + 0.1} />
      <Leg x={a.x1 - 0.08} z={b.z1 + 0.06 - 0.12} />
      <Leg x={a.x1 - 0.08} z={a.z1 - 0.08} />
      <Leg x={a.x0 + 0.08} z={a.z1 - 0.08} />

      {/* pedestal under desk A, near the front */}
      <Box size={[1.2, top - thickness - 0.06, 1.0]} position={[a.x0 + 0.7, (top - thickness - 0.06) / 2 + 0.03, a.z1 - 0.62]} color={P.creamDark} />
      <group rotation={[0, Math.PI / 2, 0]} position={[a.x0 + 1.32, 0, a.z1 - 0.62]}>
        <Drawer3 x0={-0.48} x1={0.48} z={0} y0={0.06} y1={top - thickness - 0.02} />
      </group>

      {/* storage box and books under desk B */}
      <Box size={[0.8, 0.45, 0.7]} position={[-3.6, 0.225, -4.5]} color={P.wine} />
      <Box size={[0.82, 0.06, 0.72]} position={[-3.6, 0.47, -4.5]} color="#8E2E55" />
      <group position={[-2.5, 0, -4.65]}>
        <Books length={0.8} seed={31} maxH={0.5} depth={0.34} />
      </group>
    </group>
  );
}

function Cabinet() {
  // Open shelving unit against the left wall, compartments facing +x. Holds the notebook.
  const { x, z, depth, width, height, shelves } = CABINET;
  const z0 = z - width / 2;
  const z1 = z + width / 2;
  const front = x + depth / 2;
  return (
    <group>
      <Blob position={[x + 0.25, 0.004, z]} size={[1.8, 2.4]} opacity={0.8} />
      <Box size={[0.05, height, width]} position={[x - depth / 2 + 0.025, height / 2, z]} color={P.blush} />
      {shelves.map((sy) => (
        <group key={sy}>
          <Box size={[depth, 0.06, width]} position={[x, sy, z]} color={P.cream} />
          <Box size={[0.025, 0.08, width - 0.06]} position={[front - 0.0125, sy - 0.01, z]} color={P.creamDark} />
        </group>
      ))}
      {[
        [front - 0.03, z0 + 0.03],
        [front - 0.03, z1 - 0.03],
        [x - depth / 2 + 0.03, z0 + 0.03],
        [x - depth / 2 + 0.03, z1 - 0.03],
      ].map(([px, pz], i) => (
        <Box key={i} size={[0.06, height + 0.05, 0.06]} position={[px, (height + 0.05) / 2, pz]} color={P.metal} metal />
      ))}
      {/* bottom shelf */}
      <group position={[x + 0.1, shelves[0] + 0.03, z1 - 0.08]} rotation={[0, Math.PI / 2, 0]}>
        <Books length={0.75} seed={51} maxH={0.78} depth={0.55} />
      </group>
      <Box size={[0.6, 0.5, 0.55]} position={[x + 0.05, shelves[0] + 0.28, z0 + 0.38]} color={P.wine} />
      <Box size={[0.62, 0.05, 0.57]} position={[x + 0.05, shelves[0] + 0.555, z0 + 0.38]} color="#8E2E55" />
      {/* middle shelf: books to the left of the notebook, a small box to its right */}
      <group position={[x + 0.12, shelves[1] + 0.03, z1 - 0.06]} rotation={[0, Math.PI / 2, 0]}>
        <Books length={0.5} seed={57} maxH={0.74} depth={0.55} lean={false} />
      </group>
      <Box size={[0.5, 0.32, 0.36]} position={[x + 0.1, shelves[1] + 0.19, z0 + 0.22]} color={P.white} />
      <Box size={[0.08, 0.04, 0.12]} position={[front - 0.15, shelves[1] + 0.24, z0 + 0.22]} color={P.raspberry} />
      {/* top shelf */}
      <group position={[x + 0.12, shelves[2] + 0.03, z1 - 0.06]} rotation={[0, Math.PI / 2, 0]}>
        <Books length={0.95} seed={63} maxH={0.8} depth={0.55} />
      </group>
      <Plant position={[x + 0.05, shelves[2] + 0.03, z0 + 0.33]} seed={64} scale={0.8} />
      {/* on top */}
      <Plant position={[x + 0.05, height, z + 0.3]} kind="trailing" seed={71} scale={1.05} />
      <Box size={[0.4, 0.26, 0.4]} position={[x + 0.05, height + 0.13, z - 0.42]} color={P.dusty} />
    </group>
  );
}

function WindowCabinet() {
  const x0 = 2.25;
  const x1 = 4.75;
  const h = 1.2;
  const d = 0.85;
  const z = -D + d / 2;
  return (
    <group>
      <Blob position={[(x0 + x1) / 2, 0.004, z + 0.2]} size={[3.2, 1.6]} opacity={0.8} />
      <Box size={[x1 - x0 - 0.06, 0.08, d - 0.06]} position={[(x0 + x1) / 2, 0.04, z - 0.02]} color="#D8C7AE" />
      <Box size={[x1 - x0, h - 0.08, d]} position={[(x0 + x1) / 2, 0.08 + (h - 0.08) / 2, z]} color={P.cream} />
      <Box size={[x1 - x0 + 0.08, 0.07, d + 0.06]} position={[(x0 + x1) / 2, h + 0.035, z + 0.02]} color="#FBF7F2" />
      {[0, 1].map((i) => {
        const cx = x0 + (x1 - x0) * (0.25 + i * 0.5);
        return (
          <group key={i}>
            <Box size={[(x1 - x0) / 2 - 0.08, h - 0.16, 0.03]} position={[cx, h / 2, z + d / 2 + 0.01]} color="#F7EFE3" />
            <Box size={[0.04, 0.22, 0.04]} position={[cx + (i ? -1 : 1) * ((x1 - x0) / 4 - 0.14), h / 2 + 0.1, z + d / 2 + 0.05]} color={P.metal} />
          </group>
        );
      })}
      <Plant position={[x0 + 0.5, h + 0.07, z]} seed={81} scale={1.1} />
      <group position={[x0 + 1.15, h + 0.07, z - 0.05]}>
        <Books length={0.55} seed={83} maxH={0.45} depth={0.3} />
      </group>
      <Plant position={[x1 - 0.45, h + 0.07, z]} kind="trailing" seed={85} scale={0.9} />
    </group>
  );
}

function DeskItems() {
  const top = DESK.top;
  return (
    <group>
      {/* keyboard, mouse, mug in front of the main monitor */}
      <mesh position={[-1.25, top + 0.03, -3.95]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.05, 0.36]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} map={i === 2 ? keyboardTexture() : undefined} color={i === 2 ? '#ffffff' : '#3A3440'} roughness={0.8} />
        ))}
      </mesh>
      <Box size={[0.14, 0.05, 0.22]} position={[-0.45, top + 0.03, -3.92]} color="#3A3440" />
      <group position={[-0.05, top, -3.95]}>
        <Cyl r={0.11} h={0.24} position={[0, 0.12, 0]} color="#FBF7F2" />
        <Cyl r={0.09} h={0.01} position={[0, 0.235, 0]} color="#6B3A2E" />
        <Box size={[0.04, 0.12, 0.1]} position={[0.13, 0.12, 0]} color="#FBF7F2" />
        <Box size={[0.012, 0.06, 0.06]} position={[0, 0.13, 0.11]} color={P.raspberry} />
      </group>
      {/* small gadgets and notes */}
      <Box size={[0.3, 0.18, 0.24]} position={[-2.6, top + 0.09, -4.55]} color={P.metal} />
      <Box size={[0.06, 0.04, 0.06]} position={[-2.52, top + 0.2, -4.47]} color={P.raspberry} emissive={P.raspberry} emissiveIntensity={0.6} />
      <Box size={[0.4, 0.03, 0.3]} position={[-2.0, top + 0.015, -3.95]} color="#F7C6D4" />
      <Box size={[0.3, 0.03, 0.24]} position={[-1.95, top + 0.04, -3.9]} color="#FBE7A8" rotation={[0, 0.2, 0]} />
      <Plant position={[0.55, top, -4.6]} seed={91} scale={0.75} />
      {/* desk A: a soldering station and a little parts box */}
      <Box size={[0.42, 0.14, 0.32]} position={[-4.5, top + 0.07, -2.6]} color="#F7F5F2" />
      <Box size={[0.36, 0.04, 0.26]} position={[-4.5, top + 0.16, -2.6]} color={P.burgundy} />
      <Plant position={[-4.55, top, 0.15]} kind="trailing" seed={95} scale={0.85} />
    </group>
  );
}

function SmallMonitor({ texture }: { texture: THREE.Texture }) {
  // Second screen in the corner of desk A, angled toward the room.
  return (
    <group position={[-4.35, DESK.top, -3.55]} rotation={[0, Math.PI / 4, 0]}>
      <Box size={[0.3, 0.04, 0.22]} position={[0, 0.02, 0]} color="#2B2630" />
      <Box size={[0.07, 0.4, 0.06]} position={[0, 0.22, -0.02]} color="#2B2630" />
      <Box size={[1.05, 0.7, 0.07]} position={[0, 0.72, 0]} color="#2B2630" />
      <mesh position={[0, 0.72, 0.037]}>
        <planeGeometry args={[0.97, 0.62]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Laptop({ texture }: { texture: THREE.Texture }) {
  return (
    <group position={[1.0, DESK.top, -4.05]} rotation={[0, -0.35, 0]}>
      <Box size={[0.75, 0.035, 0.5]} position={[0, 0.0175, 0]} color="#D9D4DA" />
      <Box size={[0.6, 0.006, 0.26]} position={[0, 0.038, 0.03]} color="#B9B2BB" />
      <group position={[0, 0.035, -0.24]} rotation={[-0.32, 0, 0]}>
        <Box size={[0.75, 0.5, 0.03]} position={[0, 0.25, 0]} color="#D9D4DA" />
        <mesh position={[0, 0.25, 0.017]}>
          <planeGeometry args={[0.66, 0.42]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Stool() {
  return (
    <group position={[-1.1, 0, -2.55]}>
      <Blob position={[0, 0.004, 0]} size={[1.2, 1.2]} />
      <Cyl r={0.42} h={0.14} position={[0, 1.02, 0]} color={P.wine} segments={14} />
      <Cyl r={0.38} h={0.05} position={[0, 1.105, 0]} color="#8E2E55" segments={14} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return <Box key={i} size={[0.07, 1.0, 0.07]} position={[Math.cos(a) * 0.28, 0.48, Math.sin(a) * 0.28]} rotation={[Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08]} color={P.wine} />;
      })}
      <Cyl r={0.3} h={0.04} position={[0, 0.42, 0]} color="#5E1636" segments={10} />
    </group>
  );
}

function Rug() {
  const tassels = useMemo(() => Array.from({ length: 22 }, (_, i) => (i / 21 - 0.5) * (RUG.d - 0.12)), []);
  return (
    <group>
      {[-1, 1].map((side) =>
        tassels.map((z) => (
          <Box key={`${side}${z}`} size={[0.09, 0.012, 0.035]} position={[RUG.center.x + side * (RUG.w / 2 + 0.04), 0.006, RUG.center.z + z]} color="#F3E3E0" shadow={false} />
        )),
      )}
      <RugBody />
    </group>
  );
}

function RugBody() {
  return (
    <mesh position={[RUG.center.x, 0.012, RUG.center.z]} receiveShadow>
      <boxGeometry args={[RUG.w, 0.024, RUG.d]} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} map={i === 2 ? rugTexture() : undefined} color={i === 2 ? '#ffffff' : '#B84D74'} roughness={1} />
      ))}
    </mesh>
  );
}

function Tripod() {
  return (
    <group position={[4.35, 0, 0.55]} rotation={[0, -0.6, 0]}>
      <Blob position={[0, 0.004, 0]} size={[0.8, 0.8]} opacity={0.7} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return <Box key={i} size={[0.04, 1.2, 0.04]} position={[Math.cos(a) * 0.2, 0.58, Math.sin(a) * 0.2]} rotation={[Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2]} color="#2B2630" />;
      })}
      <Box size={[0.42, 0.28, 0.24]} position={[0, 1.32, 0]} color="#2B2630" />
      <Cyl r={0.09} h={0.18} position={[0, 1.32, 0.2]} rotation={[Math.PI / 2, 0, 0]} color="#1E1A22" />
      <Box size={[0.1, 0.06, 0.08]} position={[0.12, 1.49, -0.02]} color="#2B2630" />
      <Box size={[0.03, 0.03, 0.01]} position={[0.14, 1.38, 0.125]} color={P.raspberry} emissive={P.raspberry} emissiveIntensity={0.8} />
    </group>
  );
}

function FloorMarks() {
  // Dotted trail of the wheeled robot and a few paw prints from the cat.
  const dots = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const x = -2.2 + t * 2.3 + Math.sin(t * Math.PI * 1.4) * 0.6;
      const z = 3.75 - t * 3.4 + Math.sin(t * Math.PI * 2) * 0.35;
      pts.push([x, z]);
    }
    return pts;
  }, []);
  const paw = pawTexture();
  const paws: [number, number, number][] = [
    [1.0, 3.3, 0.5],
    [0.7, 3.75, 0.6],
    [1.3, 2.85, 0.4],
  ];
  return (
    <group>
      {dots.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.045, 6]} />
          <meshBasicMaterial color={P.raspberry} />
        </mesh>
      ))}
      {paws.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.009, z]} rotation={[-Math.PI / 2, 0, r]}>
          <planeGeometry args={[0.32, 0.32]} />
          <meshBasicMaterial map={paw} transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Room({ smallScreen, laptop }: { smallScreen: THREE.Texture; laptop: THREE.Texture }) {
  return (
    <group>
      <Shell />
      <Occlusion />
      <Window />
      <CeilingLight />
      <WallShelf />
      <Posters />
      <Desks />
      <DeskItems />
      <SmallMonitor texture={smallScreen} />
      <Laptop texture={laptop} />
      <Cabinet />
      <WindowCabinet />
      <Stool />
      <Rug />
      <Tripod />
      <FloorMarks />
      <Plant position={[4.3, 0, -3.15]} kind="tall" seed={101} scale={1.15} />
      <Plant position={[0.55, 0, 4.0]} kind="monstera" seed={111} scale={1.05} />
      <Plant position={[-4.35, 0, 4.35]} seed={121} scale={1.1} />
    </group>
  );
}
