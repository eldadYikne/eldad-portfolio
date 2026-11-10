"use client";

import { useMemo, type ReactNode } from "react";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { BossId } from "../world";

/**
 * An original pixel critter, built from primitives with its own material
 * set so hits can flash it white.
 *
 * `parts` receives named groups the caller animates (legs, spin, etc.).
 */
export type MonsterParts = { body: THREE.Group | null; a: THREE.Group[]; spin: THREE.Group | null; mats: THREE.MeshToonMaterial[] };
export const newParts = (): MonsterParts => ({ body: null, a: [], spin: null, mats: [] });

const gradient = (() => {
  const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

function useMats(colors: string[], parts: MonsterParts) {
  return useMemo(() => {
    const m = colors.map((c) => new THREE.MeshToonMaterial({ color: c, gradientMap: gradient }));
    parts.mats = m;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Monster({ kind, parts, outline = false }: { kind: BossId; parts: MonsterParts; outline?: boolean }) {
  void kind;
  return <Critter parts={parts} outline={outline} />;
}

const Ink = ({ on }: { on: boolean }) => (on ? <Outlines thickness={0.04} color="#2a1f3d" /> : null);

/* ---- Pixel Critter: a chunky voxel bug with stubby arms and four legs ---- */
function Critter({ parts, outline }: { parts: MonsterParts; outline: boolean }) {
  const [body, eye] = useMats(["#d97757", "#2a1f3d"], parts);
  parts.a = [];
  const leg = (x: number, i: number): ReactNode => (
    <group key={i} position={[x, 0.42, 0]} ref={(g) => void (g && (parts.a[i] = g))}>
      <mesh position={[0, -0.21, 0]} material={body} castShadow>
        <boxGeometry args={[0.13, 0.42, 0.13]} />
        <Ink on={outline} />
      </mesh>
    </group>
  );
  return (
    <group ref={(g) => void (parts.body = g)}>
      <mesh position={[0, 0.72, 0]} material={body} castShadow>
        <boxGeometry args={[1.05, 0.6, 0.55]} />
        <Ink on={outline} />
      </mesh>
      {/* side arms */}
      <mesh position={[0, 0.68, 0]} material={body} castShadow>
        <boxGeometry args={[1.5, 0.18, 0.3]} />
        <Ink on={outline} />
      </mesh>
      {/* slot eyes */}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0.8, 0.28]} material={eye}>
          <boxGeometry args={[0.1, 0.18, 0.02]} />
        </mesh>
      ))}
      {[-0.4, -0.18, 0.18, 0.4].map((x, i) => leg(x, i))}
    </group>
  );
}

/** Per-kind idle/move animation. `t` = time, `move` = 0..1 walking intensity. */
export function animateMonster(kind: BossId, p: MonsterParts, t: number, move: number) {
  if (kind === "critter") {
    p.a.forEach((l, i) => l && (l.rotation.x = Math.sin(t * 16 + i * Math.PI) * 0.7 * move));
    if (p.body) p.body.position.y = Math.abs(Math.sin(t * 16)) * 0.12 * move + Math.sin(t * 2) * 0.02;
  }
}

/** Flash all materials white (k = 0..1). */
export function flashMonster(p: MonsterParts, k: number) {
  p.mats.forEach((m) => {
    m.emissive.setScalar(k * 0.9);
  });
}
