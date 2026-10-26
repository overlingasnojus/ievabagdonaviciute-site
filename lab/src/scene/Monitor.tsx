import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { HitBox, Interactive } from './Interactive';
import { DESK, MONITOR } from './layout';
import { Box } from './parts';
import { surfaces } from './registry';
import { armDiagramTexture, codeTexture } from './textures';

// Projects: the main screen. Ambient code scrolls in pixel steps; opening fades the
// screen to a plain console and then hides the code completely, so nothing of it can
// show through the HTML desktop that boots up over the whole screen.

const BOOT_BG = new THREE.Color('#2A1220');
const BOOT_BG_LIT = new THREE.Color('#3B1A2C');

export function Monitor({ textures }: { textures: THREE.Texture[] }) {
  const surface = useRef<THREE.Object3D>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const codeLayers = useRef<THREE.Mesh[]>([]);
  const glow = useRef<THREE.PointLight>(null);
  const code = codeTexture();
  const scroll = useRef(0);
  const { center, w, h } = MONITOR;

  useEffect(() => {
    if (surface.current) surfaces.projects = { object: surface.current, size: [w, h] };
    return () => void delete surfaces.projects;
  }, [w, h]);

  useFrame((state, dt) => {
    // Advance all ambient screens one text row at a time.
    scroll.current += dt;
    if (scroll.current > 0.45) {
      scroll.current = 0;
      for (const t of [code, ...textures]) t.offset.y = (t.offset.y + 4 / 96) % 1;
    }
    const g = anim.projects.glow;
    if (screenMat.current) {
      screenMat.current.opacity = g;
      screenMat.current.color.copy(BOOT_BG).lerp(BOOT_BG_LIT, g);
    }
    for (const m of codeLayers.current) m.visible = g < 0.999;
    if (glow.current) glow.current.intensity = 0.55 + g * 0.6 + Math.sin(state.clock.elapsedTime * 1.3) * 0.04;
  });

  const neckH = center.y - h / 2 - DESK.top;
  return (
    <Interactive id="projects">
      <group position={[center.x, 0, center.z]}>
        <Box size={[0.55, 0.04, 0.34]} position={[0, DESK.top + 0.02, -0.12]} color="#2B2630" />
        <Box size={[0.1, neckH + 0.05, 0.08]} position={[0, DESK.top + neckH / 2 + 0.02, -0.12]} color="#2B2630" />
        <Box size={[w + 0.1, h + 0.1, 0.07]} position={[0, center.y, -0.045]} color="#2B2630" />
        <Box size={[0.08, 0.025, 0.01]} position={[w / 2 - 0.05, center.y - h / 2 - 0.03, -0.008]} color="#F28DB2" emissive="#F28DB2" emissiveIntensity={1} />
        <mesh ref={(m) => void (m && (codeLayers.current[0] = m))} position={[0, center.y, -0.006]} userData={{ noHighlight: true }}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={code} toneMapped={false} />
        </mesh>
        <mesh ref={(m) => void (m && (codeLayers.current[1] = m))} position={[w * 0.27, center.y + 0.05, -0.004]} userData={{ noHighlight: true }}>
          <planeGeometry args={[w * 0.4, h * 0.6]} />
          <meshBasicMaterial map={armDiagramTexture()} toneMapped={false} />
        </mesh>
        <mesh position={[0, center.y, -0.002]} userData={{ noHighlight: true }}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial ref={screenMat} color={BOOT_BG} transparent opacity={0} toneMapped={false} />
        </mesh>
        <pointLight ref={glow} position={[0, center.y - 0.1, 0.6]} color="#F7B6CB" distance={3.2} decay={1.6} intensity={0.55} />
        <object3D ref={surface} position={[0, center.y, 0]} />
        <HitBox size={[w + 0.3, h + 0.6, 0.6]} position={[0, center.y - 0.15, 0]} />
      </group>
    </Interactive>
  );
}
