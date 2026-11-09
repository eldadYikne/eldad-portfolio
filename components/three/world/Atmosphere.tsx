"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Grid, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { palettes, useWorld } from "../store";
import { accentA, accentB, syncGlowMaterials } from "../materials";

const targetA = new THREE.Color();
const targetB = new THREE.Color();
const targetFog = new THREE.Color();

/** Lerps the shared accent colours, fog and background toward the current world mode. */
export function PaletteDriver() {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.Fog(palettes.void.fog, 16, 46), []);
  const bg = useMemo(() => new THREE.Color(palettes.void.fog), []);
  scene.fog = fog;
  scene.background = bg;

  useFrame((_, dt) => {
    const p = palettes[useWorld.getState().mode];
    targetA.set(p.a);
    targetB.set(p.b);
    targetFog.set(p.fog);
    const k = 1 - Math.exp(-2.5 * dt);
    accentA.lerp(targetA, k);
    accentB.lerp(targetB, k);
    fog.color.lerp(targetFog, k);
    bg.copy(fog.color);
    syncGlowMaterials();
  });
  return null;
}

export function Lighting() {
  const quality = useWorld((s) => s.quality);
  const keyA = useRef<THREE.PointLight>(null);
  const keyB = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (keyA.current) {
      keyA.current.color.copy(accentA);
      keyA.current.position.set(-9 + Math.sin(t * 0.3) * 2, 5, 3);
    }
    if (keyB.current) {
      keyB.current.color.copy(accentB);
      keyB.current.position.set(9 + Math.cos(t * 0.25) * 2, 5, 2);
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight
        position={[6, 14, 8]}
        intensity={1.1}
        castShadow={quality !== "low"}
        shadow-mapSize={quality === "high" ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <pointLight ref={keyA} intensity={60} distance={22} decay={1.6} />
      <pointLight ref={keyB} intensity={60} distance={22} decay={1.6} />

      {/* Studio-style reflections without downloading an HDR: rendered once at startup. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 6, -9]} scale={[14, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#22d3ee" position={[-10, 3, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#a855f7" position={[10, 3, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={1.5} position={[0, 10, 4]} rotation-x={Math.PI / 2} scale={4} />
      </Environment>
    </>
  );
}

export function Floor() {
  const quality = useWorld((s) => s.quality);
  const mode = useWorld((s) => s.mode);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[400, 120]}
            mixBlur={1}
            mixStrength={4}
            mirror={0.6}
            roughness={0.85}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            metalness={0.6}
            color={palettes[mode].floor}
          />
        ) : (
          <meshStandardMaterial color={palettes[mode].floor} metalness={0.5} roughness={0.7} />
        )}
      </mesh>
      <Grid
        position={[0, 0.005, -1]}
        args={[80, 80]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#1b2133"
        sectionSize={3}
        sectionThickness={1.1}
        sectionColor={palettes[mode].a}
        fadeDistance={38}
        fadeStrength={1.6}
        infiniteGrid
      />
    </group>
  );
}

/* ---------------- floating dust: one draw call, animated on the GPU ---------------- */

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vSeed;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * (0.08 + aSeed * 0.12) + aSeed * 20.0, 14.0);
    p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (14.0 + aSeed * 22.0) * uPixelRatio / -mv.z;
    vSeed = aSeed;
  }
`;

const dustFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    float tw = 0.55 + 0.45 * sin(uTime * (1.0 + vSeed * 3.0) + vSeed * 50.0);
    vec3 col = mix(uColorA, uColorB, vSeed) * 2.0;
    gl_FragColor = vec4(col * a * tw, a * tw * 0.8);
  }
`;

export function Dust({ count = 1600 }: { count?: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = -1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 4;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: dpr },
      uColorA: { value: accentA },
      uColorB: { value: accentB },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPixelRatio.value = state.viewport.dpr;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
