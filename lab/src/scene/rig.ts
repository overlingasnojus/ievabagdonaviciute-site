import * as THREE from 'three';
import type { SectionId } from '../content';
import { CAMERA, ROOM_BOUNDS, SHOTS } from './layout';

// The overview frames the room inside the "stage slot" (the right-hand part of the
// page on desktop, the lower part on phones). The canvas itself fills the viewport, so
// the room is moved into the slot with a camera view offset rather than a CSS box.
// Section shots are centred in the full viewport.

export interface Shot {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  /** View offset as a fraction of the viewport; 0,0 means centred. */
  offset: THREE.Vector2;
}

export interface Viewport {
  width: number;
  height: number;
  /** Stage slot rectangle in CSS pixels. */
  slot: { x: number; y: number; width: number; height: number };
}

const tmpCam = new THREE.PerspectiveCamera();
const tmpV = new THREE.Vector3();

function applyShot(cam: THREE.PerspectiveCamera, shot: Shot, width: number, height: number) {
  cam.position.copy(shot.pos);
  cam.lookAt(shot.target);
  // setViewOffset also sets aspect = fullWidth / fullHeight, so pass real pixel sizes.
  cam.aspect = width / height;
  if (shot.offset.x === 0 && shot.offset.y === 0) cam.clearViewOffset();
  else cam.setViewOffset(width, height, shot.offset.x * width, shot.offset.y * height, width, height);
  cam.updateMatrixWorld();
}

export function overviewShot(vp: Viewport): Shot {
  const { azimuth, elevation, target } = CAMERA.overview;
  const dir = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );
  const { slot, width, height } = vp;
  const offset = new THREE.Vector2((width / 2 - (slot.x + slot.width / 2)) / width, (height / 2 - (slot.y + slot.height / 2)) / height);

  tmpCam.fov = CAMERA.fov;
  tmpCam.aspect = width / height;
  tmpCam.near = CAMERA.near;
  tmpCam.far = CAMERA.far;

  const pad = Math.min(slot.width, slot.height) * 0.03;
  const fits = (d: number) => {
    applyShot(tmpCam, { pos: target.clone().addScaledVector(dir, d), target, offset }, width, height);
    for (const p of ROOM_BOUNDS) {
      tmpV.copy(p).project(tmpCam);
      const px = ((tmpV.x + 1) / 2) * width;
      const py = ((1 - tmpV.y) / 2) * height;
      if (px < slot.x + pad || px > slot.x + slot.width - pad || py < slot.y + pad || py > slot.y + slot.height - pad) return false;
    }
    return true;
  };

  let lo = 8;
  let hi = 160;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return { pos: target.clone().addScaledVector(dir, hi), target: target.clone(), offset };
}

/** Camera distance at which a surface fills `fill` of the viewport. */
function distanceToFit(surface: [number, number], fill: number, aspect: number, fillWidth = fill) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));
  // Narrow screens use more of the width so the surface isn't tiny.
  const fillW = aspect < 0.8 ? Math.min(0.94, fillWidth * 1.45) : fillWidth;
  const dH = surface[1] / (2 * tanV * fill);
  const dW = surface[0] / (2 * tanV * aspect * fillW);
  return Math.max(dH, dW);
}

export function sectionShot(id: SectionId, vp: Viewport): Shot {
  if (id === 'cv') return overviewShot(vp);
  const spec = SHOTS[id];
  const d = distanceToFit(spec.surface, spec.fill, vp.width / vp.height, spec.fillW);
  return {
    pos: spec.target.clone().addScaledVector(spec.dir, d),
    target: spec.target.clone(),
    offset: new THREE.Vector2(0, 0),
  };
}

/**
 * Point along the travel path. The path is a quadratic Bézier whose control point sits
 * out along the destination's sight line, so the camera makes its final approach
 * straight through open space instead of cutting across furniture.
 */
export function blendShot(from: Shot, to: Shot, spec: { dir: THREE.Vector3 } | null, t: number, out: Shot) {
  const u = 1 - t;
  if (spec) {
    const dist = to.pos.distanceTo(to.target);
    const ctrl = to.pos.clone().addScaledVector(spec.dir, dist * 1.2 + 2);
    ctrl.y = Math.max(ctrl.y, to.pos.y + 1.5);
    out.pos.set(0, 0, 0).addScaledVector(from.pos, u * u).addScaledVector(ctrl, 2 * u * t).addScaledVector(to.pos, t * t);
  } else {
    out.pos.lerpVectors(from.pos, to.pos, t);
  }
  out.target.lerpVectors(from.target, to.target, t);
  out.offset.lerpVectors(from.offset, to.offset, t);
  return out;
}

export function applyShotTo(cam: THREE.PerspectiveCamera, shot: Shot, vp: Viewport) {
  applyShot(cam, shot, vp.width, vp.height);
}

export function shotSpec(id: SectionId | null) {
  return id && id !== 'cv' ? SHOTS[id] : null;
}
