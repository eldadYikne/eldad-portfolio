"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html, RoundedBox } from "@react-three/drei";
import {
  InstancedRigidBodies,
  RigidBody,
  useRapier,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { profile } from "@/content/portfolio";
import { palettes, useWorld } from "../store";
import { accentA, accentB, materials } from "../materials";
import { blast, registerBodies } from "../physics/registry";
import { anchors } from "../anchors";

const W = 7.2;
const H = 4.2;
const D = 0.9;
const BASE = 0.35;
const CENTER = new THREE.Vector3(0, BASE + H / 2, 1.5);
let introPlayed = false;

export function HeroMonolith() {
  const shattered = useWorld((s) => s.shattered);
  return (
    <group>
      <Pedestal />
      {shattered ? <Shards /> : <Intact />}
      {shattered && <Core />}
      <Shockwave />
    </group>
  );
}

/* ------------------------------------------------------------------ */

const holoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uAppear;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 uv = vUv;
    // fine grid
    vec2 g = abs(fract(uv * vec2(36.0, 21.0)) - 0.5);
    float grid = smoothstep(0.47, 0.5, max(g.x, g.y)) * 0.35;
    // sweeping scan beam
    float beam = smoothstep(0.08, 0.0, abs(fract(uv.y - uTime * 0.18) - 0.5) - 0.42);
    // horizontal scanlines
    float scan = 0.5 + 0.5 * sin(uv.y * 420.0 + uTime * 8.0);
    // border glow
    vec2 e = min(uv, 1.0 - uv);
    float edge = smoothstep(0.03, 0.0, min(e.x, e.y * 1.7));
    // flicker cells
    float cells = step(0.985, hash(floor(uv * vec2(36.0, 21.0)) + floor(uTime * 3.0)));

    vec3 col = mix(uColorA, uColorB, uv.x + 0.15 * sin(uTime * 0.6 + uv.y * 3.0));
    float a = grid + beam * 0.35 + edge * 1.2 + cells * 0.6 + scan * 0.04;
    a *= (0.75 + uHover * 0.6);
    a *= uAppear;
    gl_FragColor = vec4(col * a * 2.2, a);
  }
`;

function Intact() {
  const shatter = useWorld((s) => s.shatter);
  const setTooltip = useWorld((s) => s.setTooltip);
  const mode = useWorld((s) => s.mode);
  const group = useRef<THREE.Group>(null);
  const hover = useRef(0);
  const hovered = useRef(false);
  // First load grows in from 60%; after a reassembly the shards already sit in place.
  const appear = useRef(introPlayed ? 0.9 : 0);
  useEffect(() => {
    introPlayed = true;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uAppear: { value: 0 },
      // Same Color instances PaletteDriver mutates, so the hologram follows world mode.
      uColorA: { value: accentA },
      uColorB: { value: accentB },
    }),
    []
  );

  useFrame((state, dt) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    hover.current = THREE.MathUtils.damp(hover.current, hovered.current ? 1 : 0, 6, dt);
    appear.current = THREE.MathUtils.damp(appear.current, 1, 3, dt);
    uniforms.uHover.value = hover.current;
    uniforms.uAppear.value = appear.current;
    if (group.current) {
      const s = 0.6 + 0.4 * appear.current;
      group.current.scale.setScalar(s);
      // Lean very slightly toward the cursor: the slab feels alive before you touch it.
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, state.pointer.x * 0.06, 3, dt);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -state.pointer.y * 0.03, 3, dt);
    }
  });

  return (
    <RigidBody type="fixed" colliders="cuboid" position={CENTER.toArray()}>
      <group ref={group}>
        <RoundedBox
          args={[W, H, D]}
          radius={0.08}
          smoothness={3}
          material={materials.panel}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            hovered.current = true;
            document.body.style.cursor = "pointer";
            setTooltip({ text: "Click to break the monolith", color: "#22d3ee" });
          }}
          onPointerOut={() => {
            hovered.current = false;
            document.body.style.cursor = "";
            setTooltip(null);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setTooltip(null);
            document.body.style.cursor = "";
            shatter([e.point.x, e.point.y, e.point.z]);
          }}
        >
          <Edges threshold={15} color={palettes[mode].a} scale={1.002} />
        </RoundedBox>

        <mesh position={[0, 0, D / 2 + 0.006]}>
          <planeGeometry args={[W - 0.12, H - 0.12]} />
          <shaderMaterial
            vertexShader={holoVertex}
            fragmentShader={holoFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        <Html
          transform
          distanceFactor={2.5}
          position={[0, 0, D / 2 + 0.02]}
          className="pointer-events-none select-none"
          pointerEvents="none"
          zIndexRange={[10, 0]}
        >
          <div className="monolith-title">
            <span className="monolith-kicker">// portfolio.init()</span>
            <h1>{profile.name}</h1>
            <p className="monolith-role">{profile.title}</p>
            <p className="monolith-hint">click to break the shell</p>
          </div>
        </Html>
      </group>
    </RigidBody>
  );
}

/* ------------------------------------------------------------------ */

const NX = 14;
const NY = 8;
const NZ = 2;
const SX = W / NX;
const SY = H / NY;
const SZ = D / NZ;

type ShardSet = { core: InstancedRigidBodyProps[]; energy: InstancedRigidBodyProps[] };

function buildShards(impact: THREE.Vector3): ShardSet {
  const core: InstancedRigidBodyProps[] = [];
  const energy: InstancedRigidBodyProps[] = [];
  const p = new THREE.Vector3();
  for (let ix = 0; ix < NX; ix++)
    for (let iy = 0; iy < NY; iy++)
      for (let iz = 0; iz < NZ; iz++) {
        p.set(
          CENTER.x - W / 2 + SX * (ix + 0.5),
          CENTER.y - H / 2 + SY * (iy + 0.5),
          CENTER.z - D / 2 + SZ * (iz + 0.5)
        );
        const dir = p.clone().sub(impact);
        const dist = Math.max(dir.length(), 0.35);
        dir.normalize();
        // Strong near the impact, falling off with distance; blown away from the viewer.
        const force = 9 / Math.pow(dist, 0.8);
        const v = dir.multiplyScalar(force);
        v.z -= 3.5 + Math.random() * 4;
        v.y += 2 + Math.random() * 3;
        v.x += (Math.random() - 0.5) * 2;
        const props: InstancedRigidBodyProps = {
          key: `s-${ix}-${iy}-${iz}`,
          position: [p.x, p.y, p.z],
          rotation: [0, 0, 0],
          linearVelocity: [v.x, v.y, v.z],
          angularVelocity: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14],
        };
        (Math.random() < 0.22 ? energy : core).push(props);
      }
  return { core, energy };
}

function Shards() {
  const impact = useWorld((s) => s.impact);
  const reassembling = useWorld((s) => s.reassembling);
  const finish = useWorld((s) => s.finishReassemble);
  const { rapier } = useRapier();
  const coreRef = useRef<RapierRigidBody[]>(null);
  const energyRef = useRef<RapierRigidBody[]>(null);
  const shards = useMemo(() => buildShards(new THREE.Vector3(...impact)), [impact]);
  const geometry = useMemo(() => new THREE.BoxGeometry(SX * 0.94, SY * 0.94, SZ * 0.94), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const all = [...(coreRef.current ?? []), ...(energyRef.current ?? [])];
    const off = registerBodies(all);
    // Chain reaction: the explosion shoves everything else in the world.
    blast({ x: impact[0], y: impact[1], z: impact[2] }, 11, 7);
    return off;
  }, [impact]);

  // Time-reversal reassembly: switch every shard to kinematic and fly it home.
  const rewind = useRef<{
    t: number;
    from: { p: THREE.Vector3; q: THREE.Quaternion }[];
    home: THREE.Vector3[];
    list: RapierRigidBody[];
  } | null>(null);

  useEffect(() => {
    if (!reassembling) return;
    const list = [...(coreRef.current ?? []), ...(energyRef.current ?? [])];
    const homes = [...shards.core, ...shards.energy].map((s) => new THREE.Vector3(...(s.position as [number, number, number])));
    const from = list.map((b) => {
      const t = b.translation();
      const r = b.rotation();
      return { p: new THREE.Vector3(t.x, t.y, t.z), q: new THREE.Quaternion(r.x, r.y, r.z, r.w) };
    });
    list.forEach((b) => b.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true));
    rewind.current = { t: 0, from, home: homes, list };
  }, [reassembling, rapier, shards]);

  const tmpP = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const identity = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, dt) => {
    const r = rewind.current;
    if (!r) return;
    r.t = Math.min(1, r.t + dt / 1.3);
    r.list.forEach((b, i) => {
      // Stagger by height so it rebuilds bottom-up.
      const delay = (r.home[i].y - (CENTER.y - H / 2)) / H * 0.35;
      const local = THREE.MathUtils.clamp((r.t - delay) / (1 - 0.35), 0, 1);
      const e = local < 0.5 ? 4 * local ** 3 : 1 - Math.pow(-2 * local + 2, 3) / 2;
      tmpP.copy(r.from[i].p).lerp(r.home[i], e);
      // Arc upward on the way back.
      tmpP.y += Math.sin(e * Math.PI) * 1.5;
      tmpQ.copy(r.from[i].q).slerp(identity, e);
      b.setNextKinematicTranslation(tmpP);
      b.setNextKinematicRotation(tmpQ);
    });
    if (r.t >= 1) {
      rewind.current = null;
      finish();
    }
  });

  const energyColors = useMemo(() => {
    const arr = new Float32Array(shards.energy.length * 3);
    const c = new THREE.Color();
    shards.energy.forEach((_, i) => {
      c.copy(i % 2 ? accentA : accentB).multiplyScalar(3.5);
      c.toArray(arr, i * 3);
    });
    return arr;
  }, [shards]);

  return (
    <>
      <InstancedRigidBodies
        ref={coreRef}
        instances={shards.core}
        colliders="cuboid"
        friction={0.6}
        restitution={0.25}
        linearDamping={0.05}
      >
        <instancedMesh
          args={[geometry, materials.darkMetal, shards.core.length]}
          count={shards.core.length}
          castShadow
          receiveShadow
        />
      </InstancedRigidBodies>
      <InstancedRigidBodies
        ref={energyRef}
        instances={shards.energy}
        colliders="cuboid"
        friction={0.6}
        restitution={0.3}
      >
        <instancedMesh args={[geometry, undefined, shards.energy.length]} count={shards.energy.length}>
          <meshBasicMaterial toneMapped={false} />
          <instancedBufferAttribute attach="instanceColor" args={[energyColors, 3]} />
        </instancedMesh>
      </InstancedRigidBodies>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Core() {
  const select = useWorld((s) => s.select);
  const setTooltip = useWorld((s) => s.setTooltip);
  const reassembling = useWorld((s) => s.reassembling);
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const grow = useRef(0);
  const [shellMat] = useState(() => new THREE.MeshBasicMaterial({ wireframe: true, toneMapped: false }));

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    anchors.set("bio", g);
    return () => {
      anchors.delete("bio");
    };
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    grow.current = THREE.MathUtils.damp(grow.current, reassembling ? 0 : 1, reassembling ? 8 : 2.2, dt);
    if (group.current) {
      group.current.position.set(CENTER.x, CENTER.y + Math.sin(t * 1.4) * 0.15, CENTER.z);
      group.current.scale.setScalar(grow.current);
    }
    shellMat.color.copy(accentA).multiplyScalar(3);
    if (shell.current) {
      shell.current.rotation.x = t * 0.35;
      shell.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        setTooltip({ text: "The core: who I am", color: "#ffffff" });
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
        setTooltip(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        select({ kind: "bio" });
      }}
    >
      <mesh ref={shell} material={shellMat}>
        <icosahedronGeometry args={[1.05, 1]} />
      </mesh>
      <mesh material={materials.glowWhite}>
        <icosahedronGeometry args={[0.42, 3]} />
      </mesh>
      <mesh visible={false}>
        <sphereGeometry args={[1.1, 12, 12]} />
      </mesh>
      <pointLight color={accentA} intensity={30} distance={9} decay={2} />
    </group>
  );
}

function Pedestal() {
  return (
    <group position={[CENTER.x, BASE / 2, CENTER.z]}>
      <mesh material={materials.darkMetal} receiveShadow>
        <boxGeometry args={[W + 0.8, BASE, D + 1.2]} />
      </mesh>
      <mesh position={[0, BASE / 2 + 0.005, D / 2 + 0.45]} material={materials.glowA}>
        <boxGeometry args={[W + 0.6, 0.012, 0.04]} />
      </mesh>
    </group>
  );
}

/** Expanding ground ring + light flash every time the monolith shatters. */
function Shockwave() {
  const impact = useWorld((s) => s.impact);
  const shattered = useWorld((s) => s.shattered);
  const ring = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(10);
  const [mat] = useState(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(3, 3, 3),
        transparent: true,
        opacity: 0,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
  );

  useEffect(() => {
    if (shattered) t.current = 0;
  }, [shattered, impact]);

  useFrame((_, dt) => {
    t.current += dt;
    const k = t.current / 1.2;
    if (ring.current) {
      ring.current.visible = k < 1;
      ring.current.scale.setScalar(0.5 + k * 16);
      mat.opacity = Math.max(0, 1 - k) * 0.9;
      mat.color.copy(accentA).multiplyScalar(4);
    }
    if (light.current) light.current.intensity = Math.max(0, 1 - t.current / 0.5) * 400;
  });

  return (
    <>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[impact[0], 0.03, impact[2]]} material={mat} visible={false}>
        <ringGeometry args={[0.92, 1, 96]} />
      </mesh>
      <pointLight ref={light} position={impact} color="#ffffff" intensity={0} distance={25} decay={1.6} />
    </>
  );
}
