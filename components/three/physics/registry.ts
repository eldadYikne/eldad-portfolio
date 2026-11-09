import type { RapierRigidBody } from "@react-three/rapier";

/**
 * All dynamic bodies that global forces (Zero-G kick, webcam motion field,
 * shockwaves) should act on. Kept outside React state on purpose: it is
 * read every frame and never drives rendering.
 */
export const bodies = new Set<RapierRigidBody>();

export function registerBodies(list: (RapierRigidBody | null | undefined)[]) {
  const added = list.filter(Boolean) as RapierRigidBody[];
  added.forEach((b) => bodies.add(b));
  return () => added.forEach((b) => bodies.delete(b));
}

/** Radial impulse from a world point, used by shockwaves and the motion field. */
export function blast(
  origin: { x: number; y: number; z: number },
  radius: number,
  strength: number,
  lift = 0.6
) {
  bodies.forEach((b) => {
    const p = b.translation();
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    const dz = p.z - origin.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > radius || d < 1e-4) return;
    const f = (strength * (1 - d / radius)) * b.mass();
    b.applyImpulse({ x: (dx / d) * f, y: (Math.abs(dy / d) + lift) * f, z: (dz / d) * f }, true);
  });
}
