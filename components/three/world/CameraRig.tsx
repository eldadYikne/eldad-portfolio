"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { fx, useWorld, type Section } from "../store";

export const SECTIONS: Record<Section, { pos: [number, number, number]; look: [number, number, number] }> = {
  hero: { pos: [0, 3.4, 13.5], look: [0, 2.3, 0] },
  experience: { pos: [-7.4, 4.4, 8.2], look: [-7.4, 1, -0.4] },
  projects: { pos: [7.6, 4.6, 6.8], look: [7.6, 1.2, -1.2] },
  skills: { pos: [0, 8.8, 3.6], look: [0, 0.4, -5.2] },
  education: { pos: [-5.6, 4.8, 1.8], look: [-9, 0.8, -6.4] },
};

/** Shared with depth of field so focus follows whatever the camera is looking at. */
export const focusTarget = new THREE.Vector3(...SECTIONS.hero.look);

const pos = new THREE.Vector3();
const look = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const desiredLook = new THREE.Vector3();

export function CameraRig() {
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    pos.set(0, 9, 24); // intro: start far and high, glide in
    look.set(...SECTIONS.hero.look);
    camera.position.copy(pos);
  }, [camera]);

  useFrame((state, dt) => {
    const { section, reducedMotion } = useWorld.getState();
    const s = SECTIONS[section];
    desiredLook.set(...s.look);
    desiredPos.set(...s.pos);

    // Portrait / narrow screens: pull back along the view direction so everything fits.
    const aspect = state.size.width / state.size.height;
    if (aspect < 1.3) {
      const f = THREE.MathUtils.clamp(1.3 / aspect, 1, 2.3);
      desiredPos.sub(desiredLook).multiplyScalar(f).add(desiredLook);
    }

    if (!reducedMotion) {
      desiredPos.x += state.pointer.x * 1.1;
      desiredPos.y += state.pointer.y * 0.5;
    }

    const lambda = reducedMotion ? 6 : 2.2;
    pos.x = THREE.MathUtils.damp(pos.x, desiredPos.x, lambda, dt);
    pos.y = THREE.MathUtils.damp(pos.y, desiredPos.y, lambda, dt);
    pos.z = THREE.MathUtils.damp(pos.z, desiredPos.z, lambda, dt);
    look.x = THREE.MathUtils.damp(look.x, desiredLook.x, lambda * 1.2, dt);
    look.y = THREE.MathUtils.damp(look.y, desiredLook.y, lambda * 1.2, dt);
    look.z = THREE.MathUtils.damp(look.z, desiredLook.z, lambda * 1.2, dt);

    camera.position.copy(pos);

    // Screen shake from impacts, decaying exponentially.
    if (fx.shake > 0.001) {
      const t = state.clock.elapsedTime * 40;
      const a = fx.shake * fx.shake * 0.35;
      camera.position.x += Math.sin(t * 1.1) * a;
      camera.position.y += Math.cos(t * 1.7) * a;
      fx.shake *= Math.exp(-5 * dt);
    }

    camera.lookAt(look);
    focusTarget.copy(look);
  });

  return null;
}
