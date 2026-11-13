import { useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { type Egg, pokeEgg } from '../state/eggs';
import { getNav } from '../state/nav';
import { bubbleTexture, rng } from './textures';

// Shared pieces for the room's easter eggs: a click target, a pixel speech bubble and
// a small pool of floating sprites (hearts, music notes).

export const smooth = (x: number) => {
  const c = THREE.MathUtils.clamp(x, 0, 1);
  return c * c * (3 - 2 * c);
};

/** 0 → 1 with a little overshoot, for things that pop into place. */
export const backOut = (x: number) => {
  const c = THREE.MathUtils.clamp(x, 0, 1) - 1;
  return 1 + 2.7 * c * c * c + 1.7 * c * c;
};

/** 0 → 1 → 0 window: rises over `fade` after `a`, falls over `fade` before `b`. */
export function windowed(t: number, a: number, b: number, fade = 0.25) {
  return Math.min(smooth((t - a) / fade), smooth((b - t) / fade));
}

/** Pointer cursor on hover; click plays the egg and never reaches a section behind it. */
export function EggTarget({ id, children }: { id: Egg; children: ReactNode }) {
  return (
    <group
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (getNav().phase !== 'overview') return;
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        pokeEgg(id);
      }}
    >
      {children}
    </group>
  );
}

const PX = 0.034; // world units per bubble pixel

/**
 * Pixel speech bubble whose tail sits on `anchor` (world space, read every frame).
 * `show` is 0..1; the bubble pops in with a small overshoot.
 */
export function Bubble({ text, heart, anchor, show }: { text: string; heart?: boolean; anchor: THREE.Vector3; show: MutableRefObject<number> }) {
  const sprite = useRef<THREE.Sprite>(null);
  const tex = bubbleTexture(text, heart);
  const [w, h] = tex.userData.px as [number, number];
  useFrame(() => {
    const s = sprite.current;
    if (!s) return;
    const v = show.current;
    s.visible = v > 0.001;
    const k = backOut(v);
    s.position.copy(anchor);
    s.scale.set(w * PX * k, h * PX * k, 1);
  });
  return (
    <sprite ref={sprite} center={new THREE.Vector2(0.5, 0)} renderOrder={20} visible={false}>
      <spriteMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}

export interface FloatersApi {
  emit: (at: THREE.Vector3, count: number) => void;
}

interface Particle {
  age: number;
  life: number;
  start: THREE.Vector3;
  drift: THREE.Vector2;
  phase: number;
}

/** Pool of sprites that drift up, sway and fade: hearts out of the arm, notes out of the drone. */
export function Floaters({
  map,
  colors,
  api,
  size = 0.2,
  rise = 1.0,
  max = 14,
  seed = 1,
}: {
  map: THREE.Texture;
  colors: string[];
  api: MutableRefObject<FloatersApi | null>;
  size?: number;
  rise?: number;
  max?: number;
  seed?: number;
}) {
  const sprites = useRef<THREE.Sprite[]>([]);
  const parts = useRef<(Particle | null)[]>(Array(max).fill(null));
  const rand = useMemo(() => rng(seed), [seed]);
  const aspect = map.image ? map.image.width / map.image.height : 1;

  api.current = {
    emit(at, count) {
      for (let n = 0; n < count; n++) {
        const i = parts.current.findIndex((p) => !p);
        if (i < 0) return;
        parts.current[i] = {
          age: -n * 0.09,
          life: 1.5 + rand() * 0.5,
          start: at.clone().add(new THREE.Vector3((rand() - 0.5) * 0.25, (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.25)),
          drift: new THREE.Vector2((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6),
          phase: rand() * Math.PI * 2,
        };
        const sp = sprites.current[i];
        if (sp) (sp.material as THREE.SpriteMaterial).color.set(colors[Math.floor(rand() * colors.length)]);
      }
    },
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    parts.current.forEach((p, i) => {
      const s = sprites.current[i];
      if (!s) return;
      if (!p) {
        s.visible = false;
        return;
      }
      p.age += dt;
      if (p.age >= p.life) {
        parts.current[i] = null;
        s.visible = false;
        return;
      }
      s.visible = p.age > 0;
      const u = Math.max(p.age, 0) / p.life;
      s.position.set(
        p.start.x + p.drift.x * u + Math.sin(p.phase + p.age * 5) * 0.07,
        p.start.y + rise * (1 - (1 - u) * (1 - u)),
        p.start.z + p.drift.y * u,
      );
      const k = backOut(Math.min(1, u * 6)) * (1 - smooth((u - 0.7) / 0.3) * 0.4);
      s.scale.set(size * aspect * k, size * k, 1);
      (s.material as THREE.SpriteMaterial).opacity = 1 - smooth((u - 0.6) / 0.4);
    });
  });

  return (
    <>
      {Array.from({ length: max }, (_, i) => (
        <sprite key={i} ref={(s) => void (s && (sprites.current[i] = s))} renderOrder={19} visible={false}>
          <spriteMaterial map={map} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </>
  );
}
