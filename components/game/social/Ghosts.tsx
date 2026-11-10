"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Avatar } from "../scene/Player";
import { flag, ghosts, startPresence, usePresence } from "./presence";

/** Other visitors, live: translucent avatars that glide between updates. */
export function Ghosts() {
  const ids = usePresence((s) => s.ids);
  useEffect(() => startPresence(), []);
  const material = useMemo(
    () => new THREE.MeshToonMaterial({ color: "#dbeafe", transparent: true, opacity: 0.45, depthWrite: false }),
    []
  );
  return (
    <>
      {ids.map((id) => (
        <GhostAvatar key={id} id={id} material={material} />
      ))}
    </>
  );
}

function GhostAvatar({ id, material }: { id: string; material: THREE.Material }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const init = useRef(false);
  const phase = useRef(Math.random() * 6);
  const g0 = ghosts.get(id);

  useFrame((state, dt) => {
    const g = ghosts.get(id);
    const grp = group.current;
    if (!g || !grp) return;
    if (!init.current) {
      grp.position.set(g.x, 0, g.z);
      grp.rotation.y = g.h;
      init.current = true;
    }
    // Updates arrive ~1/s: ease toward them so ghosts walk instead of teleporting.
    const k = 1 - Math.exp(-4 * dt);
    const dx = g.x - grp.position.x;
    const dz = g.z - grp.position.z;
    grp.position.x += dx * k;
    grp.position.z += dz * k;
    let diff = g.h - grp.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    grp.rotation.y += diff * k;
    const walking = Math.hypot(dx, dz) > 0.08;
    phase.current += dt * (walking ? 12 : 2);
    const s = Math.sin(phase.current) * (walking ? 0.8 : 0);
    if (legL.current) legL.current.rotation.x = s;
    if (legR.current) legR.current.rotation.x = -s;
    if (armL.current) armL.current.rotation.x = -s;
    if (armR.current) armR.current.rotation.x = s;
    if (body.current) body.current.position.y = 0.15 + Math.sin(state.clock.elapsedTime * 2 + phase.current) * 0.06;
  });

  return (
    <group ref={group}>
      <group ref={body} scale={0.9}>
        <Avatar legL={legL} legR={legR} armL={armL} armR={armR} holo={material} weapon={false} />
      </group>
      <Html position={[0, 2.5, 0]} center zIndexRange={[14, 4]} pointerEvents="none">
        <div className="ghost-tag">
          {flag(g0?.country ?? "")} Explorer
        </div>
      </Html>
    </group>
  );
}
