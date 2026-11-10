"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, ZONES, zoneById } from "../world";
import { useGame } from "../store";

/** Pulsing capture circles on the ground, plus a floating nameplate per landmark. */
export function ZoneRings() {
  const visited = useGame((s) => s.visited);
  const current = useGame((s) => s.zone);
  const rings = useRef<(THREE.Group | null)[]>([]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    rings.current.forEach((g, i) => {
      if (!g) return;
      const on = ZONES[i].id === useGame.getState().zone;
      const pulse = 1 + Math.sin(t * 3 + i) * 0.04;
      g.scale.setScalar(on ? 1.08 : pulse);
      g.children[1].rotation.z = t * (on ? 2 : 0.5);
    });
  });

  return (
    <>
      {ZONES.map((z, i) => (
        <group key={z.id}>
          <group ref={(g) => void (rings.current[i] = g)} position={[z.ring[0], 0.045, z.ring[1]]}>
            <mesh rotation-x={-Math.PI / 2}>
              <circleGeometry args={[z.ringR, 40]} />
              <meshBasicMaterial color={z.color} transparent opacity={current === z.id ? 0.35 : 0.18} depthWrite={false} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry args={[z.ringR - 0.16, z.ringR, 48, 1, 0, Math.PI * 1.7]} />
              <meshBasicMaterial color={z.color} transparent opacity={0.95} depthWrite={false} />
            </mesh>
          </group>
          <Html position={[z.pos[0], landmarkHeight(z.id), z.pos[1]]} center zIndexRange={[15, 5]} pointerEvents="none">
            <div className={`zone-tag ${visited.includes(z.id) ? "done" : ""} ${current === z.id ? "here" : ""}`} style={{ ["--c" as string]: z.color }}>
              <span>{z.icon}</span>
              {z.label}
              {visited.includes(z.id) && <b>✓</b>}
            </div>
          </Html>
        </group>
      ))}
      <Confetti />
    </>
  );
}

function landmarkHeight(id: string) {
  return ({ asadra: 7.6, codere: 5, gocode: 4.6, giborim: 4.2, logiki: 4.8, motion: 3.4, skills: 3.8, education: 5.4, about: 3.6, contact: 2.4 } as Record<string, number>)[id] ?? 4;
}

/** Burst of confetti when a zone is visited for the first time. */
function Confetti() {
  const COUNT = 140;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const parts = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        r: new THREE.Euler(),
        w: new THREE.Vector3(),
        life: 0,
      })),
    []
  );
  const lastReward = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => {
    const list = [PALETTE.pink, PALETTE.yellow, PALETTE.teal, PALETTE.purple, PALETTE.coral, "#5b8cff"];
    const arr = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) c.set(list[i % list.length]).toArray(arr, i * 3);
    return arr;
  }, []);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const reward = useGame.getState().reward;
    if (reward && reward.at !== lastReward.current) {
      lastReward.current = reward.at;
      const z = zoneById[reward.id];
      parts.forEach((q) => {
        q.p.set(z.ring[0], 1, z.ring[1]);
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 5;
        q.v.set(Math.cos(a) * sp, 7 + Math.random() * 6, Math.sin(a) * sp);
        q.w.set(Math.random() * 12, Math.random() * 12, Math.random() * 12);
        q.life = 1;
      });
    }
    parts.forEach((q, i) => {
      if (q.life > 0) {
        q.life -= dt * 0.45;
        q.v.y -= 16 * dt;
        q.v.multiplyScalar(1 - dt * 1.2);
        q.p.addScaledVector(q.v, dt);
        if (q.p.y < 0.05) {
          q.p.y = 0.05;
          q.v.set(0, 0, 0);
        }
        q.r.x += q.w.x * dt;
        q.r.y += q.w.y * dt;
      }
      dummy.position.copy(q.p);
      dummy.rotation.copy(q.r);
      dummy.scale.setScalar(q.life > 0 ? Math.min(1, q.life * 3) : 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[0.18, 0.28]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}
