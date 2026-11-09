"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { projects, type Project } from "@/content/portfolio";
import { palettes, useWorld } from "../store";
import { accentA, accentB, materials } from "../materials";
import { anchors } from "../anchors";
import { Label } from "./Label";

const CONSOLE = { x: 7.6, z: -1.2, w: 8.4, h: 0.7, d: 3 };
const byId = (id: Project["id"]) => projects.find((p) => p.id === id)!;

/** Fixed control console holding one physical gadget per project. */
export function ProjectMachines() {
  const mode = useWorld((s) => s.mode);
  return (
    <group position={[CONSOLE.x, 0, CONSOLE.z]}>
      <RigidBody type="fixed" colliders="cuboid">
        <RoundedBox
          args={[CONSOLE.w, CONSOLE.h, CONSOLE.d]}
          radius={0.06}
          position={[0, CONSOLE.h / 2, 0]}
          material={materials.darkMetal}
          receiveShadow
          castShadow
        >
          <Edges threshold={20} color={palettes[mode].b} />
        </RoundedBox>
      </RigidBody>
      <mesh position={[0, CONSOLE.h - 0.12, CONSOLE.d / 2 + 0.005]} material={materials.glowB}>
        <planeGeometry args={[CONSOLE.w - 0.4, 0.02]} />
      </mesh>

      <Machine project={byId("giborim")} x={-2.8}>
        <Lever />
      </Machine>
      <Machine project={byId("logiki")} x={0}>
        <GravityButton />
      </Machine>
      <Machine project={byId("motion")} x={2.8}>
        <MotionCamera />
      </Machine>
    </group>
  );
}

function Machine({ project, x, children }: { project: Project; x: number; children: ReactNode }) {
  const anchor = useRef<THREE.Group>(null);
  useEffect(() => {
    const g = anchor.current;
    if (!g) return;
    const key = `project:${project.id}`;
    anchors.set(key, g);
    return () => {
      anchors.delete(key);
    };
  }, [project.id]);

  return (
    <group position={[x, CONSOLE.h, 0]}>
      <group ref={anchor} position={[0, 1.2, 0]} />
      {children}
      <group position={[0, -CONSOLE.h / 2, CONSOLE.d / 2 + 0.01]}>
        <Label fontSize={0.2} position={[0, 0.08, 0]} color="#f8fafc">
          {project.name}
        </Label>
        <Label bold={false} fontSize={0.1} position={[0, -0.16, 0]} color="#94a3b8">
          {project.kicker.toUpperCase()}
        </Label>
      </group>
    </group>
  );
}

/** Shared pointer handlers: hover tooltip, then run the machine and open its card. */
function useMachineHandlers(project: Project, activate: () => void) {
  const select = useWorld((s) => s.select);
  const setTooltip = useWorld((s) => s.setTooltip);
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
      setTooltip({ text: project.machine, color: "#ffffff" });
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
      setTooltip(null);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      activate();
      select({ kind: "project", id: project.id });
    },
  };
}

/* ---- Bishvil Giborim: lever that flips the whole world into Heroes Mode ---- */
function Lever() {
  const mode = useWorld((s) => s.mode);
  const toggle = useWorld((s) => s.toggleMode);
  const arm = useRef<THREE.Group>(null);
  const handlers = useMachineHandlers(byId("giborim"), toggle);

  useFrame((_, dt) => {
    if (!arm.current) return;
    const target = mode === "heroes" ? 0.75 : -0.75;
    arm.current.rotation.x = THREE.MathUtils.damp(arm.current.rotation.x, target, 7, dt);
  });

  return (
    <group {...handlers}>
      <RoundedBox args={[1.1, 0.35, 1.1]} radius={0.05} position={[0, 0.175, 0]} material={materials.panel} castShadow />
      <mesh position={[0, 0.36, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.darkMetal}>
        <cylinderGeometry args={[0.12, 0.12, 0.9, 24]} />
      </mesh>
      <group ref={arm} position={[0, 0.36, 0]}>
        <mesh position={[0, 0.65, 0]} material={materials.darkMetal} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.3, 16]} />
        </mesh>
        <mesh position={[0, 1.35, 0]} material={mode === "heroes" ? materials.glowA : materials.glowB}>
          <sphereGeometry args={[0.17, 24, 24]} />
        </mesh>
      </group>
      <Label fontSize={0.08} position={[0, 0.355, 0.56]} rotation={[-Math.PI / 2, 0, 0]} color="#94a3b8">
        VOID ◂ ▸ HEROES
      </Label>
    </group>
  );
}

/* ---- Logiki: the big button that switches gravity off ---- */
function GravityButton() {
  const zeroG = useWorld((s) => s.zeroG);
  const toggle = useWorld((s) => s.toggleZeroG);
  const cap = useRef<THREE.Mesh>(null);
  const press = useRef(0);
  const handlers = useMachineHandlers(byId("logiki"), () => {
    press.current = 1;
    toggle();
  });
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, dt) => {
    press.current = THREE.MathUtils.damp(press.current, 0, 6, dt);
    if (cap.current) cap.current.position.y = 0.42 - press.current * 0.12;
    if (ringMat.current) {
      const k = zeroG ? 3 + Math.sin(state.clock.elapsedTime * 5) * 2 : 2;
      ringMat.current.color.copy(zeroG ? accentA : accentB).multiplyScalar(k);
    }
  });

  return (
    <group {...handlers}>
      <mesh position={[0, 0.15, 0]} material={materials.panel} castShadow>
        <cylinderGeometry args={[0.62, 0.7, 0.3, 48]} />
      </mesh>
      <mesh position={[0, 0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.58, 48]} />
        <meshBasicMaterial ref={ringMat} toneMapped={false} />
      </mesh>
      <mesh ref={cap} position={[0, 0.42, 0]} material={zeroG ? materials.glowA : materials.glowB}>
        <cylinderGeometry args={[0.42, 0.45, 0.2, 48]} />
      </mesh>
      <Label fontSize={0.09} position={[0, 0.31, 0.64]} rotation={[-Math.PI / 2, 0, 0]} color="#e2e8f0">
        {zeroG ? "ZERO-G" : "GRAVITY"}
      </Label>
    </group>
  );
}

/* ---- Motion-Tracking Games: a camera that turns your webcam into a force field ---- */
function MotionCamera() {
  const on = useWorld((s) => s.motionLab);
  const setOn = useWorld((s) => s.setMotionLab);
  const head = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const rec = useRef<THREE.Mesh>(null);
  const handlers = useMachineHandlers(byId("motion"), () => setOn(!useWorld.getState().motionLab));

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (head.current) {
      // Idle: scan left and right. Active: track the pointer, it's watching you.
      const yaw = on ? state.pointer.x * 0.6 : Math.sin(t * 0.5) * 0.5;
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, yaw, 4, dt);
    }
    if (ring.current) ring.current.rotation.z += dt * (on ? 4 : 0.4);
    if (rec.current) rec.current.visible = on && Math.sin(t * 6) > 0;
  });

  return (
    <group {...handlers}>
      <mesh position={[0, 0.35, 0]} material={materials.darkMetal}>
        <cylinderGeometry args={[0.06, 0.08, 0.7, 12]} />
      </mesh>
      <group ref={head} position={[0, 0.95, 0]}>
        <RoundedBox args={[0.95, 0.6, 0.7]} radius={0.08} material={materials.panel} castShadow />
        <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]} material={materials.darkMetal}>
          <cylinderGeometry args={[0.24, 0.27, 0.2, 32]} />
        </mesh>
        <mesh ref={ring} position={[0, 0, 0.53]}>
          <torusGeometry args={[0.2, 0.025, 8, 48]} />
          <meshBasicMaterial toneMapped={false} color={new THREE.Color(accentA).multiplyScalar(on ? 5 : 2)} />
        </mesh>
        <mesh position={[0, 0, 0.525]}>
          <circleGeometry args={[0.16, 32]} />
          <meshStandardMaterial color="#020205" metalness={1} roughness={0.05} />
        </mesh>
        <mesh ref={rec} position={[0.33, 0.2, 0.36]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial toneMapped={false} color={new THREE.Color(6, 0.3, 0.3)} />
        </mesh>
      </group>
      {on && <pointLight position={[0, 0.95, 0.8]} color={accentB} intensity={8} distance={4} />}
    </group>
  );
}
