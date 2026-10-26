import { useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { anim } from '../state/anim';
import { getNav } from '../state/nav';
import { Beyond } from './Beyond';
import { CameraRig } from './CameraRig';
import { Cv } from './Cv';
import { CAMERA, PALETTE } from './layout';
import { Monitor } from './Monitor';
import { Notebook } from './Notebook';
import { Projector } from './Projector';
import { RobotArm } from './RobotArm';
import { Room } from './Room';
import { laptopTexture, smallCodeTexture } from './textures';
import { WheeledRobot } from './WheeledRobot';
import { Whiteboard } from './Whiteboard';

const isSmall = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600;
const SHADOW_MAP = isSmall ? 1024 : 2048;

function Lights() {
  return (
    <>
      <hemisphereLight args={['#FFF1EA', '#D4ACB9', 0.5]} />
      {/* soft key light from the open front of the room: gives every object a contact shadow */}
      <directionalLight
        position={[8, 14, 10]}
        intensity={0.62}
        color="#FFF1E6"
        castShadow
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      {/* warm afternoon sun through the window, throwing a patch of light across the floor */}
      <directionalLight
        position={[1.2, 7.5, -12]}
        intensity={2.3}
        color="#FFC996"
        castShadow
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <pointLight position={[3.2, 3.2, -3.6]} intensity={0.9} distance={6} decay={1.5} color="#FFE2D2" />
    </>
  );
}

/** Image-based light for reflections on metal and glass. */
function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.26;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Eases the room's idle motion down while a section is open (and off for reduced motion). */
function AmbientDriver() {
  useFrame((_, dt) => {
    const nav = getNav();
    const target = nav.phase === 'overview' && !nav.reducedMotion ? 1 : 0;
    anim.ambient.level = THREE.MathUtils.damp(anim.ambient.level, target, 2.5, dt);
  }, -3);
  return null;
}

export default function Scene() {
  const small = smallCodeTexture();
  const laptop = laptopTexture();
  return (
    <Canvas
      className="scene-canvas"
      shadows
      flat
      dpr={[1, 2]}
      camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [20, 16, 20] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      aria-hidden="true"
    >
      <color attach="background" args={[PALETTE.bg]} />
      <Lights />
      <Environment />
      <AmbientDriver />
      <CameraRig />
      <Room smallScreen={small} laptop={laptop} />
      <RobotArm />
      <WheeledRobot />
      <Notebook />
      <Whiteboard />
      <Monitor textures={[small]} />
      <Beyond />
      <Cv />
      <Projector />
    </Canvas>
  );
}
