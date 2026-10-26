import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { PALETTE as P } from './layout';
import { Blob, Box, Cyl } from './parts';
import { rng, robotFaceTexture } from './textures';

// The little rover patrols a short loop through the clear floor between the cabinet,
// the desks, the monstera and the rug: pause, turn to face the next waypoint, drive,
// repeat. Waypoints keep its 0.45-unit footprint at least ~0.5 from furniture, plants
// and the cat. Speed scales with anim.ambient.level, so it rolls to a stop when a
// section opens and stays parked for reduced motion.

const ROUTE: [number, number][] = [
  [-2.1, 4.05], // home, near the front edge, clear of the cabinet
  [-1.4, 2.2],
  [0.1, 1.3],
  [-1.9, 0.8],
];
const WHEEL_R = 0.17;
const SPEED = 0.55;
const TURN_RATE = 1.5;

type Mode = 'pause' | 'turn' | 'drive';

function angleDiff(a: number, b: number) {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

export function WheeledRobot() {
  const root = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const st = useRef({
    x: ROUTE[0][0],
    z: ROUTE[0][1],
    heading: 0.85,
    next: 1,
    mode: 'pause' as Mode,
    timer: 3,
    roll: [0, 0],
    rand: rng(77),
  });

  useFrame(({ clock }, rawDt) => {
    const s = st.current;
    const dt = Math.min(rawDt, 0.05) * anim.ambient.level;
    const [tx, tz] = ROUTE[s.next];
    const dx = tx - s.x;
    const dz = tz - s.z;
    const dist = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz);
    let leftSpin = 0;
    let rightSpin = 0;

    if (s.mode === 'pause') {
      s.timer -= dt;
      if (s.timer <= 0) s.mode = 'turn';
    } else if (s.mode === 'turn') {
      const d = angleDiff(s.heading, want);
      const step = Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * dt);
      s.heading += step;
      // turning on the spot: wheels on each side roll opposite ways
      leftSpin = step * 0.4;
      rightSpin = -step * 0.4;
      if (Math.abs(d) < 0.01) s.mode = 'drive';
    } else {
      const v = SPEED * Math.min(1, dist / 0.35 + 0.15);
      const step = Math.min(dist, v * dt);
      s.x += Math.sin(s.heading) * step;
      s.z += Math.cos(s.heading) * step;
      // stay locked onto the waypoint direction while driving
      s.heading += angleDiff(s.heading, want) * Math.min(1, dt * 4);
      leftSpin = rightSpin = step;
      if (dist < 0.005) {
        s.next = (s.next + 1) % ROUTE.length;
        s.mode = 'pause';
        s.timer = 1.8 + s.rand() * 3.5;
      }
    }
    s.roll[0] += leftSpin / WHEEL_R;
    s.roll[1] += rightSpin / WHEEL_R;

    if (root.current) {
      root.current.position.set(s.x, 0, s.z);
      root.current.rotation.y = s.heading;
    }
    wheels.current.forEach((w, i) => w && (w.rotation.x = s.roll[i % 2]));

    const t = clock.elapsedTime;
    const cycle = t % 4.6;
    const blink = cycle > 4.3 && cycle < 4.42 ? 0.12 : 1;
    if (eyes.current) {
      eyes.current.scale.y = blink;
      eyes.current.position.x = s.mode === 'drive' ? 0 : Math.round(Math.sin(t * 0.4) * 2) * 0.02 * anim.ambient.level;
    }
    if (head.current) head.current.rotation.y = (s.mode === 'pause' ? Math.sin(t * 0.4) * 0.14 : 0) * anim.ambient.level;
  });

  const white = '#F7F5F2';
  const dark = '#2B2630';
  const wheelSpots: [number, number, number][] = [
    [-0.4, 0, -0.27],
    [0.4, 1, -0.27],
    [-0.4, 0, 0.27],
    [0.4, 1, 0.27],
  ];
  return (
    <group ref={root}>
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
        <Box size={[0.04, 0.2, 0.04]} position={[0.2, 0.3, -0.05]} color={dark} metal />
        <Box size={[0.08, 0.08, 0.08]} position={[0.2, 0.42, -0.05]} color={P.raspberry} emissive={P.raspberry} emissiveIntensity={0.5} />
        <Box size={[0.06, 0.16, 0.2]} position={[0.36, 0, 0]} color="#D9D4DA" />
        <Box size={[0.06, 0.16, 0.2]} position={[-0.36, 0, 0]} color="#D9D4DA" />
      </group>
    </group>
  );
}
