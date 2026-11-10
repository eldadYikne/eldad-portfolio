"use client";

import { useMemo } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE, PATHS, islandRadius } from "../world";
import { toon } from "../toon";
import { input } from "../store";
import { useCombat } from "../combat/state";

const DEPTH = 3;

export function Island() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const r = islandRadius(t);
      // Shape y becomes world -z after the -90° X rotation, so negate.
      const x = Math.cos(t) * r;
      const y = -Math.sin(t) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.5,
      bevelSegments: 3,
      curveSegments: 1,
    });
    g.rotateX(-Math.PI / 2);
    // Extrusion runs -bevel..depth+bevel along +y now; put the grass top at y = 0.
    g.translate(0, -(DEPTH + 0.35), 0);
    return g;
  }, []);

  const onGround = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    // During a mission the mouse aims and shoots; movement is WASD / stick.
    if (useCombat.getState().mission) return;
    input.target = { x: e.point.x, z: e.point.z };
  };

  return (
    <group>
      {/* caps = grass, sides = cliff */}
      <mesh
        geometry={geometry}
        material={[toon(PALETTE.grass), toon(PALETTE.cliff)]}
        receiveShadow
        onPointerDown={onGround}
      />
      <Trails />
      <Water />
    </group>
  );
}

/** Ribbon meshes along each path polyline, sitting a hair above the grass. */
function Trails() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    let base = 0;
    const W = 1.15;
    for (const path of PATHS) {
      for (let i = 0; i < path.length; i++) {
        const [x, z] = path[i];
        const [nx, nz] = path[Math.min(i + 1, path.length - 1)];
        const [px, pz] = path[Math.max(i - 1, 0)];
        let dx = nx - px;
        let dz = nz - pz;
        const len = Math.hypot(dx, dz) || 1;
        dx /= len;
        dz /= len;
        // Taper at both ends so trails melt into the plaza and rings.
        const w = W * (0.75 + 0.25 * Math.sin((i / (path.length - 1)) * Math.PI));
        positions.push(x - dz * w, 0.02, z + dx * w, x + dz * w, 0.02, z - dx * w);
        if (i < path.length - 1) {
          const a = base + i * 2;
          indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      base += path.length * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <>
      <mesh geometry={geometry} material={toon(PALETTE.sand)} receiveShadow />
      {/* spawn plaza */}
      <mesh position={[0, 0.025, 0.4]} rotation-x={-Math.PI / 2} material={toon(PALETTE.sand)} receiveShadow>
        <circleGeometry args={[4.2, 40]} />
      </mesh>
    </>
  );
}

const waterVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uFoam;
  varying vec3 vWorld;

  float coast(float t) {
    return 25.0 + 2.4 * sin(3.0 * t + 1.0) + 1.4 * sin(5.0 * t + 2.0) + 0.7 * sin(9.0 * t + 0.5);
  }

  void main() {
    float theta = atan(vWorld.z, vWorld.x);
    float d = length(vWorld.xz) - coast(theta) - 0.5;   // distance from the shore
    vec3 col = mix(uShallow, uDeep, smoothstep(0.0, 14.0, d));
    // Foam hugging the coast plus two waves rolling in toward it.
    float foam = smoothstep(1.1, 0.2, d);
    float wave = 0.0;
    for (int i = 0; i < 2; i++) {
      float ph = fract(uTime * 0.18 + float(i) * 0.5);
      float r = ph * 5.0 + 0.8;
      wave += smoothstep(0.35, 0.0, abs(d - r)) * (1.0 - ph) * step(0.0, d);
    }
    // Sparkles drifting across the open water.
    vec2 c = vWorld.xz * 0.6 + vec2(uTime * 0.25, uTime * 0.12);
    float sparkle = smoothstep(0.93, 1.0, sin(c.x * 3.1 + sin(c.y * 2.3)) * sin(c.y * 2.7 + sin(c.x * 1.7)));
    col = mix(col, uFoam, clamp(foam + wave * 0.8 + sparkle * 0.5, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function Water() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color(PALETTE.water) },
      uDeep: { value: new THREE.Color(PALETTE.waterDeep) },
      uFoam: { value: new THREE.Color("#ffffff") },
    }),
    []
  );
  useFrame((s) => (uniforms.uTime.value = s.clock.elapsedTime));
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.55, 0]}>
      <planeGeometry args={[220, 220, 1, 1]} />
      <shaderMaterial vertexShader={waterVertex} fragmentShader={waterFragment} uniforms={uniforms} />
    </mesh>
  );
}
