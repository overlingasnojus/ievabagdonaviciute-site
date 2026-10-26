import type * as THREE from 'three';
import type { SectionId } from '../content';
import type { Viewport } from './rig';

// Shared handles between the 3D scene and the DOM overlay. The scene writes positions
// straight into these elements each frame instead of going through React state.

/** Each section's readable surface: an Object3D centred on it, local XY plane facing +Z. */
export const surfaces: Partial<Record<SectionId, { object: THREE.Object3D; size: [number, number] }>> = {};

export const dom = {
  hotspots: {} as Partial<Record<SectionId, HTMLElement | null>>,
  surface: null as HTMLElement | null,
  veil: null as HTMLElement | null,
};

/** Kept current by the page layout (see useStageSlot). */
export const viewport: Viewport = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  height: typeof window !== 'undefined' ? window.innerHeight : 800,
  slot: { x: 0, y: 0, width: 1280, height: 800 },
};
