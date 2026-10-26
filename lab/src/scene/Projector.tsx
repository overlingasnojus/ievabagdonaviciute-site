import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SECTIONS, type SectionId } from '../content';
import { anim } from '../state/anim';
import { getNav } from '../state/nav';
import { HOTSPOTS } from './layout';
import { dom, surfaces } from './registry';

// Runs last each frame: pins DOM hotspots and the open section's HTML surface to their
// 3D objects, pushes animation values into CSS, then renders.

/** Below these projected sizes an in-world surface becomes a screen-sized panel. */
const MIN_ANCHORED: Record<SectionId, [number, number]> = {
  about: [420, 230],
  research: [380, 220],
  projects: [380, 220],
  beyond: [420, 220],
  cv: [260, 320],
};

const tmp = new THREE.Vector3();
const screen = new Float64Array(8);

// --- homography: CSS matrix3d mapping a w×h box onto four screen points ----------
// (TL, TR, BR, BL). Standard projective mapping via 3×3 adjugates.

type M3 = number[];
const adj = (m: M3): M3 => [
  m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
  m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
  m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
];
const mulMM = (a: M3, b: M3): M3 => {
  const c: M3 = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) c[3 * i + j] += a[3 * i + k] * b[3 * k + j];
  return c;
};
const mulMV = (m: M3, v: number[]) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
function basis(p: ArrayLike<number>): M3 {
  const m = [p[0], p[2], p[4], p[1], p[3], p[5], 1, 1, 1];
  const v = mulMV(adj(m), [p[6], p[7], 1]);
  return mulMM(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
function homography(w: number, h: number, dst: ArrayLike<number>) {
  // source order matches dst: TL, TR, BL, BR for the basis (4th point is the extra one)
  const src = [0, 0, w, 0, 0, h, w, h];
  const d = [dst[0], dst[1], dst[2], dst[3], dst[6], dst[7], dst[4], dst[5]];
  const t = mulMM(basis(d), adj(basis(src)));
  for (let i = 0; i < 9; i++) t[i] /= t[8];
  return `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`;
}
const corners = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

export function Projector() {
  const lastIntro = useRef(-1);
  const lastSize = useRef<[number, number]>([0, 0]);

  useFrame(({ gl, scene, camera, size }) => {
    scene.updateMatrixWorld();
    const toScreen = (p: THREE.Vector3) => {
      tmp.copy(p).project(camera);
      return [((tmp.x + 1) / 2) * size.width, ((1 - tmp.y) / 2) * size.height] as const;
    };

    for (const { id } of SECTIONS) {
      const el = dom.hotspots[id];
      if (!el) continue;
      const [x, y] = toScreen(HOTSPOTS[id]);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }

    const root = document.documentElement;
    if (Math.abs(lastIntro.current - anim.ui.intro) > 0.001) {
      lastIntro.current = anim.ui.intro;
      root.style.setProperty('--intro', anim.ui.intro.toFixed(3));
    }
    if (dom.veil) dom.veil.style.opacity = anim.ui.veil.toFixed(3);

    const id = getNav().section;
    const el = dom.surface;
    const target = id ? surfaces[id] : undefined;
    // Only lay the surface out while it is (becoming) visible; until then it has nothing to show.
    if (id && el && target && anim.ui.content > 0.0005) {
      const [w, h] = target.size;
      const o = target.object;
      corners[0].set(-w / 2, h / 2, 0); // top-left
      corners[1].set(w / 2, h / 2, 0); // top-right
      corners[2].set(w / 2, -h / 2, 0); // bottom-right
      corners[3].set(-w / 2, -h / 2, 0); // bottom-left
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      corners.forEach((c, i) => {
        const [x, y] = toScreen(o.localToWorld(c));
        screen[i * 2] = x;
        screen[i * 2 + 1] = y;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
      const [minW, minH] = MIN_ANCHORED[id];
      const mode = maxX - minX < minW || maxY - minY < minH ? 'panel' : 'anchored';
      if (el.dataset.mode !== mode) {
        el.dataset.mode = mode;
        el.dispatchEvent(new CustomEvent('surfacemode', { detail: mode }));
      }
      if (mode === 'anchored') {
        // Lay the element out at its projected size, then map its corners exactly onto
        // the projected corners of the 3D surface with a homography.
        const bw = Math.round(maxX - minX);
        const bh = Math.round(maxY - minY);
        if (Math.abs(bw - lastSize.current[0]) > 1 || Math.abs(bh - lastSize.current[1]) > 1) {
          lastSize.current = [bw, bh];
          el.style.width = `${bw}px`;
          el.style.height = `${bh}px`;
        }
        const [cw, ch] = lastSize.current;
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.transform = homography(cw, ch, screen);
      } else {
        el.style.left = el.style.top = el.style.width = el.style.height = el.style.transform = '';
        lastSize.current = [0, 0];
      }
      // The notebook brings its blocks in one by one (see --reveal in the CSS).
      el.style.opacity = (id === 'about' ? Math.min(1, anim.ui.content * 4) : anim.ui.content).toFixed(3);
      el.style.setProperty('--reveal', anim.ui.content.toFixed(3));
      el.style.setProperty('--boot', anim.projects.boot.toFixed(3));
    } else if (el) {
      el.style.opacity = '0';
      lastSize.current = [0, 0];
    }

    gl.render(scene, camera);
  }, 1);

  return null;
}
