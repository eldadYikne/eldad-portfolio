"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Outlines, Text } from "@react-three/drei";
import * as THREE from "three";
import { CITY, PORTALS, PALETTE, insideCity } from "../world";
import { toon } from "../toon";
import { input, player } from "../store";
import { useCombat } from "../combat/state";
import { useCity } from "./state";
import { FONT_GAME } from "../scene/Landmarks";

const dummy = new THREE.Object3D();

/** A second island built from Eldad's real public GitHub repos. */
export function City() {
  const status = useCity((s) => s.status);
  const buildings = useCity((s) => s.buildings);
  useEffect(() => void useCity.getState().load(), []);

  // Which building is the player next to? (also tracks whether we're in the city)
  useFrame(() => {
    const st = useCity.getState();
    const inCity = insideCity(player.x, player.z, -2);
    if (inCity !== st.inCity) st.set({ inCity });
    let best = -1;
    let bestD = 2.8;
    if (inCity)
      st.buildings.forEach((b, i) => {
        const d = Math.hypot(player.x - b.x, player.z - b.z) - b.w / 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
    if (best !== st.near) st.set({ near: best });
  });

  const onGround = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || useCombat.getState().mission) return;
    e.stopPropagation();
    input.target = { x: e.point.x, z: e.point.z };
  };

  return (
    <group>
      {/* platform */}
      <mesh position={[CITY.x, -1.6, CITY.z]} material={[toon("#c9c3dc"), toon("#c9c3dc"), toon("#e8e4f5"), toon("#9a93b5"), toon("#c9c3dc"), toon("#c9c3dc")]} receiveShadow onPointerDown={onGround}>
        <boxGeometry args={[CITY.half * 2, 3.2, CITY.half * 2]} />
      </mesh>
      <Streets />
      <Text font={FONT_GAME} fontSize={1.5} position={[CITY.x, 0.03, CITY.z + CITY.half - 6]} rotation={[-Math.PI / 2, 0, 0]} color="#2b2d55" anchorX="center" anchorY="middle">
        GITHUB CITY
      </Text>
      <Text font={FONT_GAME} fontSize={0.55} position={[CITY.x, 0.03, CITY.z + CITY.half - 4.6]} rotation={[-Math.PI / 2, 0, 0]} color="#6b6490" anchorX="center" anchorY="middle">
        {status === "ready" ? `${buildings.length} public repos · height = code size · colour = language` : status === "error" ? "GitHub is napping. Try again later." : "Loading repos…"}
      </Text>
      {status === "ready" && <Buildings />}
      <Portal to="island" />
    </group>
  );
}

function Streets() {
  const lines = useMemo(() => {
    const out: [number, number, number, number][] = [];
    for (let i = -2; i <= 2; i++) {
      out.push([CITY.x + i * 3.4 + 1.7, CITY.z - 1.5, 0.12, CITY.half * 1.6]);
      out.push([CITY.x, CITY.z - 1.5 + i * 3.4 + 1.7, CITY.half * 1.6, 0.12]);
    }
    return out;
  }, []);
  return (
    <>
      {lines.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.015, z]} rotation-x={-Math.PI / 2} material={toon(PALETTE.white)}>
          <planeGeometry args={[w, d]} />
        </mesh>
      ))}
    </>
  );
}

function Buildings() {
  const buildings = useCity((s) => s.buildings);
  const near = useCity((s) => s.near);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const windows = useRef<THREE.InstancedMesh>(null);
  const beacons = useRef<THREE.InstancedMesh>(null);
  const fresh = buildings.filter((b) => b.fresh);

  useLayoutEffect(() => {
    const c = new THREE.Color();
    buildings.forEach((b, i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.w);
      dummy.updateMatrix();
      bodies.current!.setMatrixAt(i, dummy.matrix);
      bodies.current!.setColorAt(i, c.set(b.color));
      dummy.position.set(b.x, b.h + 0.1, b.z);
      dummy.scale.set(b.w + 0.16, 0.2, b.w + 0.16);
      dummy.updateMatrix();
      roofs.current!.setMatrixAt(i, dummy.matrix);
      // A lit window band on the front face, one per building.
      dummy.position.set(b.x, b.h * 0.55, b.z + b.w / 2 + 0.01);
      dummy.scale.set(b.w * 0.7, b.h * 0.7, 1);
      dummy.updateMatrix();
      windows.current!.setMatrixAt(i, dummy.matrix);
    });
    fresh.forEach((b, i) => {
      dummy.position.set(b.x, b.h + 0.55, b.z);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      beacons.current?.setMatrixAt(i, dummy.matrix);
    });
    [bodies, roofs, windows, beacons].forEach((r) => {
      if (!r.current) return;
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
      r.current.computeBoundingSphere();
    });
  }, [buildings, fresh]);

  const windowTex = useMemo(() => {
    // Tiny procedural window grid, tiled across every facade.
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2b2d55";
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#ffe08a";
    for (let y = 4; y < 64; y += 16) for (let x = 6; x < 64; x += 16) if ((x * 7 + y * 3) % 5 !== 0) g.fillRect(x, y, 8, 9);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 3);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame((s) => {
    if (beacons.current) (beacons.current.material as THREE.MeshBasicMaterial).color.setHSL(0.13, 1, 0.5 + Math.sin(s.clock.elapsedTime * 4) * 0.2);
  });

  const nb = near >= 0 ? buildings[near] : null;
  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, toon("#ffffff"), buildings.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <Outlines thickness={0.03} color={PALETTE.outline} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, toon("#2b2d55"), buildings.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh ref={windows} args={[undefined, undefined, buildings.length]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={windowTex} />
      </instancedMesh>
      {fresh.length > 0 && (
        <instancedMesh ref={beacons} args={[undefined, undefined, fresh.length]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#ffd23f" />
        </instancedMesh>
      )}
      {nb && (
        <Html position={[nb.x, nb.h + 1.3, nb.z]} center zIndexRange={[18, 8]} pointerEvents="none">
          <div className="repo-tag" style={{ ["--c" as string]: nb.color }}>
            {nb.name}
          </div>
        </Html>
      )}
    </>
  );
}

/** Swirling portal. Walk into it to warp between the island and the city. */
export function Portal({ to }: { to: "city" | "island" }) {
  const p = to === "city" ? PORTALS.toCity : PORTALS.toIsland;
  const dest = to === "city" ? { x: CITY.x, z: CITY.z + CITY.half - 7.2 } : { x: PORTALS.toCity.x - 2.2, z: PORTALS.toCity.z - 1.6 };
  const disc = useRef<THREE.Mesh>(null);
  const cooldown = useRef(0);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((s, dt) => {
    uniforms.uTime.value = s.clock.elapsedTime;
    cooldown.current = Math.max(0, cooldown.current - dt);
    if (disc.current) disc.current.rotation.z = -s.clock.elapsedTime * 2;
    if (cooldown.current > 0 || useCombat.getState().mission) return;
    if (Math.hypot(player.x - p.x, player.z - p.z) < 1.1) {
      player.x = dest.x;
      player.z = dest.z;
      input.target = null;
      cooldown.current = 1.5;
      useCity.getState().set({ warpAt: performance.now() });
    }
  });

  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <torusGeometry args={[1.25, 0.18, 12, 40]} />
        <meshToonMaterial color={to === "city" ? "#a66cff" : "#22c55e"} />
        <Outlines thickness={0.03} color={PALETTE.outline} />
      </mesh>
      <mesh ref={disc} position={[0, 1.5, 0]}>
        <circleGeometry args={[1.1, 48]} />
        <shaderMaterial
          transparent
          side={THREE.DoubleSide}
          uniforms={uniforms}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`uniform float uTime; varying vec2 vUv;
            void main(){
              vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
              float swirl = sin(a * 5.0 + r * 12.0 - uTime * 4.0) * 0.5 + 0.5;
              vec3 col = mix(vec3(0.42, 0.25, 1.0), vec3(0.3, 0.95, 1.0), swirl);
              col = mix(col, vec3(1.0), smoothstep(0.35, 0.0, r) * 0.8);
              gl_FragColor = vec4(col, smoothstep(1.0, 0.85, r) * 0.92);
            }`}
        />
      </mesh>
      <Html position={[0, 3.4, 0]} center zIndexRange={[15, 5]} pointerEvents="none">
        <div className="zone-tag" style={{ ["--c" as string]: to === "city" ? "#a66cff" : "#22c55e" }}>
          <span>{to === "city" ? "🏙️" : "🏝️"}</span>
          {to === "city" ? "GitHub City" : "Back to the island"}
        </div>
      </Html>
    </group>
  );
}
