import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { gutterTexture, pageEdges } from './textures';

// A physical hardback. Local frame: spine along +Y at x = 0, pages extend toward +X,
// the front cover faces +Z, and z = 0 is the middle of the page block.
//
// Opening rotates the front half (front cover + front half of the pages) −π about the
// spine axis at the centre plane, so both halves end up lying flat at z ≤ 0 with the
// open spread on z = 0, facing +Z and centred on the spine. The spine itself folds
// −π/2 to lie under the gutter, which is where the binding stitches show.

export interface BookHandles {
  root: THREE.Group;
  front: THREE.Group;
  spine: THREE.Group;
  /** Top page of the back half; rotating it −π turns the page. */
  leaf: THREE.Group;
  surface: THREE.Object3D;
}

export interface BookProps {
  w: number;
  h: number;
  t: number;
  coverColor: string;
  coverMap: THREE.Texture;
  spineMap: THREE.Texture;
  pageMap: THREE.Texture;
  /** Cover board overhang past the pages. */
  overhang?: number;
  stitches?: boolean;
  tab?: THREE.Texture;
}

const C = 0.018; // cover board thickness

function mats(spec: (THREE.Texture | string)[], rough = 0.85, glow = 0) {
  return spec.map((s) =>
    typeof s === 'string'
      ? new THREE.MeshStandardMaterial({ color: s, roughness: rough })
      : // paper gets a little self-light so the pages stay bright enough to read on
        new THREE.MeshStandardMaterial({ map: s, roughness: rough, emissive: glow ? '#ffffff' : '#000000', emissiveMap: glow ? s : null, emissiveIntensity: glow }),
  );
}

export const Book = forwardRef<BookHandles, BookProps>(function Book(
  { w, h, t, coverColor, coverMap, spineMap, pageMap, overhang = 0.015, stitches = false, tab },
  ref,
) {
  const root = useRef<THREE.Group>(null!);
  const front = useRef<THREE.Group>(null!);
  const spine = useRef<THREE.Group>(null!);
  const leaf = useRef<THREE.Group>(null!);
  const surface = useRef<THREE.Object3D>(null!);
  useImperativeHandle(ref, () => ({ root: root.current, front: front.current, spine: spine.current, leaf: leaf.current, surface: surface.current }));

  const half = t / 2 - C; // page thickness per half
  const cw = w + overhang;
  const ch = h + 2 * overhang;
  const inside = useMemo(() => new THREE.Color(coverColor).offsetHSL(0, -0.05, 0.06).getStyle(), [coverColor]);

  const m = useMemo(() => {
    const edges = pageEdges();
    // face order: +x −x +y −y +z −z
    return {
      back: mats([coverColor, coverColor, coverColor, coverColor, inside, coverColor]),
      backPages: mats([edges, edges, edges, edges, pageMap, pageMap], 0.95, 0.28),
      frontPages: mats([edges, edges, edges, edges, pageMap, pageMap], 0.95, 0.28),
      front: mats([coverColor, coverColor, coverColor, coverColor, coverMap, inside]),
      spine: mats([inside, spineMap, coverColor, coverColor, coverColor, coverColor]),
      leaf: mats([edges, edges, edges, edges, pageMap, pageMap], 0.95, 0.28),
    };
  }, [coverColor, coverMap, spineMap, pageMap, inside]);

  const pw = w - 0.012;
  const stitchYs = useMemo(() => Array.from({ length: 7 }, (_, i) => (i / 6 - 0.5) * (h - 0.12)), [h]);

  return (
    <group ref={root}>
      {/* back half: fixed */}
      <mesh position={[cw / 2, 0, -half - C / 2]} material={m.back} castShadow receiveShadow>
        <boxGeometry args={[cw, ch, C]} />
      </mesh>
      <mesh position={[0.012 + pw / 2, 0, -half / 2]} material={m.backPages} castShadow receiveShadow>
        <boxGeometry args={[pw, h, half]} />
      </mesh>
      {tab && (
        <mesh position={[w + 0.022, h * 0.24, -0.006]} castShadow>
          <boxGeometry args={[0.05, 0.13, 0.006]} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <meshStandardMaterial key={i} attach={`material-${i}`} map={i >= 4 ? tab : undefined} color={i >= 4 ? '#ffffff' : '#EDB3C3'} roughness={0.9} />
          ))}
        </mesh>
      )}
      <group ref={leaf}>
        <mesh position={[0.014 + (pw - 0.004) / 2, 0, 0.0015]} material={m.leaf}>
          <boxGeometry args={[pw - 0.004, h - 0.004, 0.003]} />
        </mesh>
      </group>
      {/* gutter shading, hidden inside the closed book */}
      <mesh position={[0, 0, 0.0035]} renderOrder={2}>
        <planeGeometry args={[0.2, h]} />
        <meshBasicMaterial map={gutterTexture()} transparent depthWrite={false} />
      </mesh>

      {/* spine: folds under the gutter as the book opens */}
      <group ref={spine}>
        <mesh position={[-C / 2, 0, 0]} material={m.spine} castShadow receiveShadow>
          <boxGeometry args={[C, ch, t]} />
        </mesh>
        {stitches &&
          stitchYs.map((y) => (
            <mesh key={y} position={[0.003, y, 0]}>
              <boxGeometry args={[0.008, 0.035, 0.016]} />
              <meshStandardMaterial color="#B5835A" roughness={0.5} metalness={0.4} />
            </mesh>
          ))}
      </group>

      {/* front half: cover and the front half of the pages, hinged at the centre plane */}
      <group ref={front}>
        <mesh position={[0.012 + pw / 2, 0, half / 2]} material={m.frontPages} castShadow receiveShadow>
          <boxGeometry args={[pw, h, half]} />
        </mesh>
        <mesh position={[cw / 2, 0, half + C / 2]} material={m.front} castShadow receiveShadow>
          <boxGeometry args={[cw, ch, C]} />
        </mesh>
      </group>

      <object3D ref={surface} position={[0, 0, 0.004]} />
    </group>
  );
});

/** Applies an open amount (0 closed → 1 flat open) to a book's hinged parts. */
export function setBookOpen(b: BookHandles, open: number) {
  b.front.rotation.y = -Math.PI * open;
  b.spine.rotation.y = -(Math.PI / 2) * open;
  // tuck the folded spine just under the page surface so it never z-fights the pages
  b.spine.position.z = -0.004 * open;
  b.spine.position.x = 0;
}
