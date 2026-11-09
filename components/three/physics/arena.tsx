"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";

export const ARENA = {
  halfX: 14,
  minZ: -10,
  maxZ: 8,
  ceiling: 13,
};

/** Invisible floor, walls and ceiling so nothing can be thrown out of the world. */
export function Arena() {
  const { halfX, minZ, maxZ, ceiling } = ARENA;
  const cz = (minZ + maxZ) / 2;
  const hz = (maxZ - minZ) / 2;
  const t = 0.5;
  return (
    <RigidBody type="fixed" colliders={false} friction={0.8} restitution={0.2}>
      <CuboidCollider args={[halfX, t, hz]} position={[0, -t, cz]} />
      <CuboidCollider args={[halfX, t, hz]} position={[0, ceiling + t, cz]} />
      <CuboidCollider args={[t, ceiling / 2, hz]} position={[-halfX - t, ceiling / 2, cz]} />
      <CuboidCollider args={[t, ceiling / 2, hz]} position={[halfX + t, ceiling / 2, cz]} />
      <CuboidCollider args={[halfX, ceiling / 2, t]} position={[0, ceiling / 2, minZ - t]} />
      <CuboidCollider args={[halfX, ceiling / 2, t]} position={[0, ceiling / 2, maxZ + t]} />
    </RigidBody>
  );
}
