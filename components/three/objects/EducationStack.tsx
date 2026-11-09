"use client";

import { useEffect, useRef, useState } from "react";
import { Edges, RoundedBox } from "@react-three/drei";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { education } from "@/content/portfolio";
import { useWorld } from "../store";
import { materials } from "../materials";
import { beginDrag } from "../physics/drag";
import { registerBodies } from "../physics/registry";
import { anchors } from "../anchors";
import { Label } from "./Label";

const SIZE: [number, number, number] = [3.4, 0.42, 1.9];
const COLORS = ["#34d399", "#60a5fa", "#e879f9"];

/** Degrees stacked like books: knock the tower over. */
export function EducationStack() {
  // Oldest at the bottom, so stack in reverse.
  const stack = [...education].reverse();
  return (
    <>
      {stack.map((ed, i) => (
        <Slab key={ed.id} ed={ed} color={COLORS[i]} position={[-9, 6 + i * 1.6, -6.4]} yaw={(i - 1) * 0.12} />
      ))}
    </>
  );
}

function Slab({
  ed,
  color,
  position,
  yaw,
}: {
  ed: (typeof education)[number];
  color: string;
  position: [number, number, number];
  yaw: number;
}) {
  const body = useRef<RapierRigidBody>(null);
  const anchor = useRef<THREE.Group>(null);
  const select = useWorld((s) => s.select);
  const setTooltip = useWorld((s) => s.setTooltip);
  const [hovered, setHovered] = useState(false);
  const [w, h, d] = SIZE;

  useEffect(() => registerBodies([body.current]), []);
  useEffect(() => {
    const g = anchor.current;
    if (!g) return;
    const key = `education:${ed.id}`;
    anchors.set(key, g);
    return () => {
      anchors.delete(key);
    };
  }, [ed.id]);

  return (
    <RigidBody ref={body} position={position} rotation={[0, yaw, 0]} colliders="cuboid" mass={1.5} friction={0.9}>
      <group ref={anchor}>
        <RoundedBox
          args={SIZE}
          radius={0.05}
          smoothness={2}
          material={materials.panel}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "grab";
            setTooltip({ text: `${ed.title} · ${ed.year}`, color });
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "";
            setTooltip(null);
          }}
          onPointerDown={(e) => {
            setTooltip(null);
            beginDrag(body.current, e, () => select({ kind: "education", id: ed.id }));
          }}
        >
          <Edges threshold={20} color={hovered ? "#ffffff" : color} scale={1.004} />
        </RoundedBox>
        <group position={[0, h / 2 + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <Label fontSize={0.2} position={[0, 0.22, 0]} color="#f8fafc" maxWidth={w - 0.4} textAlign="center">
            {ed.title}
          </Label>
          <Label bold={false} fontSize={0.13} position={[0, -0.2, 0]} color={color}>
            {[ed.school, ed.year].filter(Boolean).join(" · ")}
          </Label>
        </group>
        <mesh position={[0, 0, d / 2 + 0.006]}>
          <planeGeometry args={[w - 0.3, 0.03]} />
          <meshBasicMaterial toneMapped={false} color={new THREE.Color(color).multiplyScalar(4)} />
        </mesh>
      </group>
    </RigidBody>
  );
}
