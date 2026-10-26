import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD_ASPECT, BOARD_H, BOARD_W, COMPACT_BELOW, drawResearchBoard, loadBoardAssets, type Density } from '../ui/researchLayout';
import { CAMERA, PALETTE as P, WHITEBOARD } from './layout';
import { HitBox, Interactive } from './Interactive';
import { Box } from './parts';
import { surfaces, viewport } from './registry';
import { sectionShot } from './rig';

// Research: the whiteboard always shows the research overview itself, painted from the
// same layout and data as the HTML board (ui/researchLayout.ts). Opening Research flies
// the camera up to this board and the HTML version fades in exactly on top of it, so
// it reads as approaching the same board rather than swapping to a new one.

const TEX_W = 2048;
const TAN_V = Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));

/** Which overview density the HTML board will use once the camera arrives. */
function densityForViewport(): Density {
  const shot = sectionShot('research', viewport);
  const d = shot.pos.distanceTo(shot.target);
  const aspect = viewport.width / viewport.height;
  const boardPx = (BOARD_W * viewport.width) / (2 * d * TAN_V * aspect);
  return boardPx < COMPACT_BELOW ? 'compact' : 'full';
}

export function Whiteboard() {
  const surface = useRef<THREE.Object3D>(null);
  const gl = useThree((s) => s.gl);
  const { center, w, h } = WHITEBOARD;
  const state = useRef<{ images: Map<string, HTMLImageElement> | null; density: Density | null; key: string }>({
    images: null,
    density: null,
    key: '',
  });

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = TEX_W;
    c.height = Math.round(TEX_W / BOARD_ASPECT);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fbf8f3';
    ctx.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = gl.capabilities.getMaxAnisotropy();
    return { canvas: c, texture: t };
  }, [gl]);

  useEffect(() => {
    // the whole writing surface, so nothing of the board shows around the research
    if (surface.current) surfaces.research = { object: surface.current, size: [BOARD_W, BOARD_H] };
    return () => void delete surfaces.research;
  }, []);

  useEffect(() => {
    let alive = true;
    loadBoardAssets().then((images) => {
      if (!alive) return;
      state.current.images = images;
      state.current.density = null; // force a paint
    });
    return () => {
      alive = false;
      texture.dispose();
    };
  }, [texture]);

  // Repaint when assets arrive or the viewport changes which density the board uses.
  useFrame(() => {
    const s = state.current;
    if (!s.images) return;
    const key = `${viewport.width}x${viewport.height}`;
    if (key === s.key && s.density) return;
    s.key = key;
    const density = densityForViewport();
    if (density === s.density) return;
    s.density = density;
    drawResearchBoard(canvas, s.images, density);
    texture.needsUpdate = true;
  });

  const frame = '#D8D3DA';
  return (
    <Interactive id="research">
      <group position={center.toArray()}>
        <Box size={[w + 0.14, h + 0.14, 0.06]} position={[0, 0, 0]} color={frame} />
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#f7f2ec" roughness={0.4} />
        </mesh>
        {/* the research board, opaque, exactly where the HTML board will sit */}
        <mesh position={[0, 0, 0.034]} userData={{ noHighlight: true }}>
          <planeGeometry args={[BOARD_W, BOARD_H]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* marker tray */}
        <Box size={[w * 0.5, 0.05, 0.14]} position={[0, -h / 2 - 0.09, 0.07]} color={frame} />
        <Box size={[0.26, 0.04, 0.04]} position={[-0.5, -h / 2 - 0.045, 0.08]} color={P.raspberry} />
        <Box size={[0.26, 0.04, 0.04]} position={[-0.15, -h / 2 - 0.045, 0.1]} color="#2E3550" />
        <Box size={[0.22, 0.07, 0.1]} position={[0.35, -h / 2 - 0.03, 0.08]} color={P.burgundy} />
        <object3D ref={surface} position={[0, 0, 0.034]} />
        <HitBox size={[w + 0.2, h + 0.3, 0.3]} position={[0, -0.05, 0.1]} />
      </group>
    </Interactive>
  );
}
