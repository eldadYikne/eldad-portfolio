"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { experience, type Experience } from "@/content/portfolio";
import { useWorld } from "../store";
import { materials } from "../materials";
import { beginDrag } from "../physics/drag";
import { registerBodies } from "../physics/registry";
import { anchors } from "../anchors";
import { Label } from "./Label";

const SIZE: [number, number, number] = [2.8, 1.5, 1.5];
const SLOTS: [number, number, number][] = [
  [-10.4, 6, -0.6],
  [-7.4, 7.5, -0.4],
  [-4.4, 9, -0.6],
];

export function ExperienceBlocks() {
  return (
    <>
      {experience.map((exp, i) => (
        <ExperienceBlock key={exp.id} exp={exp} spawn={SLOTS[i]} index={i} />
      ))}
    </>
  );
}

function ExperienceBlock({ exp, spawn, index }: { exp: Experience; spawn: [number, number, number]; index: number }) {
  const body = useRef<RapierRigidBody>(null);
  const anchor = useRef<THREE.Group>(null);
  const select = useWorld((s) => s.select);
  const setTooltip = useWorld((s) => s.setTooltip);
  const isSelected = useWorld((s) => s.selected?.kind === "experience" && s.selected.id === exp.id);
  const [hovered, setHovered] = useState(false);
  const stripe = useRef<THREE.MeshBasicMaterial>(null);
  const base = new THREE.Color(exp.color);

  useEffect(() => registerBodies([body.current]), []);
  useEffect(() => {
    const g = anchor.current;
    if (!g) return;
    const key = `experience:${exp.id}`;
    anchors.set(key, g);
    return () => {
      anchors.delete(key);
    };
  }, [exp.id]);

  useFrame((state) => {
    if (!stripe.current) return;
    const pulse = isSelected ? 5 + Math.sin(state.clock.elapsedTime * 6) * 1.5 : hovered ? 6 : 3;
    stripe.current.color.copy(base).multiplyScalar(pulse);
  });

  const [w, h, d] = SIZE;
  const face = (z: number, flip = false) => (
    <group position={[0, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]}>
      <Label fontSize={0.34} position={[0, 0.2, 0]} color="#f8fafc" maxWidth={w - 0.3}>
        {exp.company}
      </Label>
      <Label bold={false} fontSize={0.13} position={[0, -0.13, 0]} color="#94a3b8" maxWidth={w - 0.3}>
        {exp.role.toUpperCase()}
      </Label>
      <Label bold={false} fontSize={0.11} position={[0, -0.4, 0]} color={exp.color}>
        {exp.period}
      </Label>
      <mesh position={[0, -0.56, 0]}>
        <planeGeometry args={[w * 0.55, 0.025]} />
        <meshBasicMaterial ref={flip ? undefined : stripe} toneMapped={false} color={exp.color} />
      </mesh>
    </group>
  );

  return (
    <RigidBody
      ref={body}
      position={spawn}
      rotation={[0.06, 0.18 - index * 0.18, 0.04 * (index - 1)]}
      colliders="cuboid"
      mass={3}
      friction={0.7}
      restitution={0.15}
      angularDamping={0.9}
      linearDamping={0.1}
    >
      <group ref={anchor}>
        <RoundedBox
          args={SIZE}
          radius={0.07}
          smoothness={3}
          material={materials.panel}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "grab";
            setTooltip({ text: `${exp.company}: drag to throw, click to open`, color: exp.color });
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "";
            setTooltip(null);
          }}
          onPointerDown={(e) => {
            setTooltip(null);
            beginDrag(body.current, e, () => select({ kind: "experience", id: exp.id }));
          }}
        >
          <Edges threshold={20} color={hovered || isSelected ? "#ffffff" : exp.color} scale={1.003} />
        </RoundedBox>
        {face(d / 2 + 0.006)}
        {face(-d / 2 - 0.006, true)}
        {/* Top face: glowing company initial */}
        <Label
          fontSize={0.9}
          position={[0, h / 2 + 0.006, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={new THREE.Color(exp.color).multiplyScalar(2.5)}
          material-toneMapped={false}
        >
          {exp.company[0]}
        </Label>
      </group>
    </RigidBody>
  );
}
