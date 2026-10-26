import * as THREE from 'three';
import type { SectionId } from '../content';

// World units are roughly 30 cm. The room is open toward +x and +z; the camera looks
// in from that front corner. The left wall sits at x = -W and the window wall at z = -D.

export const ROOM = { W: 5, D: 5, H: 5.4, wall: 0.3, floor: 0.35 };

export const PALETTE = {
  bg: '#FFF9F2',
  blush: '#F6DFE5',
  dusty: '#DFA5B7',
  wallPink: '#E8B4C2',
  wallPinkDark: '#D99AAD',
  raspberry: '#BE3E70',
  burgundy: '#520B2D',
  wine: '#7A1E43',
  cream: '#F2E8D8',
  creamDark: '#E2D3BC',
  ivory: '#FBF4EA',
  white: '#F7F5F2',
  metal: '#4A4550',
  metalLight: '#77707C',
  leaf: '#4E8A3E',
  leafLight: '#79AE52',
  leafDark: '#2F5E2B',
  terracotta: '#C8744F',
  screen: '#24121C',
  orange: '#E59A5A',
};

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Builds a quaternion whose local +Z points along `dir`. */
export function facing(dir: THREE.Vector3) {
  const o = new THREE.Object3D();
  o.lookAt(dir);
  return o.quaternion.clone();
}

// --- furniture ---------------------------------------------------------------

export const DESK = {
  top: 1.45,
  thickness: 0.1,
  /** Along the left wall. */
  a: { x0: -ROOM.W, x1: -3.5, z0: -3.6, z1: 0.6 },
  /** Along the window wall, including the corner. */
  b: { x0: -ROOM.W, x1: 1.6, z0: -ROOM.D, z1: -3.6 },
};

/** Drawer pedestal under the right end of desk B. Drawers slide along +z. */
export const PEDESTAL = { x0: 0.45, x1: 1.5, z0: -4.95, z1: -3.62, drawerH: 0.36, travel: 0.85 };

export const CABINET = { x: -4.5, z: 2.9, depth: 0.95, width: 1.6, height: 2.95, shelves: [0.12, 1.0, 1.9, 2.85] };

export const WHITEBOARD = { center: v(-1.4, 3.95, -ROOM.D + 0.2), w: 3.6, h: 2.0 };
export const MONITOR = { center: v(-1.2, 2.32, -4.42), w: 1.5, h: 0.9 };
export const WINDOW = { x0: 1.9, x1: 4.6, y0: 1.5, y1: 4.75 };
export const RUG = { center: v(2.55, 0, 1.75), w: 3.0, d: 2.2 };

// --- interactive objects -----------------------------------------------------

export const NOTEBOOK = {
  // page width, from the spine; slightly wider than a portrait page so the spread
  // makes use of wide, short windows
  w: 0.68,
  h: 0.78,
  t: 0.14,
  rest: v(CABINET.x + CABINET.depth / 2 - 0.04, CABINET.shelves[1] + 0.03 + 0.41, CABINET.z + 0.18),
  restQuat: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
  slide: 0.75,
  /** Where it floats to be read, and the direction the open pages face. */
  read: v(-2.35, 2.1, 3.05),
  readDir: v(1, 0.2, 0.5).normalize(),
};

export const CAT = {
  pos: v(2.95, 0.04, 1.6),
  /** The cat's local +Z (its nose) points along this direction. */
  heading: v(-1, 0, 0.35).normalize(),
  /** Sideways step it takes to uncover the scrapbook, along its local -X (world units). */
  step: 1.05,
  scale: 1.35,
};

const catQuat = facing(CAT.heading);
const flatQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

export const SCRAPBOOK = {
  w: 0.52,
  h: 0.6,
  t: 0.09,
  // Lying under the cat's front paws, spine toward the cat's left.
  rest: CAT.pos.clone().add(new THREE.Vector3(0.1 * CAT.scale, 0.03, 0.62 * CAT.scale).applyQuaternion(catQuat)),
  restQuat: catQuat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)).multiply(flatQuat),
  readDir: v(0.45, 0.62, 1).normalize(),
  lift: 0.95,
};
// Rises up and a little to the left, so the cat stays in view beside it.
export const SCRAPBOOK_READ = SCRAPBOOK.rest.clone().add(v(-0.35, SCRAPBOOK.lift, 0.45));

export const PAPER = { w: 0.85, h: 1.1 };

// --- camera ------------------------------------------------------------------

export const CAMERA = {
  fov: 26,
  near: 0.05,
  far: 200,
  overview: {
    azimuth: THREE.MathUtils.degToRad(52), // from +z toward +x
    elevation: THREE.MathUtils.degToRad(30),
    target: v(0, 1.5, 0),
  },
};

/** Points that must stay in frame in the overview. */
export const ROOM_BOUNDS = [
  v(-ROOM.W, 0, ROOM.D),
  v(ROOM.W, -ROOM.floor, ROOM.D),
  v(ROOM.W, 0, -ROOM.D),
  v(-ROOM.W, ROOM.H, ROOM.D),
  v(-ROOM.W, ROOM.H, -ROOM.D),
  v(ROOM.W, ROOM.H, -ROOM.D),
];

export interface ShotSpec {
  target: THREE.Vector3;
  /** Direction from the target toward the camera. */
  dir: THREE.Vector3;
  /** The surface to frame and the share of the viewport it should fill. */
  surface: [number, number];
  fill: number;
  /** Optional separate width fill (defaults to `fill`). */
  fillW?: number;
}

/** Destination framing for each section, relative to the object it opens. */
export const SHOTS: Record<Exclude<SectionId, 'cv'>, ShotSpec> = {
  // Nearly front-on: the camera sits a few degrees above the page normal.
  about: {
    target: NOTEBOOK.read,
    dir: NOTEBOOK.readDir.clone().add(v(0, 0.1, 0)).normalize(),
    surface: [NOTEBOOK.w * 2 + 0.06, NOTEBOOK.h + 0.04],
    // as large as the space under the header allows (see sectionShot)
    fill: 0.94,
    fillW: 0.97,
  },
  // the board fills most of the view, with its frame and a little lab around it
  research: { target: WHITEBOARD.center, dir: v(0.08, 0.03, 1).normalize(), surface: [WHITEBOARD.w + 0.3, WHITEBOARD.h + 0.3], fill: 0.95, fillW: 0.95 },
  projects: { target: MONITOR.center, dir: v(0.1, 0.1, 1).normalize(), surface: [MONITOR.w, MONITOR.h], fill: 0.66 },
  beyond: { target: SCRAPBOOK_READ, dir: SCRAPBOOK.readDir, surface: [SCRAPBOOK.w * 2, SCRAPBOOK.h], fill: 0.34 },
};

/** Room hotspot anchors, next to each object. */
export const HOTSPOTS: Record<SectionId, THREE.Vector3> = {
  about: v(NOTEBOOK.rest.x + 0.1, NOTEBOOK.rest.y + 0.15, NOTEBOOK.rest.z),
  research: v(WHITEBOARD.center.x - WHITEBOARD.w / 2 + 0.35, WHITEBOARD.center.y + 0.55, WHITEBOARD.center.z + 0.1),
  projects: v(MONITOR.center.x + MONITOR.w / 2 + 0.05, MONITOR.center.y + 0.1, MONITOR.center.z + 0.1),
  beyond: v(CAT.pos.x - 0.1, 0.75, CAT.pos.z + 0.1),
  cv: v((PEDESTAL.x0 + PEDESTAL.x1) / 2, DESK.top - 0.22, PEDESTAL.z1 + 0.05),
};
