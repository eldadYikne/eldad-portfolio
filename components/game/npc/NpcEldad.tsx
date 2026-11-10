"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NPC } from "../world";
import { player } from "../store";
import { Avatar } from "../scene/Player";
import { useNpc } from "./state";

const holoVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vY = w.y;
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const holoFragment = /* glsl */ `
  uniform float uTime;
  uniform float uTalk;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vY;
  void main() {
    float fres = pow(1.0 - abs(dot(vNormal, vView)), 2.0);
    float scan = 0.55 + 0.45 * sin(vY * 60.0 - uTime * 6.0);
    float flicker = 0.92 + 0.08 * sin(uTime * 37.0) * sin(uTime * 13.0);
    vec3 col = mix(vec3(0.15, 0.75, 1.0), vec3(0.75, 0.95, 1.0), fres);
    float a = (0.28 + fres * 0.7) * scan * flicker + uTalk * 0.12;
    gl_FragColor = vec4(col * (1.2 + uTalk * 0.6), clamp(a, 0.0, 0.95));
  }
`;

/**
 * Eldad's AI digital twin: a hologram of the player avatar on a projector
 * pad. Step into the ring and the chat opens; it answers from the real CV
 * through the existing RAG agent.
 */
export function NpcEldad() {
  const group = useRef<THREE.Group>(null);
  const figure = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const near = useNpc((s) => s.near);
  const messages = useNpc((s) => s.messages);
  const thinking = useNpc((s) => s.thinking);
  const last = [...messages].reverse().find((m) => m.role === "assistant")?.content;

  const holo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoVertex,
        fragmentShader: holoFragment,
        uniforms: { uTime: { value: 0 }, uTalk: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const { talking, setNear } = useNpc.getState();
    holo.uniforms.uTime.value = t;
    holo.uniforms.uTalk.value = THREE.MathUtils.damp(holo.uniforms.uTalk.value, talking ? 1 : 0, 6, dt);

    const d = Math.hypot(player.x - NPC.ring[0], player.z - NPC.ring[1]);
    setNear(d < NPC.ringR);

    if (figure.current) {
      figure.current.position.y = 0.35 + Math.sin(t * 1.6) * 0.06 + (talking ? Math.abs(Math.sin(t * 9)) * 0.05 : 0);
      // Turn toward the visitor when they're close, otherwise idle sway.
      const want = Math.hypot(player.x - NPC.pos[0], player.z - NPC.pos[1]) < 7 ? Math.atan2(player.x - NPC.pos[0], player.z - NPC.pos[1]) : Math.sin(t * 0.4) * 0.6;
      let diff = want - figure.current.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      figure.current.rotation.y += diff * Math.min(1, dt * 4);
    }
    if (ring.current) ring.current.rotation.z = t * (near ? 2 : 0.6);
    if (bubble.current) bubble.current.style.opacity = String(0.85 + Math.sin(t * 3) * 0.15);
  });

  const bubbleText = thinking && !last ? "…" : near && last ? last : "Ask me anything 💬";

  return (
    <group ref={group}>
      <group position={[NPC.pos[0], 0, NPC.pos[1]]}>
        {/* projector pad */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.85, 1, 0.24, 32]} />
          <meshToonMaterial color="#2b2d55" />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.75, 32]} />
          <meshBasicMaterial color="#41d1ff" transparent opacity={0.85} />
        </mesh>
        {/* light cone */}
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.55, 0.8, 2.3, 24, 1, true]} />
          <meshBasicMaterial color="#7fe3ff" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <group ref={figure} scale={0.92}>
          <Avatar holo={holo} weapon={false} />
        </group>
        <Html position={[0, 3.25, 0]} center zIndexRange={[16, 6]} pointerEvents="none">
          <div ref={bubble} className={`npc-bubble ${near ? "near" : ""}`} dir="auto">
            <b>AI Eldad</b>
            <span>{bubbleText.length > 150 ? `${bubbleText.slice(0, 147)}…` : bubbleText}</span>
          </div>
        </Html>
      </group>
      {/* trigger ring */}
      <mesh ref={ring} position={[NPC.ring[0], 0.05, NPC.ring[1]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[NPC.ringR - 0.14, NPC.ringR, 40, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color="#41d1ff" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh position={[NPC.ring[0], 0.045, NPC.ring[1]]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[NPC.ringR, 32]} />
        <meshBasicMaterial color="#41d1ff" transparent opacity={near ? 0.3 : 0.15} depthWrite={false} />
      </mesh>
    </group>
  );
}
