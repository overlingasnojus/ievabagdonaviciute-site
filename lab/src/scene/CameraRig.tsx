import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SectionId } from '../content';
import { anim } from '../state/anim';
import { viewport } from './registry';
import { applyShotTo, blendShot, overviewShot, sectionShot, shotSpec, type Shot } from './rig';

/** Places the camera every frame from the overview, the active section shot and anim.cam.t. */
export function CameraRig() {
  const cache = useRef<{ key: string; overview: Shot; sections: Partial<Record<SectionId, Shot>> } | null>(null);
  const out = useRef<Shot>({ pos: new THREE.Vector3(), target: new THREE.Vector3(), offset: new THREE.Vector2() });

  useFrame(({ camera }) => {
    const { width, height, slot } = viewport;
    const key = [width, height, slot.x, slot.y, slot.width, slot.height].map(Math.round).join(',');
    if (cache.current?.key !== key) cache.current = { key, overview: overviewShot(viewport), sections: {} };
    const c = cache.current;

    const id = anim.cam.section;
    const shot = out.current;
    if (!id || id === 'cv' || anim.cam.t === 0) {
      shot.pos.copy(c.overview.pos);
      shot.target.copy(c.overview.target);
      shot.offset.copy(c.overview.offset);
    } else {
      const to = (c.sections[id] ??= sectionShot(id, viewport));
      blendShot(c.overview, to, shotSpec(id), anim.cam.t, shot);
    }
    applyShotTo(camera as THREE.PerspectiveCamera, shot, viewport);
  }, -2);

  return null;
}
