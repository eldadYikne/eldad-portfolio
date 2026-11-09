"use client";

import { forwardRef } from "react";
import * as THREE from "three";
import { Label } from "../objects/Label";

/** Limb handles the squad animates every frame. */
export type Rig = {
  root: THREE.Group | null;
  hips: THREE.Group | null;
  legL: THREE.Group | null;
  legR: THREE.Group | null;
  armL: THREE.Group | null;
  armR: THREE.Group | null;
  head: THREE.Group | null;
};

export const newRig = (): Rig => ({ root: null, hips: null, legL: null, legR: null, armL: null, armR: null, head: null });

// Shared by every agent: one set of geometries and materials however big the squad gets.
const suit = new THREE.MeshStandardMaterial({ color: "#0a0b10", roughness: 0.55, metalness: 0.2 });
const shirt = new THREE.MeshStandardMaterial({ color: "#e5e7eb", roughness: 0.6 });
const skin = new THREE.MeshStandardMaterial({ color: "#c58c6a", roughness: 0.7 });
const shades = new THREE.MeshStandardMaterial({ color: "#020203", roughness: 0.05, metalness: 1 });
const tie = new THREE.MeshStandardMaterial({ color: "#7f1d1d", roughness: 0.5 });
const badge = new THREE.MeshBasicMaterial({ color: new THREE.Color("#22d3ee").multiplyScalar(3), toneMapped: false });
const shoe = new THREE.MeshStandardMaterial({ color: "#000", roughness: 0.2, metalness: 0.6 });

const g = {
  leg: new THREE.BoxGeometry(0.17, 0.82, 0.2).translate(0, -0.41, 0),
  shoe: new THREE.BoxGeometry(0.19, 0.08, 0.32),
  torso: new THREE.BoxGeometry(0.54, 0.72, 0.3),
  shirt: new THREE.PlaneGeometry(0.16, 0.5),
  tie: new THREE.BoxGeometry(0.06, 0.42, 0.02),
  arm: new THREE.BoxGeometry(0.14, 0.7, 0.16).translate(0, -0.35, 0),
  hand: new THREE.SphereGeometry(0.075, 10, 10),
  head: new THREE.SphereGeometry(0.17, 20, 20),
  shades: new THREE.BoxGeometry(0.3, 0.07, 0.06),
  ear: new THREE.TorusGeometry(0.035, 0.012, 6, 12),
  wire: new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4),
  badge: new THREE.CircleGeometry(0.15, 32),
};

/**
 * A secret agent built from primitives, standing on y = 0 and facing +z.
 * The back carries a glowing EY insignia.
 */
export const AgentBody = forwardRef<THREE.Group, { rig: Rig }>(function AgentBody({ rig }, ref) {
  return (
    <group ref={ref}>
      <group ref={(o) => void (rig.root = o)}>
        <group ref={(o) => void (rig.hips = o)}>
          <group position={[-0.11, 0.86, 0]} ref={(o) => void (rig.legL = o)}>
            <mesh geometry={g.leg} material={suit} castShadow />
            <mesh geometry={g.shoe} material={shoe} position={[0, -0.82, 0.05]} />
          </group>
          <group position={[0.11, 0.86, 0]} ref={(o) => void (rig.legR = o)}>
            <mesh geometry={g.leg} material={suit} castShadow />
            <mesh geometry={g.shoe} material={shoe} position={[0, -0.82, 0.05]} />
          </group>

          <mesh geometry={g.torso} material={suit} position={[0, 1.22, 0]} castShadow />
          <mesh geometry={g.shirt} material={shirt} position={[0, 1.3, 0.152]} />
          <mesh geometry={g.tie} material={tie} position={[0, 1.27, 0.162]} />

          {/* Back insignia */}
          <group position={[0, 1.28, -0.152]} rotation={[0, Math.PI, 0]}>
            <mesh geometry={g.badge} material={badge} />
            <Label fontSize={0.12} position={[0, 0, 0.002]} color="#05060a">
              EY
            </Label>
          </group>

          <group position={[-0.34, 1.54, 0]} ref={(o) => void (rig.armL = o)}>
            <mesh geometry={g.arm} material={suit} castShadow />
            <mesh geometry={g.hand} material={skin} position={[0, -0.74, 0]} />
          </group>
          <group position={[0.34, 1.54, 0]} ref={(o) => void (rig.armR = o)}>
            <mesh geometry={g.arm} material={suit} castShadow />
            <mesh geometry={g.hand} material={skin} position={[0, -0.74, 0]} />
          </group>

          <group position={[0, 1.78, 0]} ref={(o) => void (rig.head = o)}>
            <mesh geometry={g.head} material={skin} castShadow />
            <mesh geometry={g.shades} material={shades} position={[0, 0.02, 0.15]} />
            <mesh geometry={g.ear} material={shades} position={[0.17, -0.01, 0]} rotation={[0, Math.PI / 2, 0]} />
            <mesh geometry={g.wire} material={shades} position={[0.17, -0.17, -0.02]} />
          </group>
        </group>
      </group>
    </group>
  );
});

/** Procedural run cycle. `carry` lifts both arms overhead to hold a letter. */
export function animateRun(rig: Rig, phase: number, carry: boolean) {
  const s = Math.sin(phase);
  if (rig.legL) rig.legL.rotation.x = s * 0.95;
  if (rig.legR) rig.legR.rotation.x = -s * 0.95;
  if (rig.hips) {
    rig.hips.position.y = Math.abs(Math.cos(phase)) * 0.09;
    rig.hips.rotation.x = 0.18; // lean into the sprint
  }
  if (carry) {
    if (rig.armL) rig.armL.rotation.set(-Math.PI * 0.92, 0, 0.25);
    if (rig.armR) rig.armR.rotation.set(-Math.PI * 0.92, 0, -0.25);
  } else {
    if (rig.armL) rig.armL.rotation.set(-s * 0.9, 0, 0.08);
    if (rig.armR) rig.armR.rotation.set(s * 0.9, 0, -0.08);
  }
}

/** Standing guard: arms crossed in front, slight breathing. */
export function animateGuard(rig: Rig, t: number, salute: number) {
  if (rig.legL) rig.legL.rotation.x = 0;
  if (rig.legR) rig.legR.rotation.x = 0;
  if (rig.hips) {
    rig.hips.position.y = Math.sin(t * 2) * 0.008;
    rig.hips.rotation.x = 0;
  }
  if (rig.armL) rig.armL.rotation.set(-0.55, 0, 0.9);
  if (rig.armR) {
    // Blend from crossed arms to a salute.
    rig.armR.rotation.set(
      THREE.MathUtils.lerp(-0.55, -2.6, salute),
      THREE.MathUtils.lerp(0, 0.3, salute),
      THREE.MathUtils.lerp(-0.9, -0.9, salute)
    );
  }
}
