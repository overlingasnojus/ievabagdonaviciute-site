import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { HitBox, Interactive } from './Interactive';
import { CAMERA, DESK, PALETTE as P, PAPER, PEDESTAL } from './layout';
import { Box } from './parts';
import { PLACEHOLDERS } from '../content';
import { cvViewerRect } from './cvViewer';
import { surfaces, viewport } from './registry';
import { quadBezier } from './Notebook';

// CV: the camera stays put. The top drawer of the pedestal slides out, the first page of
// the CV rises from it and flies toward the viewer, turning to face them, and settles
// exactly where the scrollable HTML document viewer appears (see cvViewer.ts). A
// translucent veil just behind the page dims the room.

const { x0, x1, z0, z1, drawerH, travel } = PEDESTAL;
const cx = (x0 + x1) / 2;
const depth = z1 - z0 - 0.08;
const slotBottom = DESK.top - DESK.thickness - drawerH - 0.02;
const closedPos = new THREE.Vector3(cx, slotBottom + drawerH / 2, z1 - depth / 2);
const paperLocal = new THREE.Vector3(0, -drawerH / 2 + 0.06, 0);
const flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
const TAN_V = Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));

const v = {
  rest: new THREE.Vector3(),
  lifted: new THREE.Vector3(),
  view: new THREE.Vector3(),
  ctrl: new THREE.Vector3(),
  ray: new THREE.Vector3(),
  fwd: new THREE.Vector3(),
  pos: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  q2: new THREE.Quaternion(),
};

/**
 * Distance in front of the camera, and the screen height (NDC y) of the page centre,
 * at which the paper exactly covers the viewer's width with its top edge at the
 * viewer's top. The page is taller than the viewer; the rest is reached by scrolling.
 */
function viewPose(aspect: number) {
  const { width: vw, height: vh } = viewport;
  const rect = cvViewerRect(vw, vh);
  const D = (PAPER.w * vw) / (2 * TAN_V * aspect * rect.width);
  const centreY = rect.top + (rect.width * (PAPER.h / PAPER.w)) / 2;
  return { D, ndcY: 1 - (2 * centreY) / vh };
}

export function Cv() {
  const drawer = useRef<THREE.Group>(null);
  const paper = useRef<THREE.Mesh>(null);
  const veil = useRef<THREE.Mesh>(null);
  const veilMat = useRef<THREE.MeshBasicMaterial>(null);
  const gl = useThree((st) => st.gl);
  // The flying sheet is the real first page of the CV, so the hand-off to the HTML
  // viewer is seamless. Loaded in the background; plain paper until then.
  const pageTexture = useMemo(() => {
    const t = new THREE.TextureLoader().load(PLACEHOLDERS.cv.pages[0]);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = gl.capabilities.getMaxAnisotropy();
    return t;
  }, [gl]);
  useEffect(() => () => pageTexture.dispose(), [pageTexture]);

  useEffect(() => {
    if (paper.current) surfaces.cv = { object: paper.current, size: [PAPER.w, PAPER.h] };
    return () => void delete surfaces.cv;
  }, []);

  useFrame(({ camera }) => {
    const d = drawer.current;
    const p = paper.current;
    if (!d || !p) return;
    const c = anim.cv;
    const cam = camera as THREE.PerspectiveCamera;

    d.position.copy(closedPos);
    d.position.z += travel * c.drawer + anim.hover.cv * 0.06;
    d.updateMatrixWorld();

    // rest pose inside the drawer, then lifted clear of it
    d.localToWorld(v.rest.copy(paperLocal));
    v.lifted.copy(v.rest);
    v.lifted.y += 0.6 * c.lift;
    v.q.copy(flat).premultiply(d.getWorldQuaternion(v.q2));
    v.q.multiply(v.q2.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.35 * c.lift));

    if (c.fly > 0) {
      const { D, ndcY } = viewPose(cam.aspect);
      cam.getWorldDirection(v.fwd);
      v.ray.set(0, ndcY, 0.5).unproject(cam).sub(cam.position).normalize();
      v.view.copy(cam.position).addScaledVector(v.ray, D / v.ray.dot(v.fwd));

      // Interpolate in inverse depth so the page grows at an even perceived rate
      // instead of ballooning in the last few frames.
      const d0 = v.fwd.dot(v.pos.copy(v.lifted).sub(cam.position));
      const depthAt = 1 / ((1 - c.fly) / d0 + c.fly / D);
      const s = THREE.MathUtils.clamp((d0 - depthAt) / (d0 - D), 0, 1);
      v.ctrl.lerpVectors(v.lifted, v.view, 0.3);
      v.ctrl.y += 2.2;
      quadBezier(v.lifted, v.ctrl, v.view, s, v.pos);
      p.position.copy(v.pos);
      p.quaternion.copy(v.q).slerp(cam.quaternion, Math.min(1, c.fly * 1.2));
    } else {
      p.position.copy(v.lifted);
      p.quaternion.copy(v.q);
    }

    // Once the HTML pages are fully shown they take over; hide the sheet beneath them so
    // it doesn't show through the gap between pages while scrolling.
    p.visible = anim.ui.content < 0.999;

    const veilOn = anim.ui.dim > 0.001;
    if (veil.current && veilMat.current) {
      veil.current.visible = veilOn;
      if (veilOn) {
        const D = viewPose(cam.aspect).D + 0.6;
        cam.getWorldDirection(v.fwd);
        veil.current.position.copy(cam.position).addScaledVector(v.fwd, D);
        veil.current.quaternion.copy(cam.quaternion);
        const h = 2 * D * TAN_V * 2.2;
        veil.current.scale.set(h * cam.aspect * 1.6, h, 1);
        veilMat.current.opacity = anim.ui.dim * 0.34;
      }
    }
  });

  const slotH = drawerH + 0.02;
  const lowerH = slotBottom - 0.04;
  return (
    <group>
      {/* pedestal body: solid lower drawers, open slot for the top drawer */}
      <Box size={[x1 - x0, lowerH, z1 - z0]} position={[cx, 0.04 + lowerH / 2, (z0 + z1) / 2]} color={P.creamDark} />
      {[0, 1].map((i) => {
        const h = lowerH / 2;
        const y = 0.04 + h * (i + 0.5);
        return (
          <group key={i}>
            <Box size={[x1 - x0 - 0.06, h - 0.05, 0.04]} position={[cx, y, z1 + 0.01]} color={P.cream} />
            <Box size={[0.26, 0.04, 0.04]} position={[cx, y + h * 0.22, z1 + 0.045]} color={P.metal} />
          </group>
        );
      })}
      <Box size={[0.04, slotH, z1 - z0]} position={[x0 + 0.02, slotBottom + slotH / 2, (z0 + z1) / 2]} color={P.creamDark} />
      <Box size={[0.04, slotH, z1 - z0]} position={[x1 - 0.02, slotBottom + slotH / 2, (z0 + z1) / 2]} color={P.creamDark} />
      <Box size={[x1 - x0, slotH, 0.04]} position={[cx, slotBottom + slotH / 2, z0 + 0.02]} color="#4A3040" />

      <Interactive id="cv">
        <group ref={drawer}>
          <Box size={[x1 - x0 - 0.06, drawerH - 0.02, 0.05]} position={[0, 0, depth / 2 + 0.035]} color={P.cream} />
          <Box size={[0.3, 0.045, 0.045]} position={[0, drawerH * 0.18, depth / 2 + 0.08]} color={P.raspberry} />
          <Box size={[0.16, 0.05, 0.012]} position={[0, -drawerH * 0.18, depth / 2 + 0.064]} color="#FBF7F2" />
          <Box size={[x1 - x0 - 0.12, 0.03, depth]} position={[0, -drawerH / 2 + 0.03, 0]} color="#E9DCC6" />
          <Box size={[0.03, drawerH - 0.08, depth]} position={[-(x1 - x0) / 2 + 0.075, -0.02, 0]} color={P.creamDark} />
          <Box size={[0.03, drawerH - 0.08, depth]} position={[(x1 - x0) / 2 - 0.075, -0.02, 0]} color={P.creamDark} />
          <Box size={[x1 - x0 - 0.12, drawerH - 0.08, 0.03]} position={[0, -0.02, -depth / 2 + 0.015]} color={P.creamDark} />
          <HitBox size={[x1 - x0 + 0.1, drawerH + 0.2, 0.5]} position={[0, 0, depth / 2]} />
        </group>
      </Interactive>

      <mesh ref={paper} castShadow userData={{ noHighlight: true }}>
        <planeGeometry args={[PAPER.w, PAPER.h]} />
        <meshBasicMaterial map={pageTexture} toneMapped={false} />
        {/* plain back of the sheet, so the page never reads mirrored mid-flight */}
        <mesh rotation={[0, Math.PI, 0]} userData={{ noHighlight: true }}>
          <planeGeometry args={[PAPER.w, PAPER.h]} />
          <meshBasicMaterial color="#FFFDF8" toneMapped={false} />
        </mesh>
      </mesh>

      <mesh ref={veil} visible={false} renderOrder={5}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={veilMat} color={P.burgundy} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
