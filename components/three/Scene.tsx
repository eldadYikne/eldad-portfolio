"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { useWorld, type Quality } from "./store";
import { Arena } from "./physics/arena";
import { DragController } from "./physics/drag";
import { bodies } from "./physics/registry";
import { CameraRig } from "./world/CameraRig";
import { Dust, Floor, Lighting, PaletteDriver } from "./world/Atmosphere";
import { Effects } from "./world/Effects";
import { HeroMonolith } from "./objects/HeroMonolith";
import { ExperienceBlocks } from "./objects/ExperienceBlocks";
import { SkillSpheres } from "./objects/SkillSpheres";
import { ProjectMachines } from "./objects/ProjectMachines";
import { EducationStack } from "./objects/EducationStack";
import { MotionCursor } from "./interaction/MotionCursor";
import { SelectedCard } from "./ui/SelectedCard";
import { ContactBoard } from "./contact/ContactBoard";
import { AgentSquad } from "./contact/AgentSquad";

const DPR: Record<Quality, [number, number]> = {
  high: [1, 1.75],
  medium: [1, 1.35],
  low: [0.75, 1],
};
const LOWER: Record<Quality, Quality> = { high: "medium", medium: "low", low: "low" };
const HIGHER: Record<Quality, Quality> = { high: "high", medium: "high", low: "medium" };

export default function Scene() {
  const quality = useWorld((s) => s.quality);
  const zeroG = useWorld((s) => s.zeroG);
  const setQuality = useWorld((s) => s.setQuality);

  return (
    <Canvas
      shadows="soft"
      dpr={DPR[quality]}
      camera={{ fov: 42, near: 0.1, far: 120, position: [0, 9, 24] }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping; // tone mapping happens in the composer
      }}
      onPointerMissed={() => useWorld.getState().select(null)}
      aria-label="Interactive 3D portfolio scene"
    >
      {/* Adaptive quality: hold 60 FPS by trading resolution and effects. */}
      <PerformanceMonitor
        bounds={(refresh) => (refresh > 90 ? [55, 110] : [48, 58])}
        flipflops={3}
        onDecline={() => setQuality(LOWER[useWorld.getState().quality])}
        onIncline={() => setQuality(HIGHER[useWorld.getState().quality])}
      />
      <PaletteDriver />
      <CameraRig />
      <Lighting />

      <Suspense fallback={null}>
        <Physics gravity={zeroG ? [0, 0, 0] : [0, -9.81, 0]} timeStep={1 / 60}>
          <ZeroGKick zeroG={zeroG} />
          <Arena />
          <DragController />
          <HeroMonolith />
          <Staggered delay={250}>
            <ExperienceBlocks />
          </Staggered>
          <Staggered delay={900}>
            <SkillSpheres />
          </Staggered>
          <Staggered delay={1400}>
            <EducationStack />
          </Staggered>
          <ProjectMachines />
          <MotionCursor />
          <ContactBoard />
          <ContactSquad />
        </Physics>
        <Floor />
        <Dust count={quality === "low" ? 600 : 1600} />
        <SelectedCard />
        <Ready />
        <Preload all />
      </Suspense>

      <Effects />
    </Canvas>
  );
}

/** Mount children after a delay: the world assembles itself in front of you. */
function Staggered({ delay, children }: { delay: number; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), useWorld.getState().reducedMotion ? 0 : delay);
    return () => clearTimeout(id);
  }, [delay]);
  return show ? <>{children}</> : null;
}

/** Entering Zero-G gives every body a gentle random push so the room starts to drift. */
function ZeroGKick({ zeroG }: { zeroG: boolean }) {
  useEffect(() => {
    bodies.forEach((b) => {
      b.wakeUp();
      if (!zeroG) return;
      const m = b.mass();
      b.applyImpulse({ x: (Math.random() - 0.5) * m * 1.5, y: (1 + Math.random() * 2.5) * m, z: (Math.random() - 0.5) * m * 1.5 }, true);
      b.applyTorqueImpulse({ x: (Math.random() - 0.5) * m * 0.3, y: (Math.random() - 0.5) * m * 0.3, z: (Math.random() - 0.5) * m * 0.3 }, true);
    });
  }, [zeroG]);
  return null;
}

/** The squad only exists while the secure channel is open. */
function ContactSquad() {
  const open = useWorld((s) => s.section === "contact");
  return open ? <AgentSquad /> : null;
}

function Ready() {
  const setReady = useWorld((s) => s.setReady);
  useEffect(() => setReady(), [setReady]);
  return null;
}
