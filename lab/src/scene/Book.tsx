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
  /** Top page of the back half; it lifts a little as the book opens. */
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
const R = 0.016; // softened radius of the pages' outer corners
const SHEETS = 4; // stacked page edges visible past each top page

/**
 * A page-shaped plane from the spine (x = 0) to x = w, its outer corners rounded,
 * with UVs normalised to the page so the paper texture maps once across it.
 */
function pageGeometry(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(0, -h / 2);
  s.lineTo(w - r, -h / 2);
  s.quadraticCurveTo(w, -h / 2, w, -h / 2 + r);
  s.lineTo(w, h / 2 - r);
  s.quadraticCurveTo(w, h / 2, w - r, h / 2);
  s.lineTo(0, h / 2);
  s.closePath();
  const g = new THREE.ShapeGeometry(s, 6);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w, (pos.getY(i) + h / 2) / h);
  return g;
}

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
    // a cloth cover with a little sheen, so it catches soft highlights
    return {
      back: mats([coverColor, coverColor, coverColor, coverColor, inside, coverColor], 0.62),
      backPages: mats([edges, edges, edges, edges, pageMap, pageMap], 0.95, 0.42),
      frontPages: mats([edges, edges, edges, edges, pageMap, pageMap], 0.95, 0.42),
      front: mats([coverColor, coverColor, coverColor, coverColor, coverMap, inside], 0.62),
      spine: mats([inside, spineMap, coverColor, coverColor, coverColor, coverColor], 0.62),
      sheet: new THREE.MeshStandardMaterial({ map: pageMap, roughness: 0.95, emissive: '#ffffff', emissiveMap: pageMap, emissiveIntensity: 0.42, side: THREE.DoubleSide }),
      // the stacked edges darken slightly toward the bottom of the pile
      edges: Array.from({ length: SHEETS }, (_, k) => new THREE.MeshStandardMaterial({ color: new THREE.Color('#F1E6D6').offsetHSL(0, 0, -0.035 * k), roughness: 1 })),
    };
  }, [coverColor, coverMap, spineMap, pageMap, inside]);

  const pw = w - 0.003;
  const sheet = useMemo(() => pageGeometry(pw, h, R), [pw, h]);
  const edgeSheets = useMemo(() => Array.from({ length: SHEETS }, (_, k) => pageGeometry(pw + 0.0028 * (k + 1), h - 0.002 * (k + 1), R)), [pw, h]);
  const stitchYs = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 9 - 0.5) * (h - 0.08)), [h]);

  return (
    <group ref={root}>
      {/* back half: fixed */}
      <mesh position={[cw / 2, 0, -half - C / 2]} material={m.back} castShadow receiveShadow>
        <boxGeometry args={[cw, ch, C]} />
      </mesh>
      {/* page block, inset under the rounded top page so its square corners never show */}
      <mesh position={[0.003 + (pw - R) / 2, 0, -half / 2 - 0.001]} material={m.backPages} castShadow receiveShadow>
        <boxGeometry args={[pw - R, h - 2 * R, half - 0.002]} />
      </mesh>
      {edgeSheets.map((g, k) => (
        <mesh key={k} geometry={g} material={m.edges[k]} position={[0.003, 0, -0.0035 * (k + 1)]} receiveShadow />
      ))}
      {tab && (
        <mesh position={[w + 0.022, h * 0.24, -0.006]} castShadow>
          <boxGeometry args={[0.05, 0.13, 0.006]} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <meshStandardMaterial key={i} attach={`material-${i}`} map={i >= 4 ? tab : undefined} color={i >= 4 ? '#ffffff' : '#EDB3C3'} roughness={0.9} />
          ))}
        </mesh>
      )}
      {/* the top page of the back half: soft-cornered, and it lifts as the book opens */}
      <group ref={leaf}>
        <mesh geometry={sheet} material={m.sheet} position={[0.003, 0, 0.0008]} receiveShadow />
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
            <mesh key={y} position={[0.0035, y, 0]}>
              <boxGeometry args={[0.007, 0.022, 0.011]} />
              <meshStandardMaterial color="#E2C07E" roughness={0.35} metalness={0.45} emissive="#7A5A2A" emissiveIntensity={0.35} />
            </mesh>
          ))}
      </group>

      {/* front half: cover and the front half of the pages, hinged at the centre plane */}
      <group ref={front}>
        <mesh position={[0.003 + (pw - R) / 2, 0, half / 2 + 0.001]} material={m.frontPages} castShadow receiveShadow>
          <boxGeometry args={[pw - R, h - 2 * R, half - 0.002]} />
        </mesh>
        {/* its top page faces −z here, and up once the half has swung open */}
        <mesh geometry={sheet} material={m.sheet} position={[0.003, 0, -0.0008]} receiveShadow />
        {edgeSheets.map((g, k) => (
          <mesh key={k} geometry={g} material={m.edges[k]} position={[0.003, 0, 0.0035 * (k + 1)]} receiveShadow />
        ))}
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
