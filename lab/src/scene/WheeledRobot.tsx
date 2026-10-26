import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { getNav } from '../state/nav';
import { pokeRobot, robot } from '../state/robot';
import { PALETTE as P } from './layout';
import { Blob, Box, Cyl } from './parts';
import { heartEyeTexture, rng, robotFaceTexture } from './textures';

// The little rover patrols a short loop through the clear floor between the cabinet,
// the desks, the monstera and the rug: pause, turn to face the next waypoint, drive,
// repeat. Waypoints keep its 0.45-unit footprint at least ~0.5 from furniture, plants
// and the cat. Speed scales with anim.ambient.level, so it rolls to a stop when a
// section opens and stays parked for reduced motion.
//
// Clicking (or the keyboard "say hi" button) plays a two-second hello: it eases out of
// its route, turns to the viewer, shows heart eyes, wiggles, spins if there's room,
// turns back and carries on. With reduced motion it only shows the heart eyes.

const ROUTE: [number, number][] = [
  [-2.1, 4.05], // home, near the front edge, clear of the cabinet
  [-1.4, 2.2],
  [0.1, 1.3],
  [-1.9, 0.8],
];
const WHEEL_R = 0.17;
const TRACK = 0.4; // half the distance between the left and right wheels
const SPEED = 0.55;
const TURN_RATE = 1.5;

/** Hello timeline, seconds. */
const HELLO = { turn: 0.45, wiggleEnd: 1.05, spinEnd: 1.6, end: 2.0, heartsFrom: 0.3, heartsTo: 1.8 };
/** Clearance needed to spin on the spot (the body's corners sweep this radius). */
const SPIN_CLEARANCE = 0.62;

type Mode = 'pause' | 'turn' | 'drive';

interface Hello {
  t: number;
  base: number; // route heading to come back to
  face: number; // heading that looks at the viewer
  spin: boolean;
  reduced: boolean;
}

function angleDiff(a: number, b: number) {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

const smooth = (x: number) => {
  const c = THREE.MathUtils.clamp(x, 0, 1);
  return c * c * (3 - 2 * c);
};

/** Distance from (x, z) to the nearest thing the spinning body could touch. */
function clearance(x: number, z: number) {
  const box = (x0: number, x1: number, z0: number, z1: number) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
  const circle = (cx: number, cz: number, r: number) => Math.hypot(cx - x, cz - z) - r;
  return Math.min(
    5 - z, // front edge of the floor
    x + 5, // left wall
    box(-5, -4.0, 2.1, 3.7), // cabinet
    box(-5, -3.5, -3.6, 0.6), // desk along the left wall
    circle(0.55, 4.0, 0.9), // monstera
    circle(-4.35, 4.35, 0.5), // floor plant
    circle(-1.1, -2.55, 0.45), // stool
    box(2.0, 4.2, 0.5, 2.6), // cat on the rug
  );
}

export function WheeledRobot() {
  const root = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const hearts = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const hover = useRef(0);
  const hovered = useRef(false);
  const st = useRef({
    x: ROUTE[0][0],
    z: ROUTE[0][1],
    heading: 0.85,
    shown: 0.85, // heading actually displayed (differs from `heading` during a hello)
    next: 1,
    mode: 'pause' as Mode,
    timer: 3,
    roll: [0, 0],
    resume: 1, // eases route motion back in after a hello
    hello: null as Hello | null,
    rand: rng(77),
  });

  useFrame(({ clock, camera }, rawDt) => {
    const s = st.current;
    const nav = getNav();
    const frameDt = Math.min(rawDt, 0.05);

    // Start a hello if one was asked for, and none is already playing.
    if (robot.requested) {
      robot.requested = false;
      if (!s.hello && nav.phase === 'overview') {
        s.hello = {
          t: 0,
          base: s.heading,
          face: Math.atan2(camera.position.x - s.x, camera.position.z - s.z),
          spin: clearance(s.x, s.z) > SPIN_CLEARANCE,
          reduced: nav.reducedMotion,
        };
      }
    }
    // A section opening cuts a hello short; the shown heading eases back below.
    if (s.hello && nav.phase !== 'overview') s.hello = null;

    // Route motion pauses smoothly for a hello and eases back in afterwards.
    const hello = s.hello;
    if (hello) s.resume = Math.max(0, 1 - hello.t / 0.25);
    else s.resume = Math.min(1, s.resume + frameDt / 0.35);
    const dt = frameDt * anim.ambient.level * s.resume;

    const [tx, tz] = ROUTE[s.next];
    const dx = tx - s.x;
    const dz = tz - s.z;
    const dist = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz);
    let forward = 0;

    if (s.mode === 'pause') {
      s.timer -= dt;
      if (s.timer <= 0) s.mode = 'turn';
    } else if (s.mode === 'turn') {
      const d = angleDiff(s.heading, want);
      s.heading += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * dt);
      if (Math.abs(d) < 0.01) s.mode = 'drive';
    } else {
      const v = SPEED * Math.min(1, dist / 0.35 + 0.15);
      const step = Math.min(dist, v * dt);
      s.x += Math.sin(s.heading) * step;
      s.z += Math.cos(s.heading) * step;
      // stay locked onto the waypoint direction while driving
      s.heading += angleDiff(s.heading, want) * Math.min(1, dt * 4);
      forward = step;
      if (dist < 0.005) {
        s.next = (s.next + 1) % ROUTE.length;
        s.mode = 'pause';
        s.timer = 1.8 + s.rand() * 3.5;
      }
    }

    // The heading on show: the route heading, or the hello choreography.
    let shown = s.heading;
    let bob = 0;
    if (hello) {
      hello.t += frameDt;
      const t = hello.t;
      if (!hello.reduced) {
        const face = hello.base + angleDiff(hello.base, hello.face);
        if (t < HELLO.turn) shown = THREE.MathUtils.lerp(hello.base, face, smooth(t / HELLO.turn));
        else if (t < HELLO.wiggleEnd) {
          const k = (t - HELLO.turn) / (HELLO.wiggleEnd - HELLO.turn);
          shown = face + Math.sin(k * Math.PI * 4) * (hello.spin ? 0.24 : 0.14) * (1 - k * 0.3);
          bob = Math.abs(Math.sin(k * Math.PI * 4)) * 0.03;
        } else if (t < HELLO.spinEnd) shown = face + (hello.spin ? Math.PI * 2 * smooth((t - HELLO.wiggleEnd) / (HELLO.spinEnd - HELLO.wiggleEnd)) : 0);
        else shown = THREE.MathUtils.lerp(face, hello.base, smooth((t - HELLO.spinEnd) / (HELLO.end - HELLO.spinEnd)));
      }
      if (t >= HELLO.end) s.hello = null;
    } else {
      // after an interrupted hello, settle back onto the route heading
      shown = s.shown + angleDiff(s.shown, s.heading) * Math.min(1, frameDt * 8);
    }

    // Wheels: forward motion rolls both sides; turning on the spot rolls them opposite.
    const turnDelta = angleDiff(s.shown, shown);
    s.shown = shown;
    s.roll[0] += (forward + turnDelta * TRACK) / WHEEL_R;
    s.roll[1] += (forward - turnDelta * TRACK) / WHEEL_R;

    hover.current = THREE.MathUtils.damp(hover.current, hovered.current && nav.phase === 'overview' ? 1 : 0, 12, frameDt);

    if (root.current) {
      root.current.position.set(s.x, 0, s.z);
      root.current.rotation.y = shown;
    }
    wheels.current.forEach((w, i) => w && (w.rotation.x = s.roll[i % 2]));
    robot.anchor.set(s.x, 1.25, s.z);

    const happy = !!hello && hello.t > HELLO.heartsFrom && hello.t < HELLO.heartsTo;
    const t = clock.elapsedTime;
    const cycle = t % 4.6;
    const blink = !happy && cycle > 4.3 && cycle < 4.42 ? 0.12 : 1;
    if (eyes.current) {
      eyes.current.visible = !happy;
      eyes.current.scale.y = blink;
      eyes.current.position.x = s.mode === 'drive' || hello ? 0 : Math.round(Math.sin(t * 0.4) * 2) * 0.02 * anim.ambient.level;
    }
    if (hearts.current) hearts.current.visible = happy;
    if (head.current) {
      const idle = s.mode === 'pause' && !hello ? Math.sin(t * 0.4) * 0.14 * anim.ambient.level : 0;
      head.current.rotation.y = idle;
      // hover: the head perks up a little
      head.current.rotation.x = -0.12 * hover.current;
      head.current.position.y = 0.88 + bob + 0.02 * hover.current;
    }
  });

  const white = '#F7F5F2';
  const dark = '#2B2630';
  const wheelSpots: [number, number, number][] = [
    [-0.4, 0, -0.27],
    [0.4, 1, -0.27],
    [-0.4, 0, 0.27],
    [0.4, 1, 0.27],
  ];
  const heart = heartEyeTexture();
  return (
    <group
      ref={root}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (getNav().phase !== 'overview') return;
        hovered.current = true;
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        // a robot hello only: never a section, never the camera
        e.stopPropagation();
        pokeRobot();
      }}
    >
      <Blob position={[0, 0.004, 0]} size={[1.35, 1.25]} />
      {wheelSpots.map(([x, side, z], i) => (
        <group key={i} position={[x, WHEEL_R, z]}>
          <group ref={(g) => void (g && (wheels.current[i] = g))} userData={{ side }}>
            <Cyl r={WHEEL_R} h={0.14} rotation={[0, 0, Math.PI / 2]} color={dark} segments={14} />
            <Cyl r={0.08} h={0.15} rotation={[0, 0, Math.PI / 2]} color="#8A8290" segments={8} metal />
            {/* tread marks make the rolling readable */}
            <Box size={[0.145, 0.04, 0.03]} position={[0, WHEEL_R - 0.01, 0]} color="#4A4450" />
            <Box size={[0.145, 0.04, 0.03]} position={[0, -WHEEL_R + 0.01, 0]} color="#4A4450" />
          </group>
        </group>
      ))}
      <Box size={[0.66, 0.32, 0.62]} position={[0, 0.4, 0]} color={white} roughness={0.5} />
      <Box size={[0.68, 0.06, 0.64]} position={[0, 0.26, 0]} color={dark} />
      <Box size={[0.02, 0.1, 0.4]} position={[0.34, 0.42, 0]} color={P.raspberry} />
      <Box size={[0.02, 0.1, 0.4]} position={[-0.34, 0.42, 0]} color={P.raspberry} />
      <Box size={[0.3, 0.08, 0.02]} position={[0, 0.42, 0.315]} color="#3A3440" />
      <Box size={[0.18, 0.1, 0.18]} position={[0, 0.61, 0]} color={dark} metal />
      <group ref={head} position={[0, 0.88, 0]}>
        <Box size={[0.66, 0.42, 0.48]} color={white} roughness={0.5} />
        <mesh position={[0, 0, 0.241]}>
          <planeGeometry args={[0.54, 0.3]} />
          <meshStandardMaterial map={robotFaceTexture()} roughness={0.15} />
        </mesh>
        <group ref={eyes} position={[0, 0.02, 0.244]}>
          <mesh position={[-0.11, 0, 0]}>
            <planeGeometry args={[0.08, 0.1]} />
            <meshBasicMaterial color="#F7E37A" />
          </mesh>
          <mesh position={[0.11, 0, 0]}>
            <planeGeometry args={[0.08, 0.1]} />
            <meshBasicMaterial color="#F7E37A" />
          </mesh>
        </group>
        <group ref={hearts} position={[0, 0.02, 0.245]} visible={false}>
          {[-0.11, 0.11].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <planeGeometry args={[0.12, 0.1]} />
              <meshBasicMaterial map={heart} transparent />
            </mesh>
          ))}
        </group>
        <Box size={[0.04, 0.2, 0.04]} position={[0.2, 0.3, -0.05]} color={dark} metal />
        <Box size={[0.08, 0.08, 0.08]} position={[0.2, 0.42, -0.05]} color={P.raspberry} emissive={P.raspberry} emissiveIntensity={0.5} />
        <Box size={[0.06, 0.16, 0.2]} position={[0.36, 0, 0]} color="#D9D4DA" />
        <Box size={[0.06, 0.16, 0.2]} position={[-0.36, 0, 0]} color="#D9D4DA" />
      </group>
    </group>
  );
}
