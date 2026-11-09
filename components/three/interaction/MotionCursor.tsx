"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorld } from "../store";
import { accentA, materials } from "../materials";
import { blast } from "../physics/registry";
import { ARENA } from "../physics/arena";
import { motion } from "./motion";

/**
 * Turns the webcam motion centroid into a glowing force field that moves
 * across the arena and shoves every rigid body it touches.
 */
export function MotionCursor() {
  const on = useWorld((s) => s.motionLab);
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const ring = useRef<THREE.Mesh>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const frame = useRef(0);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const active = on && motion.active;
    g.visible = active;
    if (!active) return;

    target.set(
      THREE.MathUtils.lerp(-ARENA.halfX + 2, ARENA.halfX - 2, motion.x),
      0.8 + (1 - motion.y) * 3,
      THREE.MathUtils.lerp(ARENA.minZ + 2, ARENA.maxZ - 2, motion.y)
    );
    const k = 1 - Math.exp(-8 * dt);
    g.position.lerp(target, k);

    const e = THREE.MathUtils.clamp(motion.energy * 12, 0, 1);
    g.scale.setScalar(0.6 + e * 1.4);
    if (ring.current) ring.current.rotation.z += dt * (2 + e * 10);
    if (light.current) {
      light.current.intensity = 10 + e * 80;
      light.current.color.copy(accentA);
    }

    // Apply force every other frame; scale with how much you're moving.
    frame.current++;
    if (e > 0.06 && frame.current % 2 === 0) {
      blast(g.position, 3.4, 1.5 + e * 6, 0.9);
    }
    void state;
  });

  return (
    <group ref={group} visible={false}>
      <mesh material={materials.glowWhite}>
        <sphereGeometry args={[0.18, 16, 16]} />
      </mesh>
      <mesh ref={ring} material={materials.glowA} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.55, 0.025, 8, 64]} />
      </mesh>
      <pointLight ref={light} distance={7} decay={2} />
    </group>
  );
}
