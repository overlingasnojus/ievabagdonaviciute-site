import { useMemo } from 'react';
import * as THREE from 'three';
import { ROOM, WINDOW } from './layout';
import { blossomLayer, campusLayer, skyLayer } from './textures';

// The view outside is one plane in the window opening. Its shader casts the view ray
// past the glass to three layers at increasing depth (blossoms, campus, sky), so the
// scene shifts with real parallax as the camera moves without any geometry poking
// out behind the wall.

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tSky;
  uniform sampler2D tCampus;
  uniform sampler2D tBlossom;
  uniform vec4 rSky;      // layer rect in the window plane: x0, y0, width, height
  uniform vec4 rCampus;
  uniform vec4 rBlossom;
  uniform vec3 depths;    // sky, campus, blossom distance behind the glass
  varying vec3 vWorld;

  vec4 layer(sampler2D t, vec4 r, float d, vec3 v) {
    vec2 p = vWorld.xy + v.xy / max(-v.z, 0.05) * d;
    vec2 uv = (p - r.xy) / r.zw;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
    return texture2D(t, uv);
  }

  void main() {
    vec3 v = normalize(vWorld - cameraPosition);
    // the sky never runs out: clamp instead of cutting off
    vec2 sp = vWorld.xy + v.xy / max(-v.z, 0.05) * depths.x;
    vec3 col = texture2D(tSky, clamp((sp - rSky.xy) / rSky.zw, 0.0, 1.0)).rgb;
    vec4 c = layer(tCampus, rCampus, depths.y, v);
    col = mix(col, c.rgb, c.a);
    vec4 b = layer(tBlossom, rBlossom, depths.z, v);
    col = mix(col, b.rgb, b.a);
    // a whisper of warm haze on the glass
    col = mix(col, vec3(1.0, 0.93, 0.86), 0.06);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function WindowView() {
  const w = WINDOW.x1 - WINDOW.x0;
  const h = WINDOW.y1 - WINDOW.y0;
  const cx = (WINDOW.x0 + WINDOW.x1) / 2;
  const z = -ROOM.D - ROOM.wall * 0.6;

  const material = useMemo(() => {
    const rect = (width: number, height: number, bottom: number) => new THREE.Vector4(cx - width / 2, bottom, width, height);
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tSky: { value: skyLayer() },
        tCampus: { value: campusLayer() },
        tBlossom: { value: blossomLayer() },
        rSky: { value: rect(36, 22, -8) },
        rCampus: { value: rect(7.2, 5.4, -1.0) },
        rBlossom: { value: rect(4.6, 5.2, WINDOW.y0 - 0.9) },
        depths: { value: new THREE.Vector3(6, 2.5, 0.9) },
      },
    });
  }, [cx, z]);

  return (
    <mesh position={[cx, (WINDOW.y0 + WINDOW.y1) / 2, z]} material={material}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}
