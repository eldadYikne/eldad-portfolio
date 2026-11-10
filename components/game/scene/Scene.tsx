"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AdaptiveDpr, PerformanceMonitor, Preload } from "@react-three/drei";
import { useState } from "react";
import { player, useGame } from "../store";
import { City, Portal } from "../city/City";
import { Island } from "./Island";
import { Nature } from "./Nature";
import { Landmarks } from "./Landmarks";
import { Player } from "./Player";
import { ZoneRings } from "./ZoneRings";
import { Combat } from "../combat/Combat";
import { NpcEldad } from "../npc/NpcEldad";
import { Ghosts } from "../social/Ghosts";

const SKY = "#7fd6f5";

export default function Scene() {
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ fov: 34, near: 0.5, far: 160, position: [0, 46, 34] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-label="Eldad's island: walk around to explore the portfolio"
    >
      <PerformanceMonitor onDecline={() => setDpr([1, 1.25])} onIncline={() => setDpr([1, 2])} />
      <AdaptiveDpr pixelated={false} />
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 55, 110]} />

      <hemisphereLight args={["#fff6e6", "#6aa0d8", 1.25]} />
      <Sun />

      <Suspense fallback={null}>
        <Island />
        <Nature />
        <Landmarks />
        <ZoneRings />
        <Player />
        <Combat />
        <NpcEldad />
        <Ghosts />
        <City />
        <Portal to="city" />
        <Ready />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

/** Directional light that follows the player, so shadows work on both islands. */
function Sun() {
  const light = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.position.set(player.x + 14, 26, player.z + 12);
    l.target.position.set(player.x, 0, player.z);
    l.target.updateMatrixWorld();
  });
  return (
    <directionalLight
      ref={light}
      intensity={2.2}
      color="#fff1d6"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-26}
      shadow-camera-right={26}
      shadow-camera-top={26}
      shadow-camera-bottom={-26}
      shadow-camera-far={80}
      shadow-bias={-0.0005}
      shadow-normalBias={0.04}
    />
  );
}

function Ready() {
  useEffect(() => useGame.getState().setReady(), []);
  return null;
}
