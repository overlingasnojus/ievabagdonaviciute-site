import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { Book, setBookOpen, type BookHandles } from './Book';
import { HitBox, Interactive } from './Interactive';
import { CAT, facing, SCRAPBOOK, SCRAPBOOK_READ } from './layout';
import { Blob, Box } from './parts';
import { surfaces } from './registry';
import { scrapbookCover, scrapbookPage } from './textures';
import { quadBezier } from './Notebook';

// Beyond: a blocky cat sleeps with its paws on a scrapbook. It wakes, stretches and
// steps aside; the scrapbook rises and opens toward the camera.

const WHITE = '#FBF7F2';
const ORANGE = '#E59A5A';
const ORANGE_DARK = '#C97A3E';
const PINK = '#F2A9BF';

const catQuat = facing(CAT.heading);
const readQuat = facing(SCRAPBOOK.readDir);
const bookCtrl = SCRAPBOOK.rest.clone().add(new THREE.Vector3(0.05, SCRAPBOOK.lift * 0.95, 0.1));
const pos = new THREE.Vector3();
const lerp = THREE.MathUtils.lerp;

/** Pyramid ear: a four-sided cone turned so a flat face points forward. */
function Ear({ x, color, inner }: { x: number; color: string; inner: string }) {
  return (
    <group position={[x, 0.19, 0.06]} rotation={[0, 0, -Math.sign(x) * 0.18]}>
      <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.095, 0.15, 4]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, -0.01, 0.045]} rotation={[-0.32, Math.PI / 4, 0]}>
        <coneGeometry args={[0.05, 0.09, 4]} />
        <meshStandardMaterial color={inner} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

const TAIL = [0.17, 0.16, 0.15, 0.13, 0.11]; // segment lengths, tapering

function Cat() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const paws = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { wake, stretch, shift } = anim.beyond;
    const s = Math.sin(stretch * Math.PI); // stretch rises and relaxes
    const awake = Math.max(wake, shift);
    const idle = anim.ambient.level;

    if (root.current) {
      root.current.position.copy(CAT.pos).add(new THREE.Vector3(-CAT.step * shift, Math.sin(shift * Math.PI) * 0.06, 0).applyQuaternion(catQuat));
      root.current.quaternion.copy(catQuat);
      root.current.rotateY(0.3 * shift);
      root.current.scale.setScalar(CAT.scale);
    }
    if (body.current) {
      body.current.rotation.x = 0.26 * s;
      // slow breathing: a little slower and shallower once awake
      body.current.scale.y = 1 + Math.sin(t * (awake ? 2.4 : 1.7)) * (awake ? 0.018 : 0.03);
      body.current.scale.x = 1 + Math.sin(t * (awake ? 2.4 : 1.7)) * 0.012;
    }
    if (neck.current) {
      neck.current.position.y = lerp(0.24, 0.42, wake) - 0.09 * s;
      neck.current.position.z = 0.3 + 0.06 * s;
      neck.current.rotation.x = lerp(0.32, -0.1, wake) + 0.2 * s;
      neck.current.rotation.y = 0.45 * shift + Math.sin(t * 0.7) * 0.05 * shift;
    }
    if (eyes.current) {
      const blink = wake > 0.95 && t % 3.4 < 0.12 ? 0.15 : 1;
      eyes.current.scale.y = lerp(0.18, 1, wake) * blink;
    }
    if (paws.current) {
      paws.current.position.z = 0.2 * s;
      paws.current.position.y = lerp(0.055, 0, Math.min(1, shift * 2)) + Math.sin(shift * Math.PI) * 0.04;
    }

    // Tail: an occasional swish every ~7 s while idle, a gentle sway once awake. Each
    // segment bends a little more than its parent and lags behind it, so the motion
    // travels down the tail instead of moving it as one rigid piece.
    const phase = t % 7.3;
    const swish = phase < 2.4 ? Math.sin((phase / 2.4) * Math.PI) : 0;
    const amp = swish * 0.32 * idle + 0.18 * awake;
    tail.current.forEach((seg, i) => {
      if (!seg) return;
      const wave = Math.sin(t * 2.6 - i * 0.7) * amp * (0.5 + i * 0.22);
      seg.rotation.y = (i === 0 ? 1.0 : 0.38) + wave;
      seg.rotation.x = (i === 0 ? -0.12 - 0.5 * s : -0.04 * s) + (i > 2 ? swish * 0.1 * idle : 0);
    });
  });

  const tailChain = (i: number): JSX.Element | null =>
    i >= TAIL.length ? null : (
      <group position={[0, 0, i === 0 ? 0 : -TAIL[i - 1]]} ref={(g) => void (g && (tail.current[i] = g))}>
        <Box size={[0.09 - i * 0.008, 0.09 - i * 0.008, TAIL[i] + 0.02]} position={[0, 0, -TAIL[i] / 2]} color={i === TAIL.length - 1 ? ORANGE_DARK : ORANGE} />
        {tailChain(i + 1)}
      </group>
    );

  return (
    <group ref={root}>
      <Blob position={[0, 0.006, -0.1]} size={[1.0, 1.5]} />
      <group ref={body} position={[0, 0.02, 0.3]}>
        {/* loaf body: chest, belly and broader haunches */}
        <Box size={[0.46, 0.27, 0.24]} position={[0, 0.15, -0.1]} color={WHITE} />
        <Box size={[0.52, 0.29, 0.5]} position={[0, 0.155, -0.43]} color={WHITE} />
        <Box size={[0.56, 0.27, 0.26]} position={[0, 0.145, -0.72]} color={WHITE} />
        <Box size={[0.4, 0.05, 0.62]} position={[0, 0.305, -0.45]} color={WHITE} />
        <Box size={[0.42, 0.045, 0.34]} position={[0.03, 0.315, -0.6]} color={ORANGE} />
        <Box size={[0.22, 0.04, 0.2]} position={[-0.09, 0.31, -0.25]} color={ORANGE_DARK} />
        <Box size={[0.06, 0.2, 0.3]} position={[0.285, 0.13, -0.68]} color={ORANGE} />
        {/* tucked hind feet */}
        <Box size={[0.13, 0.07, 0.22]} position={[0.22, 0.035, -0.5]} color={WHITE} />
        <Box size={[0.13, 0.07, 0.22]} position={[-0.22, 0.035, -0.5]} color={WHITE} />
        <group position={[0.1, 0.15, -0.85]}>{tailChain(0)}</group>
      </group>

      <group ref={paws}>
        <Box size={[0.11, 0.075, 0.25]} position={[0.11, 0.04, 0.46]} color={WHITE} />
        <Box size={[0.11, 0.075, 0.25]} position={[-0.11, 0.04, 0.46]} color={WHITE} />
        <Box size={[0.1, 0.02, 0.04]} position={[0.11, 0.015, 0.575]} color="#F2DCD6" />
        <Box size={[0.1, 0.02, 0.04]} position={[-0.11, 0.015, 0.575]} color="#F2DCD6" />
      </group>

      <group ref={neck} position={[0, 0.24, 0.3]}>
        {/* head: crown, wider cheeks, small muzzle */}
        <Box size={[0.36, 0.22, 0.3]} position={[0, 0.04, 0.12]} color={WHITE} />
        <Box size={[0.44, 0.15, 0.26]} position={[0, -0.06, 0.13]} color={WHITE} />
        <Box size={[0.34, 0.08, 0.31]} position={[0, 0.12, 0.12]} color={ORANGE} />
        <Box size={[0.12, 0.08, 0.03]} position={[-0.1, 0.1, 0.27]} color={ORANGE} />
        <Box size={[0.17, 0.08, 0.06]} position={[0, -0.08, 0.28]} color="#FFFDF9" />
        <Box size={[0.045, 0.03, 0.02]} position={[0, -0.045, 0.31]} color={PINK} />
        <Ear x={0.11} color={ORANGE} inner={PINK} />
        <Ear x={-0.11} color={ORANGE_DARK} inner={PINK} />
        <group ref={eyes} position={[0, 0.015, 0.272]}>
          <Box size={[0.055, 0.06, 0.012]} position={[0.085, 0, 0]} color="#2B2630" shadow={false} />
          <Box size={[0.055, 0.06, 0.012]} position={[-0.085, 0, 0]} color="#2B2630" shadow={false} />
        </group>
      </group>
      <HitBox size={[0.9, 0.8, 1.6]} position={[0, 0.35, 0]} />
    </group>
  );
}

function Scrapbook() {
  const book = useRef<BookHandles>(null);

  useEffect(() => {
    if (book.current) surfaces.beyond = { object: book.current.surface, size: [SCRAPBOOK.w * 2, SCRAPBOOK.h] };
    return () => void delete surfaces.beyond;
  }, []);

  useFrame(() => {
    const b = book.current;
    if (!b) return;
    const { rise, cover } = anim.beyond;
    quadBezier(SCRAPBOOK.rest, bookCtrl, SCRAPBOOK_READ, rise, pos);
    pos.y += anim.hover.beyond * 0.02;
    b.root.position.copy(pos);
    b.root.quaternion.copy(SCRAPBOOK.restQuat).slerp(readQuat, rise);
    setBookOpen(b, cover);
    b.leaf.rotation.y = -Math.sin(cover * Math.PI) * 0.22;
  });

  return (
    <Book ref={book} w={SCRAPBOOK.w} h={SCRAPBOOK.h} t={SCRAPBOOK.t} coverColor="#D6AE86" coverMap={scrapbookCover()} spineMap={scrapbookCover()} pageMap={scrapbookPage()} />
  );
}

export function Beyond() {
  return (
    <Interactive id="beyond">
      <Cat />
      <Scrapbook />
    </Interactive>
  );
}
