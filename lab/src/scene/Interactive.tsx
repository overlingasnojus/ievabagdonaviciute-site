import { useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SectionId } from '../content';
import { anim } from '../state/anim';
import { getNav, requestSection, setHovered } from '../state/nav';

const HIGHLIGHT = new THREE.Color('#BE3E70');
const tmp = new THREE.Color();

interface Tracked {
  mat: THREE.MeshStandardMaterial;
  base: THREE.Color;
}

/**
 * Makes a group of meshes one clickable room object: pointer cursor, hover tint, and
 * the same navigation request as the buttons. Hover is shared with the hotspot labels
 * through the nav store, so hovering either highlights the object.
 */
export function Interactive({ id, children }: { id: SectionId; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const tracked = useRef<Tracked[] | null>(null);

  useFrame((_, dt) => {
    const nav = getNav();
    const target = nav.hovered === id && nav.phase === 'overview' ? 1 : 0;
    const h = (anim.hover[id] = THREE.MathUtils.damp(anim.hover[id], target, 14, dt));

    if (!tracked.current && group.current) {
      tracked.current = [];
      group.current.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!m || Array.isArray(m) || !('emissive' in m) || o.userData.noHighlight) return;
        tracked.current!.push({ mat: m, base: m.emissive.clone() });
      });
    }
    for (const t of tracked.current ?? []) t.mat.emissive.copy(t.base).add(tmp.copy(HIGHLIGHT).multiplyScalar(h * 0.28));
  });

  const live = () => getNav().phase === 'overview';

  return (
    <group
      ref={group}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (!live()) return;
        setHovered(id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (getNav().hovered === id) setHovered(null);
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!live()) return;
        document.body.style.cursor = '';
        requestSection(id);
      }}
    >
      {children}
    </group>
  );
}

/** Invisible, generous click target. */
export function HitBox({ size, position }: { size: [number, number, number]; position: [number, number, number] }) {
  return (
    <mesh position={position} userData={{ noHighlight: true }}>
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}
