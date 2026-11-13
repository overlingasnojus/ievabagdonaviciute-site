import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { takeEgg } from '../state/eggs';
import { getNav } from '../state/nav';
import { backOut, Bubble, EggTarget, Floaters, type FloatersApi, smooth, windowed } from './eggParts';
import { PALETTE as P } from './layout';
import { Box, Cyl, Plant } from './parts';
import { noteSprite } from './textures';

// Easter egg: the monstera by the front of the room hides a tiny singing drone (a nod
// to Ieva's singing). Click the plant: the leaves boing, the drone pops out, flies a
// loop around the plant humming "la la" with music notes trailing behind, then dives
// back into the leaves. With reduced motion it simply appears above the plant.

const POS = new THREE.Vector3(0.55, 0, 4.0);
const HIDE_Y = 0.75; // inside the leaves
const FLY_Y = 2.05;
const RADIUS = 0.75;
const T = { up: 0.6, loopEnd: 4.0, back: 4.5, end: 5.2 };
/** Faces the drone toward the overview camera (azimuth 52°). */
const FACE = THREE.MathUtils.degToRad(52);
const DRONE_SCALE = 1.7;

export function PlantDrone() {
  const plant = useRef<THREE.Group>(null);
  const drone = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const rotors = useRef<THREE.Group[]>([]);
  const eyes = useRef<THREE.Group>(null);
  const egg = useRef<{ t: number; reduced: boolean; nextNote: number } | null>(null);
  const bubble = useRef(0);
  const notes = useRef<FloatersApi | null>(null);
  const bubbleAt = useRef(new THREE.Vector3()).current;
  const pos = useRef(new THREE.Vector3()).current;

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const nav = getNav();
    if (takeEgg('plant') && !egg.current && nav.phase === 'overview') egg.current = { t: 0, reduced: nav.reducedMotion, nextNote: 0.7 };
    if (egg.current && nav.phase !== 'overview') egg.current = null;
    const e = egg.current;

    // the leaves boing when the drone leaves and when it comes home
    let boing = 0;
    let scale = 0;
    let bank = 0;
    pos.set(0, HIDE_Y, 0);
    if (e) {
      e.t += dt;
      const t = e.t;
      if (!e.reduced) {
        const hit = (at: number) => (t > at && t < at + 0.8 ? Math.sin((t - at) * 22) * Math.exp(-(t - at) * 5) : 0);
        boing = hit(0) + hit(T.end - 0.55);
        if (t < T.up) {
          pos.y = THREE.MathUtils.lerp(HIDE_Y, FLY_Y, backOut(t / T.up));
          scale = smooth(t / 0.25);
        } else if (t < T.loopEnd) {
          // one loop around the plant, starting and ending at the front, gently bobbing
          const u = smooth((t - T.up) / (T.loopEnd - T.up));
          const a = u * Math.PI * 2;
          const r = RADIUS * Math.sin(u * Math.PI) ** 0.6;
          pos.set(Math.sin(FACE + a) * r, FLY_Y + Math.sin(a * 2) * 0.18, Math.cos(FACE + a) * r);
          bank = Math.sin(u * Math.PI) * 0.35;
          scale = 1;
        } else if (t < T.back) {
          pos.y = FLY_Y + Math.sin((t - T.loopEnd) * 12) * 0.03;
          scale = 1;
        } else {
          const u = smooth((t - T.back) / (T.end - T.back - 0.1));
          pos.y = THREE.MathUtils.lerp(FLY_Y, HIDE_Y, u);
          scale = 1 - smooth((u - 0.6) / 0.4);
        }
      } else {
        pos.y = FLY_Y;
        scale = windowed(t, 0, T.end, 0.3);
      }
      if (t > e.nextNote && t < T.back) {
        e.nextNote += e.reduced ? 1.2 : 0.35;
        notes.current?.emit(pos.clone().add(POS).add(new THREE.Vector3(0, 0.1, 0)), 1);
      }
      if (t >= T.end) egg.current = null;
    }

    bubble.current = e ? windowed(e.t, T.up, T.back, 0.2) : 0;
    bubbleAt.copy(pos).add(POS).add(new THREE.Vector3(0, 0.5, 0));

    if (plant.current) {
      plant.current.scale.set(1 - boing * 0.05, 1 + boing * 0.09, 1 - boing * 0.05);
      plant.current.rotation.z = boing * 0.04;
    }
    if (drone.current) {
      drone.current.visible = scale > 0.001;
      drone.current.position.copy(pos);
      drone.current.scale.setScalar(Math.max(scale, 0.001) * DRONE_SCALE);
    }
    if (body.current) {
      body.current.rotation.set(0, FACE, -bank, 'YXZ');
      body.current.position.y = Math.sin(clock.elapsedTime * 9) * 0.015;
    }
    rotors.current.forEach((r, i) => r && (r.rotation.y += dt * (i % 2 ? -40 : 40)));
    // happy squint (^ ^) while singing
    if (eyes.current) eyes.current.scale.y = e && e.t > T.up ? 0.45 : 1;
  });

  const white = '#F7F5F2';
  const dark = '#2B2630';
  const arms: [number, number][] = [
    [0.17, 0.17],
    [-0.17, 0.17],
    [0.17, -0.17],
    [-0.17, -0.17],
  ];
  return (
    <>
      <Bubble text="la la" heart anchor={bubbleAt} show={bubble} />
      <Floaters map={noteSprite()} colors={[P.raspberry, P.burgundy, '#D99AAD', '#E59A5A']} api={notes} size={0.17} rise={0.8} seed={23} />
      <group position={POS.toArray()}>
        <EggTarget id="plant">
          <group ref={plant}>
            <Plant position={[0, 0, 0]} kind="monstera" seed={111} scale={1.05} />
          </group>
        </EggTarget>
        <group ref={drone} visible={false}>
          <group ref={body}>
            {/* round-ish white body with a face screen toward the viewer */}
            <Box size={[0.26, 0.12, 0.22]} color={white} roughness={0.5} />
            <Box size={[0.2, 0.04, 0.16]} position={[0, 0.08, 0]} color={P.blush} />
            <mesh position={[0, 0.005, 0.111]}>
              <planeGeometry args={[0.18, 0.08]} />
              <meshBasicMaterial color={dark} />
            </mesh>
            <group ref={eyes} position={[0, 0.008, 0.113]}>
              {[-0.04, 0.04].map((x) => (
                <mesh key={x} position={[x, 0, 0]}>
                  <planeGeometry args={[0.03, 0.035]} />
                  <meshBasicMaterial color="#F7E37A" />
                </mesh>
              ))}
            </group>
            {/* rosy cheeks */}
            {[-0.075, 0.075].map((x) => (
              <mesh key={x} position={[x, -0.025, 0.112]}>
                <planeGeometry args={[0.025, 0.012]} />
                <meshBasicMaterial color="#F28DB2" />
              </mesh>
            ))}
            {arms.map(([x, z], i) => (
              <group key={i}>
                <Box size={[Math.abs(x) * 1.2, 0.025, 0.03]} position={[x / 2, 0.03, z / 2]} rotation={[0, Math.atan2(-z, x), 0]} color={dark} metal />
                <Cyl r={0.025} h={0.04} position={[x, 0.04, z]} color={dark} segments={8} metal />
                <group ref={(g) => void (g && (rotors.current[i] = g))} position={[x, 0.07, z]}>
                  <Box size={[0.2, 0.008, 0.035]} color={P.raspberry} />
                  <Box size={[0.035, 0.008, 0.2]} color={P.raspberry} />
                </group>
              </group>
            ))}
            {/* tiny antenna with a heart-pink tip */}
            <Box size={[0.012, 0.08, 0.012]} position={[0, 0.14, -0.04]} color={dark} />
            <Box size={[0.03, 0.03, 0.03]} position={[0, 0.19, -0.04]} color={P.raspberry} emissive={P.raspberry} emissiveIntensity={0.5} />
          </group>
        </group>
      </group>
    </>
  );
}
