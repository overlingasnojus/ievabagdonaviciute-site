import type * as THREE from 'three';
import type { SectionId } from '../content';
import type { Viewport } from './rig';

// Shared handles between the 3D scene and the DOM overlay. The scene writes positions
// straight into these elements each frame instead of going through React state.

export interface Surface {
  /** An Object3D centred on the readable surface, its local XY plane facing +Z. */
  object: THREE.Object3D;
  size: [number, number];
  /**
   * The surface's world matrix once the opening animation has finished. When given,
   * the HTML is laid out at its final size from the start (while still invisible), so
   * the moving book never makes the text reflow; only its transform follows the book.
   */
  final?: THREE.Matrix4;
}

/** Each section's readable surface. */
export const surfaces: Partial<Record<SectionId, Surface>> = {};

export const dom = {
  hotspots: {} as Partial<Record<SectionId, HTMLElement | null>>,
  surface: null as HTMLElement | null,
  veil: null as HTMLElement | null,
  /** Keyboard button that says hi to the robot; follows it on screen. */
  robot: null as HTMLElement | null,
};

/** Kept current by the page layout (see useStageSlot). */
export const viewport: Viewport = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  height: typeof window !== 'undefined' ? window.innerHeight : 800,
  slot: { x: 0, y: 0, width: 1280, height: 800 },
};
