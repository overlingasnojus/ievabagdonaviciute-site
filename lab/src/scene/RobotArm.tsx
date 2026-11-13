import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anim } from '../state/anim';
import { takeEgg } from '../state/eggs';
import { getNav } from '../state/nav';
import { Bubble, EggTarget, Floaters, type FloatersApi, smooth as smoothClamped, windowed } from './eggParts';
import { DESK, PALETTE as P } from './layout';
import { Blob, Box, Cyl } from './parts';
import { heartSprite } from './textures';

// A desktop six-axis arm on desk A. Every movement happens at a joint pivot:
// turret yaw → shoulder pitch → elbow pitch → wrist pitch → wrist roll → gripper.
// Every ~16 s it demonstrates a pick: swings over the part on the desk, lowers the
// gripper, closes it, lifts and returns to rest. Poses were solved with two-link IK
// (L1 = 0.9, L2 = 0.75, shoulder 0.48 above the desk) so the fingers stay clear of
// the desk top.

const L1 = 0.9;
const L2 = 0.75;
const SHOULDER_Y = 0.48;

interface Pose {
  yaw: number;
  shoulder: number;
  elbow: number;
  wrist: number;
  roll: number;
  grip: number; // 0 open → 1 closed
}

const REST: Pose = { yaw: 0.9, shoulder: 0.45, elbow: 1.55, wrist: 0.75, roll: 0, grip: 0 };
const HOVER: Pose = { yaw: -0.785, shoulder: 0.074, elbow: 1.775, wrist: 1.29, roll: 0.785, grip: 0 };
const DOWN: Pose = { yaw: -0.785, shoulder: 0.46, elbow: 2.15, wrist: 0.53, roll: 0.785, grip: 0 };
const GRIP: Pose = { ...DOWN, grip: 1 };

// [time, pose] keyframes over one cycle; motion eases between them.
const CYCLE = 16;
const KEYS: [number, Pose][] = [
  [0, REST],
  [6, REST],
  [8.2, HOVER],
  [9.3, DOWN],
  [9.8, GRIP],
  [10.9, { ...HOVER, grip: 1 }],
  [11.3, HOVER],
  [13.5, REST],
  [CYCLE, REST],
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = THREE.MathUtils.lerp;

// Easter egg: click the arm and it says hi. It lifts its forearm in the plane facing
// the viewer, waves (opening and closing the gripper like a little hand), twirls its
// wrist, gives a small bow and sends up a few hearts, then eases back into whatever
// it was doing. The turret yaw stays near REST so the arm never swings toward the
// wall shelf above it. With reduced motion only the bubble and hearts appear.
const WAVE_END = 4.0;
const WAVE_UP: Pose = { yaw: 0.9, shoulder: 0.55, elbow: -0.3, wrist: 0, roll: Math.PI / 2, grip: 0 };

function wavePose(t: number, out: Pose) {
  Object.assign(out, WAVE_UP);
  if (t > 0.45 && t < 2.3) {
    const k = (t - 0.45) * Math.PI * 2 * 1.5;
    const amp = smoothClamped((t - 0.45) / 0.2) * smoothClamped((2.3 - t) / 0.2);
    out.wrist = Math.sin(k) * 0.6 * amp;
    out.elbow += Math.sin(k) * 0.14 * amp;
    out.grip = (0.5 - 0.5 * Math.cos(k * 2)) * amp;
  }
  // happy wrist twirl
  out.roll += Math.PI * 2 * smooth(THREE.MathUtils.clamp((t - 2.3) / 0.7, 0, 1));
  // a small bow
  if (t > 3.0 && t < 3.5) out.shoulder += Math.sin(((t - 3.0) / 0.5) * Math.PI) * 0.3;
  return out;
}

function poseAt(time: number, out: Pose) {
  const t = time % CYCLE;
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const [t0, a] = KEYS[i];
  const [t1, b] = KEYS[i + 1];
  const u = smooth(THREE.MathUtils.clamp((t - t0) / (t1 - t0), 0, 1));
  for (const k of Object.keys(out) as (keyof Pose)[]) out[k] = lerp(a[k], b[k], u);
  return out;
}

const WHITE = '#F4F1EE';
const JOINT = '#3A3440';
const ACCENT = P.raspberry;

/** Link with rounded-looking ends: a box body capped by cylinders at both joints. */
function Link({ length, width, depth }: { length: number; width: number; depth: number }) {
  return (
    <>
      <Box size={[width, length, depth]} position={[0, length / 2, 0]} color={WHITE} roughness={0.5} />
      <Box size={[width * 0.55, length * 0.6, 0.012]} position={[0, length / 2, depth / 2 + 0.004]} color="#E4DEE2" roughness={0.6} />
      <Box size={[0.025, length * 0.55, 0.01]} position={[width * 0.32, length / 2, depth / 2 + 0.01]} color={ACCENT} />
    </>
  );
}

function JointCap({ r, w }: { r: number; w: number }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cyl r={r} h={w} color={JOINT} segments={16} metal />
      <Cyl r={r * 0.55} h={w + 0.02} color="#8C8592" segments={12} metal />
    </group>
  );
}

export function RobotArm() {
  const turret = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const roll = useRef<THREE.Group>(null);
  const fingers = useRef<THREE.Group[]>([]);
  const tool = useRef<THREE.Group>(null);
  const pose = useRef<Pose>({ ...REST });
  const wave = useRef<Pose>({ ...REST });
  const clock = useRef(0);
  const egg = useRef<{ t: number; reduced: boolean; hearts: boolean } | null>(null);
  const bubble = useRef(0);
  const hearts = useRef<FloatersApi | null>(null);
  const bubbleAt = useRef(new THREE.Vector3(-3.75, 3.55, -1.6)).current;
  const tmp = useRef(new THREE.Vector3()).current;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const nav = getNav();
    if (takeEgg('arm') && !egg.current && nav.phase === 'overview') egg.current = { t: 0, reduced: nav.reducedMotion, hearts: false };
    if (egg.current && nav.phase !== 'overview') egg.current = null;
    const e = egg.current;

    const level = anim.ambient.level;
    // Time only advances while the room is lively, so the demo pauses mid-way and the
    // blend toward REST settles the arm smoothly when a section opens. It also holds
    // still while the arm is saying hi, and picks up where it left off afterwards.
    if (!e) clock.current += dt * level;
    const p = poseAt(clock.current, pose.current);
    for (const k of Object.keys(p) as (keyof Pose)[]) p[k] = lerp(REST[k], p[k], level);

    let say = 0;
    if (e) {
      e.t += dt;
      say = windowed(e.t, 0.3, 3.4, 0.2);
      if (!e.reduced) {
        const w = smooth(THREE.MathUtils.clamp(Math.min(e.t / 0.5, (WAVE_END - e.t) / 0.6), 0, 1));
        const q = wavePose(e.t, wave.current);
        for (const k of Object.keys(p) as (keyof Pose)[]) p[k] = lerp(p[k], q[k], w);
      }
      if (!e.hearts && e.t > (e.reduced ? 0.6 : 2.95)) {
        e.hearts = true;
        if (tool.current) hearts.current?.emit(tool.current.getWorldPosition(tmp), 6);
      }
      if (e.t >= WAVE_END) egg.current = null;
    }
    bubble.current = say;

    if (turret.current) turret.current.rotation.y = p.yaw;
    if (shoulder.current) shoulder.current.rotation.z = -p.shoulder;
    if (elbow.current) elbow.current.rotation.z = -p.elbow;
    if (wrist.current) wrist.current.rotation.z = -p.wrist;
    if (roll.current) roll.current.rotation.y = p.roll;
    const open = 0.075 - 0.045 * p.grip;
    fingers.current.forEach((f, i) => f && (f.position.z = (i ? 1 : -1) * open));
  });

  return (
    <>
    <Bubble text="hi!" heart anchor={bubbleAt} show={bubble} />
    <Floaters map={heartSprite()} colors={[P.raspberry, '#F28DB2', '#E8B4C2']} api={hearts} size={0.16} seed={9} />
    <EggTarget id="arm">
    <group position={[-4.25, DESK.top, -1.25]}>
      <Blob position={[0, 0.003, 0]} size={[0.9, 0.9]} />
      {/* base plate with bolts */}
      <Cyl r={0.3} h={0.06} position={[0, 0.03, 0]} color={JOINT} segments={20} metal />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return <Cyl key={i} r={0.022} h={0.02} position={[Math.cos(a) * 0.24, 0.07, Math.sin(a) * 0.24]} color="#9A93A0" segments={6} metal />;
      })}
      <group ref={turret} position={[0, 0.06, 0]}>
        <Cyl r={0.21} rTop={0.18} h={0.26} position={[0, 0.13, 0]} color={WHITE} segments={20} />
        <Cyl r={0.19} h={0.03} position={[0, 0.27, 0]} color={JOINT} segments={20} metal />
        {/* shoulder yoke */}
        <Box size={[0.22, 0.22, 0.04]} position={[0, 0.38, 0.13]} color={WHITE} />
        <Box size={[0.22, 0.22, 0.04]} position={[0, 0.38, -0.13]} color={WHITE} />
        <group ref={shoulder} position={[0, SHOULDER_Y - 0.06, 0]}>
          <JointCap r={0.12} w={0.3} />
          <Link length={L1} width={0.17} depth={0.18} />
          <group ref={elbow} position={[0, L1, 0]}>
            <JointCap r={0.1} w={0.26} />
            <Link length={L2} width={0.14} depth={0.15} />
            <group ref={wrist} position={[0, L2, 0]}>
              <JointCap r={0.08} w={0.2} />
              <group ref={roll}>
                <Cyl r={0.07} h={0.16} position={[0, 0.09, 0]} color={WHITE} segments={14} />
                <Cyl r={0.075} h={0.025} position={[0, 0.18, 0]} color={ACCENT} segments={14} />
                <Box size={[0.12, 0.05, 0.22]} position={[0, 0.215, 0]} color={JOINT} metal />
                <group ref={tool} position={[0, 0.42, 0]} />
                {[0, 1].map((i) => (
                  <group key={i} ref={(g) => void (g && (fingers.current[i] = g))} position={[0, 0.24, (i ? 1 : -1) * 0.075]}>
                    <Box size={[0.05, 0.16, 0.025]} position={[0, 0.08, 0]} color="#B9B3BC" metal />
                    <Box size={[0.05, 0.04, 0.02]} position={[0, 0.15, (i ? -1 : 1) * 0.012]} color={JOINT} />
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
      {/* the part it practises picking, with a little fixture plate */}
      <Box size={[0.4, 0.02, 0.4]} position={[0.55, 0.01, 0.55]} color="#D8D2D9" metal />
      <Box size={[0.16, 0.16, 0.16]} position={[0.55, 0.1, 0.55]} color={P.raspberry} roughness={0.55} />
    </group>
    </EggTarget>
    </>
  );
}
