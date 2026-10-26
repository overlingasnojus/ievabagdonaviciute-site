import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { HitBox, Interactive } from './Interactive';
import { PALETTE as P, WHITEBOARD } from './layout';
import { Box } from './parts';
import { surfaces } from './registry';
import { whiteboardBase, whiteboardSketch } from './textures';

// Research: the board's doodles are wiped away completely and an opaque research
// board (HTML, see ResearchBoard) takes over the whole writing surface inside the frame.

export function Whiteboard() {
  const sketch = useRef<THREE.MeshBasicMaterial>(null);
  const sketchMesh = useRef<THREE.Mesh>(null);
  const surface = useRef<THREE.Object3D>(null);
  const { center, w, h } = WHITEBOARD;

  useEffect(() => {
    // the whole writing surface, so nothing of the board shows around the research
    if (surface.current) surfaces.research = { object: surface.current, size: [w - 0.02, h - 0.02] };
    return () => void delete surfaces.research;
  }, [w, h]);

  useFrame(() => {
    const s = anim.research.sketch;
    if (sketch.current) sketch.current.opacity = 1 - s;
    // fully hidden once wiped, restored on the way back to the lab
    if (sketchMesh.current) sketchMesh.current.visible = s < 0.999;
  });

  const frame = '#D8D3DA';
  return (
    <Interactive id="research">
      <group position={center.toArray()}>
        <Box size={[w + 0.14, h + 0.14, 0.06]} position={[0, 0, 0]} color={frame} />
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={whiteboardBase()} roughness={0.35} emissive="#ffffff" emissiveMap={whiteboardBase()} emissiveIntensity={0.22} />
        </mesh>
        <mesh ref={sketchMesh} position={[0, 0, 0.034]} userData={{ noHighlight: true }}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial ref={sketch} map={whiteboardSketch()} transparent depthWrite={false} />
        </mesh>
        {/* marker tray */}
        <Box size={[w * 0.5, 0.05, 0.14]} position={[0, -h / 2 - 0.09, 0.07]} color={frame} />
        <Box size={[0.26, 0.04, 0.04]} position={[-0.5, -h / 2 - 0.045, 0.08]} color={P.raspberry} />
        <Box size={[0.26, 0.04, 0.04]} position={[-0.15, -h / 2 - 0.045, 0.1]} color="#2E3550" />
        <Box size={[0.22, 0.07, 0.1]} position={[0.35, -h / 2 - 0.03, 0.08]} color={P.burgundy} />
        <object3D ref={surface} position={[0, 0, 0.05]} />
        <HitBox size={[w + 0.2, h + 0.3, 0.3]} position={[0, -0.05, 0.1]} />
      </group>
    </Interactive>
  );
}
