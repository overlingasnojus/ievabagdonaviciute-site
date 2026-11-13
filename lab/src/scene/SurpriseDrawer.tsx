import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { takeEgg } from '../state/eggs';
import { getNav } from '../state/nav';
import { Bubble, EggTarget, Floaters, type FloatersApi, smooth, windowed } from './eggParts';
import { DESK, PALETTE as P } from './layout';
import { Box, Cyl } from './parts';
import { heartSprite } from './textures';

// The drawer pedestal under the robot arm's desk (desk A). Click it and the top drawer
// slides out, a jack-in-the-box robot springs up waving a little Lithuanian flag and
// says "labas!" (Lithuanian for "hi"), then it tucks itself back in and the drawer
// shuts. With reduced motion it rises without the spring bounce.
//
// Local frame: origin on the pedestal's front face, +x out of the drawer (into the room),
// z along the drawer width.

const { a, top, thickness } = DESK;
const FRONT_X = a.x0 + 1.3; // pedestal front face (world x)
const Z = a.z1 - 0.62;
const Y0 = 0.06;
const Y1 = top - thickness - 0.02;
const DH = (Y1 - Y0) / 2; // drawer height
const WIDTH = 0.96;
const TOP_Y = Y0 + DH * 1.5; // centre of the top drawer
const TRAVEL = 0.66;
const DEPTH = 0.7;
const BOTTOM_Y = TOP_Y - DH / 2 + 0.06;
const JACK_X = -0.22; // relative to the drawer front
const SPRING = { min: 0.06, max: 0.82, rings: 8 };
const HEAD_H = 0.26;
const FACE = THREE.MathUtils.degToRad(52);
const T = { open: 0.45, pop: 0.4, retract: 3.5, closeFrom: 3.95, end: 4.45 };

const LT = { yellow: '#FDB913', green: '#006A44', red: '#C1272D' };

function DrawerFront({ y, children }: { y: number; children?: ReactNode }) {
  const w = WIDTH - 0.06;
  const h = DH - 0.05;
  return (
    <group position={[0.02, y, 0]}>
      <Box size={[0.04, h, w]} color={P.cream} />
      <Box size={[0.012, h - 0.14, w - 0.14]} position={[0.024, 0, 0]} color="#F7EFE3" />
      <Box size={[0.035, 0.035, 0.26]} position={[0.05, DH * 0.22, 0]} color="#B9B3BC" metal />
      {children}
    </group>
  );
}

export function SurpriseDrawer() {
  const drawer = useRef<THREE.Group>(null);
  const jack = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group[]>([]);
  const head = useRef<THREE.Group>(null);
  const flag = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const hearts = useRef<THREE.Group>(null);
  const egg = useRef<{ t: number; reduced: boolean; burst: boolean } | null>(null);
  const bubble = useRef(0);
  const floaters = useRef<FloatersApi | null>(null);
  const bubbleAt = useRef(new THREE.Vector3()).current;
  const tmp = useRef(new THREE.Vector3()).current;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const nav = getNav();
    if (takeEgg('drawer') && !egg.current && nav.phase === 'overview') egg.current = { t: 0, reduced: nav.reducedMotion, burst: false };
    if (egg.current && nav.phase !== 'overview') egg.current = null;
    const e = egg.current;

    let slide = 0;
    let ext = 0;
    let wobble = 0;
    let happy = false;
    if (e) {
      e.t += dt;
      const t = e.t;
      slide = smooth(t / T.open) * (1 - smooth((t - T.closeFrom) / (T.end - T.closeFrom)));
      const tp = t - T.pop;
      if (tp > 0) {
        // a springy pop: overshoot and settle (plain ease with reduced motion)
        const up = e.reduced ? smooth(tp / 0.4) : 1 - Math.exp(-tp * 7) * Math.cos(tp * 16);
        ext = up * (1 - smooth((t - T.retract) / (T.closeFrom - T.retract - 0.05)));
        if (!e.reduced) wobble = Math.sin(tp * 7) * Math.min(1, tp * 2) * (1 - smooth((t - T.retract + 0.3) / 0.3));
      }
      happy = t > T.pop + 0.25 && t < T.retract;
      if (!e.burst && t > T.pop + 0.35) {
        e.burst = true;
        if (head.current) floaters.current?.emit(head.current.getWorldPosition(tmp).add(new THREE.Vector3(0, 0.2, 0)), 5);
      }
      if (t >= T.end) egg.current = null;
    }

    const x = slide * TRAVEL;
    if (drawer.current) drawer.current.position.x = x;
    if (jack.current) jack.current.visible = !!e;
    const h = SPRING.min + (SPRING.max - SPRING.min) * Math.max(ext, 0);
    rings.current.forEach((r, i) => {
      if (!r) return;
      const k = i / (SPRING.rings - 1);
      r.position.set((i % 2 ? 0.025 : -0.025) * Math.min(1, ext * 2), k * h, 0);
    });
    if (head.current) {
      head.current.position.set(wobble * 0.04, h + HEAD_H / 2 + 0.02, 0);
      head.current.rotation.set(0, FACE + wobble * 0.25, wobble * 0.18, 'YXZ');
      head.current.getWorldPosition(bubbleAt).add(new THREE.Vector3(0, 0.3, 0));
    }
    if (flag.current) flag.current.rotation.y = Math.sin((e?.t ?? 0) * 11) * (e?.reduced ? 0 : 0.45);
    if (eyes.current) eyes.current.visible = !happy;
    if (hearts.current) hearts.current.visible = happy;
    bubble.current = e ? windowed(e.t, T.pop + 0.3, T.retract - 0.1, 0.2) : 0;
  });

  const white = '#F7F5F2';
  const dark = '#2B2630';
  const heart = heartSprite();
  return (
    <>
      <Bubble text="labas!" heart anchor={bubbleAt} show={bubble} />
      <Floaters map={heart} colors={[LT.yellow, LT.green, LT.red, P.raspberry]} api={floaters} size={0.15} seed={31} />
      <EggTarget id="drawer">
        {/* pedestal carcass */}
        <Box size={[1.2, top - thickness - 0.06, 1.0]} position={[a.x0 + 0.7, (top - thickness - 0.06) / 2 + 0.03, Z]} color={P.creamDark} />
        <group position={[FRONT_X, 0, Z]}>
          {/* dark opening, seen only while the top drawer is out */}
          <mesh position={[0.006, TOP_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[WIDTH - 0.08, DH - 0.06]} />
            <meshBasicMaterial color="#3A2A33" />
          </mesh>
          <DrawerFront y={Y0 + DH / 2} />
          <group ref={drawer}>
            <DrawerFront y={TOP_Y} />
            {/* the drawer box behind its front */}
            <Box size={[DEPTH, 0.03, WIDTH - 0.14]} position={[-DEPTH / 2, BOTTOM_Y - 0.015, 0]} color="#E9DCC6" />
            {[-1, 1].map((s) => (
              <Box key={s} size={[DEPTH, DH - 0.14, 0.03]} position={[-DEPTH / 2, TOP_Y - 0.04, s * (WIDTH / 2 - 0.085)]} color={P.cream} />
            ))}
            <Box size={[0.03, DH - 0.14, WIDTH - 0.14]} position={[-DEPTH + 0.015, TOP_Y - 0.04, 0]} color={P.cream} />
            {/* tiny bits rattling around in the drawer: a screw and a resistor */}
            <Box size={[0.08, 0.02, 0.02]} position={[-0.5, BOTTOM_Y + 0.01, 0.25]} rotation={[0, 0.6, 0]} color="#B9B3BC" metal />
            <Box size={[0.1, 0.025, 0.025]} position={[-0.42, BOTTOM_Y + 0.012, -0.25]} rotation={[0, -0.4, 0]} color="#E8C9A8" />

            <group ref={jack} position={[JACK_X, BOTTOM_Y, 0]} visible={false}>
              <Box size={[0.22, 0.04, 0.22]} position={[0, 0.02, 0]} color={P.raspberry} />
              {Array.from({ length: SPRING.rings }, (_, i) => (
                <group key={i} ref={(g) => void (g && (rings.current[i] = g))}>
                  <Cyl r={0.075} h={0.025} position={[0, 0.04, 0]} color={i % 2 ? '#B9B3BC' : P.raspberry} segments={10} metal={i % 2 === 1} />
                </group>
              ))}
              <group ref={head}>
                <Box size={[0.32, HEAD_H, 0.26]} color={white} roughness={0.5} />
                <mesh position={[0, 0, 0.131]}>
                  <planeGeometry args={[0.25, 0.15]} />
                  <meshBasicMaterial color="#1F1A22" />
                </mesh>
                <group ref={eyes} position={[0, 0.01, 0.133]}>
                  {[-0.055, 0.055].map((x) => (
                    <mesh key={x} position={[x, 0, 0]}>
                      <planeGeometry args={[0.04, 0.05]} />
                      <meshBasicMaterial color="#F7E37A" />
                    </mesh>
                  ))}
                </group>
                <group ref={hearts} position={[0, 0.01, 0.134]} visible={false}>
                  {[-0.055, 0.055].map((x) => (
                    <mesh key={x} position={[x, 0, 0]}>
                      <planeGeometry args={[0.06, 0.05]} />
                      <meshBasicMaterial map={heart} color="#F28DB2" transparent />
                    </mesh>
                  ))}
                </group>
                <Box size={[0.04, 0.1, 0.12]} position={[0.18, 0, 0]} color="#D9D4DA" />
                <Box size={[0.04, 0.1, 0.12]} position={[-0.18, 0, 0]} color="#D9D4DA" />
                <Box size={[0.02, 0.1, 0.02]} position={[-0.07, HEAD_H / 2 + 0.05, 0]} color={dark} metal />
                <Box size={[0.05, 0.05, 0.05]} position={[-0.07, HEAD_H / 2 + 0.12, 0]} color={P.raspberry} emissive={P.raspberry} emissiveIntensity={0.5} />
                {/* a little Lithuanian flag on a stick */}
                <group position={[0.2, -0.02, 0.04]} scale={1.3}>
                  <Box size={[0.018, 0.42, 0.018]} position={[0, 0.17, 0]} color="#8A6A4E" />
                  <group ref={flag} position={[0, 0.34, 0]}>
                    <Box size={[0.22, 0.045, 0.008]} position={[0.11, 0.045, 0]} color={LT.yellow} />
                    <Box size={[0.22, 0.045, 0.008]} position={[0.11, 0, 0]} color={LT.green} />
                    <Box size={[0.22, 0.045, 0.008]} position={[0.11, -0.045, 0]} color={LT.red} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </EggTarget>
    </>
  );
}
