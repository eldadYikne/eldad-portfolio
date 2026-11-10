"use client";

import { useMemo, type ReactNode } from "react";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import type { BossId } from "../world";

/**
 * Original monsters inspired by the dev tools Eldad works with: a pixel
 * critter, an octo-kitten and a spinning knot spirit. Each is built from
 * primitives with its own material set, so hits can flash it white.
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
  if (kind === "critter") return <Critter parts={parts} outline={outline} />;
  if (kind === "octo") return <Octo parts={parts} outline={outline} />;
  return <Knot parts={parts} outline={outline} />;
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

/* ---- Octo-Kitten: cat-eared head, round face, wiggling tentacles ---- */
function Octo({ parts, outline }: { parts: MonsterParts; outline: boolean }) {
  const [skin, face, eye] = useMats(["#24243a", "#e8c3a4", "#8a4b3c"], parts);
  parts.a = [];
  return (
    <group ref={(g) => void (parts.body = g)}>
      <mesh position={[0, 1.05, 0]} material={skin} castShadow>
        <sphereGeometry args={[0.5, 20, 16]} />
        <Ink on={outline} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, 1.5, 0]} rotation={[0, 0, -s * 0.35]} material={skin}>
          <coneGeometry args={[0.16, 0.34, 4]} />
          <Ink on={outline} />
        </mesh>
      ))}
      <mesh position={[0, 0.98, 0.3]} scale={[1, 0.82, 0.5]} material={face}>
        <sphereGeometry args={[0.38, 18, 14]} />
      </mesh>
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 1.02, 0.49]} scale={[0.75, 1, 0.5]} material={eye}>
          <sphereGeometry args={[0.08, 10, 10]} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} position={[Math.sin(a) * 0.22, 0.6, Math.cos(a) * 0.22]} rotation={[0, a, 0]} ref={(g) => void (g && (parts.a[i] = g))}>
            <mesh position={[0, -0.28, 0.08]} rotation={[0.25, 0, 0]} material={skin} castShadow>
              <capsuleGeometry args={[0.075, 0.45, 4, 8]} />
              <Ink on={outline} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ---- Knot Spirit: six interlocking petals spinning around a glowing core ---- */
function Knot({ parts, outline }: { parts: MonsterParts; outline: boolean }) {
  const [petal, core, eye] = useMats(["#1f1f24", "#ffffff", "#1f1f24"], parts);
  parts.a = [];
  return (
    <group ref={(g) => void (parts.body = g)}>
      <group position={[0, 1.05, 0]} ref={(g) => void (parts.spin = g)}>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i / 6) * Math.PI * 2]}>
            <mesh position={[0.3, 0.12, (i % 2) * 0.06]} rotation={[0, 0, 0.55]} material={petal} castShadow>
              <torusGeometry args={[0.3, 0.075, 8, 20, Math.PI * 1.25]} />
              <Ink on={outline} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 1.05, 0.02]} material={core}>
        <circleGeometry args={[0.24, 20]} />
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 1.08, 0.05]} material={eye}>
          <boxGeometry args={[0.05, 0.12, 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

/** Per-kind idle/move animation. `t` = time, `move` = 0..1 walking intensity. */
export function animateMonster(kind: BossId, p: MonsterParts, t: number, move: number) {
  if (kind === "critter") {
    p.a.forEach((l, i) => l && (l.rotation.x = Math.sin(t * 16 + i * Math.PI) * 0.7 * move));
    if (p.body) p.body.position.y = Math.abs(Math.sin(t * 16)) * 0.12 * move + Math.sin(t * 2) * 0.02;
  } else if (kind === "octo") {
    p.a.forEach((l, i) => l && (l.rotation.x = Math.sin(t * (4 + move * 6) + i * 1.3) * 0.35));
    if (p.body) p.body.position.y = 0.1 + Math.sin(t * 3) * 0.08;
  } else {
    if (p.spin) p.spin.rotation.z = t * (2 + move * 8);
    if (p.body) p.body.position.y = 0.25 + Math.sin(t * 2.4) * 0.15;
  }
}

/** Flash all materials white (k = 0..1). */
export function flashMonster(p: MonsterParts, k: number) {
  p.mats.forEach((m) => {
    m.emissive.setScalar(k * 0.9);
  });
}
