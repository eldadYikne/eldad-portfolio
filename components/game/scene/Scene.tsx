"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Preload } from "@react-three/drei";
import { useState } from "react";
import { useGame } from "../store";
import { Island } from "./Island";
import { Nature } from "./Nature";
import { Landmarks } from "./Landmarks";
import { Player } from "./Player";
import { ZoneRings } from "./ZoneRings";
import { Combat } from "../combat/Combat";

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
      <directionalLight
        position={[14, 26, 12]}
        intensity={2.2}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />

      <Suspense fallback={null}>
        <Island />
        <Nature />
        <Landmarks />
        <ZoneRings />
        <Player />
        <Combat />
        <Ready />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

function Ready() {
  useEffect(() => useGame.getState().setReady(), []);
  return null;
}
