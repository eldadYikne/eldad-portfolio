"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  InstancedRigidBodies,
  type InstancedRigidBodyProps,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { skillColors, skills } from "@/content/portfolio";
import { useWorld } from "../store";
import { createInstanceGlowMaterial } from "../materials";
import { beginDrag } from "../physics/drag";
import { registerBodies } from "../physics/registry";

const RADIUS = 0.42;

/**
 * Every skill is a physical sphere, but all of them together are one
 * InstancedMesh: one draw call however many skills there are.
 */
export function SkillSpheres() {
  const bodies = useRef<RapierRigidBody[]>(null);
  const setTooltip = useWorld((s) => s.setTooltip);
  const lastId = useRef(-1);

  const instances = useMemo<InstancedRigidBodyProps[]>(
    () =>
      skills.map((s, i) => ({
        key: s.name,
        position: [
          -2.6 + (i % 6) * 1.05 + (Math.random() - 0.5) * 0.3,
          7 + Math.floor(i / 6) * 1.4 + Math.random() * 2,
          -6.2 + (Math.floor(i / 6) % 3) * 1.1 + (Math.random() - 0.5) * 0.4,
        ],
        rotation: [Math.random() * 3, Math.random() * 3, 0],
      })),
    []
  );

  const colors = useMemo(() => {
    const arr = new Float32Array(skills.length * 3);
    const c = new THREE.Color();
    skills.forEach((s, i) => c.set(skillColors[s.category]).toArray(arr, i * 3));
    return arr;
  }, []);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(RADIUS, 3), []);
  const material = useMemo(() => createInstanceGlowMaterial(0.85), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useEffect(() => registerBodies(bodies.current ?? []), []);

  return (
    <InstancedRigidBodies
      ref={bodies}
      instances={instances}
      colliders="ball"
      restitution={0.55}
      friction={0.4}
      linearDamping={0.05}
      angularDamping={0.2}
    >
      <instancedMesh
        args={[geometry, material, skills.length]}
        count={skills.length}
        castShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          const id = e.instanceId ?? -1;
          if (id === lastId.current) return;
          lastId.current = id;
          if (id < 0) return;
          document.body.style.cursor = "grab";
          setTooltip({ text: skills[id].name, color: skillColors[skills[id].category] });
        }}
        onPointerOut={() => {
          lastId.current = -1;
          document.body.style.cursor = "";
          setTooltip(null);
        }}
        onPointerDown={(e) => {
          if (e.instanceId == null) return;
          beginDrag(bodies.current?.[e.instanceId], e);
        }}
      >
        <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
      </instancedMesh>
    </InstancedRigidBodies>
  );
}
