"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, Text } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, zoneById, type ZoneId } from "../world";
import { toon } from "../toon";
import { useGame } from "../store";

export const FONT_GAME = "/fonts/lilita-one.woff";

type V3 = [number, number, number];

/** A toon mesh with an ink outline: the building block of every landmark. */
function Part({
  color,
  position,
  rotation,
  scale,
  children,
  outline = true,
  emissive,
}: {
  color: string;
  position?: V3;
  rotation?: V3;
  scale?: V3 | number;
  children: ReactNode;
  outline?: boolean;
  emissive?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      material={toon(color, emissive ? { emissive: color, emissiveIntensity: emissive } : {})}
      castShadow
      receiveShadow
    >
      {children}
      {outline && <Outlines thickness={0.035} color={PALETTE.outline} />}
    </mesh>
  );
}

/** Places a landmark at its zone, facing its trigger ring, and pops it when you arrive. */
function Site({ id, children }: { id: ZoneId; children: ReactNode }) {
  const z = zoneById[id];
  const yaw = Math.atan2(z.ring[0] - z.pos[0], z.ring[1] - z.pos[1]);
  const pop = useRef<THREE.Group>(null);
  const bounce = useRef(0);
  const active = useRef(false);
  useFrame((_, dt) => {
    const on = useGame.getState().zone === id;
    if (on && !active.current) bounce.current = 1;
    active.current = on;
    bounce.current = Math.max(0, bounce.current - dt * 2.2);
    const b = bounce.current;
    const s = 1 + Math.sin(b * Math.PI * 3) * b * 0.08;
    pop.current?.scale.set(s, 1 + (s - 1) * -1.4, s);
  });
  return (
    <group position={[z.pos[0], 0, z.pos[1]]} rotation={[0, yaw, 0]}>
      <group ref={pop}>{children}</group>
    </group>
  );
}

export function Landmarks() {
  return (
    <>
      <Spawn />
      <AsadraHQ />
      <Codere />
      <GoCode />
      <Giborim />
      <Logiki />
      <MotionLab />
      <Crystals />
      <Academy />
      <Pier />
    </>
  );
}

/* ---------------- Spawn: the signpost ---------------- */
function Spawn() {
  const flag = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (flag.current) flag.current.rotation.y = Math.sin(s.clock.elapsedTime * 3) * 0.25;
  });
  return (
    <Site id="about">
      <Part color={PALETTE.wood} position={[-1.7, 1.1, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 2.2, 8]} />
      </Part>
      <Part color={PALETTE.wood} position={[1.7, 1.1, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 2.2, 8]} />
      </Part>
      <Part color={PALETTE.white} position={[0, 1.75, 0.05]}>
        <boxGeometry args={[3.9, 1.25, 0.18]} />
      </Part>
      <Text font={FONT_GAME} fontSize={0.48} position={[0, 1.9, 0.16]} color={PALETTE.navy} anchorX="center" anchorY="middle">
        ELDAD YIKNE
      </Text>
      <Text font={FONT_GAME} fontSize={0.2} position={[0, 1.42, 0.16]} color={PALETTE.coral} anchorX="center" anchorY="middle">
        CTO & FULL-STACK ARCHITECT
      </Text>
      <Part color={PALETTE.wood} position={[1.7, 2.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
      </Part>
      <group position={[1.7, 2.9, 0]}>
        <mesh ref={flag} position={[0.3, 0, 0]} material={toon(PALETTE.yellow)}>
          <boxGeometry args={[0.6, 0.36, 0.03]} />
        </mesh>
      </group>
    </Site>
  );
}

/* ---------------- Asadra HQ: the CTO tower with a rocket on the roof ---------------- */
function AsadraHQ() {
  const rocket = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (rocket.current) {
      rocket.current.position.y = 6.3 + Math.sin(t * 2) * 0.15;
      rocket.current.rotation.y = t * 0.8;
    }
    if (beacon.current) beacon.current.visible = Math.sin(t * 5) > 0;
  });
  const windows: ReactNode[] = [];
  for (let f = 0; f < 4; f++)
    for (let w = -1; w <= 1; w++)
      windows.push(
        <mesh key={`${f}${w}`} position={[w * 0.62, 1.55 + f * 0.75, 1.13]} material={toon(PALETTE.yellow, { emissive: PALETTE.yellow, emissiveIntensity: 0.6 })}>
          <boxGeometry args={[0.36, 0.42, 0.04]} />
        </mesh>
      );
  return (
    <Site id="asadra">
      <Part color={PALETTE.white} position={[0, 0.45, 0]}>
        <boxGeometry args={[3.4, 0.9, 3]} />
      </Part>
      <Part color="#22b8e8" position={[0, 2.55, 0]}>
        <boxGeometry args={[2.3, 3.3, 2.2]} />
      </Part>
      {windows}
      <Part color={PALETTE.white} position={[0, 4.45, 0]}>
        <boxGeometry args={[2.6, 0.5, 2.5]} />
      </Part>
      <Part color={PALETTE.navy} position={[0.8, 5.1, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
      </Part>
      <mesh ref={beacon} position={[0.8, 5.6, -0.5]} material={toon(PALETTE.coral, { emissive: PALETTE.coral, emissiveIntensity: 1.5 })}>
        <sphereGeometry args={[0.1, 10, 10]} />
      </mesh>
      <group ref={rocket} position={[-0.3, 6.3, 0.1]} scale={0.8}>
        <Part color={PALETTE.white} position={[0, 0, 0]}>
          <capsuleGeometry args={[0.32, 0.8, 6, 12]} />
        </Part>
        <Part color={PALETTE.coral} position={[0, 0.78, 0]}>
          <coneGeometry args={[0.32, 0.5, 12]} />
        </Part>
        <Part color="#22b8e8" position={[0, 0.15, 0.3]} outline={false}>
          <sphereGeometry args={[0.12, 10, 10]} />
        </Part>
        {[0, 1, 2].map((i) => (
          <Part key={i} color={PALETTE.coral} position={[Math.cos((i * Math.PI * 2) / 3) * 0.32, -0.5, Math.sin((i * Math.PI * 2) / 3) * 0.32]} rotation={[0, (-i * Math.PI * 2) / 3, 0]}>
            <boxGeometry args={[0.06, 0.4, 0.3]} />
          </Part>
        ))}
        <mesh position={[0, -0.85, 0]} material={toon(PALETTE.yellow, { emissive: "#ff9b3d", emissiveIntensity: 1.6 })}>
          <coneGeometry args={[0.18, 0.5, 10]} />
        </mesh>
      </group>
    </Site>
  );
}

/* ---------------- Codere: the arcade hall with a giant spinning die ---------------- */
function Codere() {
  const die = useRef<THREE.Group>(null);
  const bulbs = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (die.current) {
      die.current.rotation.set(t * 0.6, t * 0.9, 0);
      die.current.position.y = 3.6 + Math.sin(t * 1.6) * 0.2;
    }
    bulbs.current?.children.forEach((b, i) => (b.visible = Math.floor(t * 4 + i) % 2 === 0));
  });
  const pips: V3[] = [
    [0, 0, 0.61], [0.3, 0.3, -0.61], [-0.3, -0.3, -0.61],
    [0.61, 0.3, 0.3], [0.61, -0.3, -0.3], [0.61, 0, 0],
    [-0.61, 0.3, 0.3], [-0.61, -0.3, -0.3], [-0.61, 0.3, -0.3], [-0.61, -0.3, 0.3],
  ];
  return (
    <Site id="codere">
      <Part color={PALETTE.purple} position={[0, 1.1, 0]}>
        <boxGeometry args={[4.4, 2.2, 3.2]} />
      </Part>
      <Part color="#7d45e0" position={[0, 2.35, 0]}>
        <boxGeometry args={[4.7, 0.3, 3.5]} />
      </Part>
      <Part color={PALETTE.navy} position={[0, 0.7, 1.61]}>
        <boxGeometry args={[1.2, 1.4, 0.06]} />
      </Part>
      <group ref={bulbs}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-2 + i * 0.5, 2.05, 1.65]} material={toon(PALETTE.yellow, { emissive: PALETTE.yellow, emissiveIntensity: 1.4 })}>
            <sphereGeometry args={[0.08, 8, 8]} />
          </mesh>
        ))}
      </group>
      <Text font={FONT_GAME} fontSize={0.42} position={[0, 1.65, 1.63]} color={PALETTE.white} anchorX="center" anchorY="middle">
        CODERE
      </Text>
      <group ref={die} position={[0, 3.6, 0]}>
        <Part color={PALETTE.white}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
        </Part>
        {pips.map((p, i) => (
          <mesh key={i} position={p} material={toon(PALETTE.navy)}>
            <sphereGeometry args={[0.1, 8, 8]} />
          </mesh>
        ))}
      </group>
    </Site>
  );
}

/* ---------------- Go-Code: the workshop with a turning gear ---------------- */
function GoCode() {
  const gear = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (gear.current) gear.current.rotation.z -= dt * 0.9;
  });
  return (
    <Site id="gocode">
      <Part color={PALETTE.pink} position={[0, 1, 0]}>
        <boxGeometry args={[3.6, 2, 3]} />
      </Part>
      <Part color={PALETTE.navy} position={[0, 2.55, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]}>
        <cylinderGeometry args={[1.25, 1.25, 3.8, 3]} />
      </Part>
      <Part color={PALETTE.white} position={[0, 0.65, 1.51]}>
        <boxGeometry args={[1, 1.3, 0.06]} />
      </Part>
      <Text font={FONT_GAME} fontSize={0.62} position={[0, 1.6, 1.52]} color={PALETTE.navy} anchorX="center" anchorY="middle">
        {"</>"}
      </Text>
      <group ref={gear} position={[1.85, 1.6, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <Part color={PALETTE.yellow}>
          <torusGeometry args={[0.45, 0.16, 8, 20]} />
        </Part>
        {Array.from({ length: 8 }, (_, i) => (
          <Part key={i} color={PALETTE.yellow} position={[Math.cos((i / 8) * Math.PI * 2) * 0.66, Math.sin((i / 8) * Math.PI * 2) * 0.66, 0]} rotation={[0, 0, (i / 8) * Math.PI * 2]}>
            <boxGeometry args={[0.26, 0.2, 0.2]} />
          </Part>
        ))}
      </group>
    </Site>
  );
}

/* ---------------- Bishvil Giborim: training camp ---------------- */
function Giborim() {
  const flag = useRef<THREE.Mesh>(null);
  const trophy = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (flag.current) {
      const p = flag.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        p.setZ(i, Math.sin(t * 5 + x * 3) * 0.12 * (x + 0.6));
      }
      p.needsUpdate = true;
    }
    if (trophy.current) trophy.current.rotation.y = t;
  });
  return (
    <Site id="giborim">
      {/* podium */}
      <Part color={PALETTE.yellow} position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
      </Part>
      <Part color={PALETTE.stone} position={[-1, 0.33, 0]}>
        <boxGeometry args={[1, 0.66, 1]} />
      </Part>
      <Part color={PALETTE.wood} position={[1, 0.22, 0]}>
        <boxGeometry args={[1, 0.44, 1]} />
      </Part>
      <Text font={FONT_GAME} fontSize={0.5} position={[0, 0.55, 0.51]} color={PALETTE.navy} anchorX="center" anchorY="middle">
        1
      </Text>
      <group ref={trophy} position={[0, 1.4, 0]}>
        <Part color={PALETTE.yellow} position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.28, 0.12, 0.5, 12]} />
        </Part>
        <Part color={PALETTE.yellow} position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.12, 12]} />
        </Part>
      </group>
      {/* flag */}
      <Part color={PALETTE.white} position={[-2.3, 1.7, -0.6]}>
        <cylinderGeometry args={[0.06, 0.07, 3.4, 8]} />
      </Part>
      <mesh ref={flag} position={[-1.65, 3, -0.6]} material={toon(PALETTE.coral)}>
        <planeGeometry args={[1.2, 0.75, 12, 1]} />
      </mesh>
      {/* hurdles */}
      {[-1.4, 0, 1.4].map((x, i) => (
        <group key={i} position={[x, 0, -1.9]}>
          <Part color={PALETTE.white} position={[-0.45, 0.35, 0]}>
            <boxGeometry args={[0.08, 0.7, 0.08]} />
          </Part>
          <Part color={PALETTE.white} position={[0.45, 0.35, 0]}>
            <boxGeometry args={[0.08, 0.7, 0.08]} />
          </Part>
          <Part color={PALETTE.coral} position={[0, 0.62, 0]}>
            <boxGeometry args={[1, 0.12, 0.06]} />
          </Part>
        </group>
      ))}
      {/* tyre stack */}
      {[0, 1, 2].map((i) => (
        <Part key={i} color={PALETTE.navy} position={[2.1, 0.15 + i * 0.26, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.36, 0.13, 8, 16]} />
        </Part>
      ))}
    </Site>
  );
}

/* ---------------- Logiki: the warehouse ---------------- */
function Logiki() {
  const drone = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (drone.current) {
      drone.current.position.set(Math.sin(t * 0.7) * 1.8, 3.6 + Math.sin(t * 2.4) * 0.15, 1.2 + Math.cos(t * 0.7) * 0.8);
      drone.current.rotation.y = -t * 0.7;
    }
  });
  const crate = (pos: V3, color: string, k: number) => (
    <Part key={k} color={color} position={pos} rotation={[0, k * 0.4, 0]}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
    </Part>
  );
  return (
    <Site id="logiki">
      <Part color={PALETTE.wood} position={[0, 1.2, -0.3]}>
        <boxGeometry args={[4, 2.4, 3]} />
      </Part>
      <Part color="#d06f2a" position={[0, 2.95, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.15, 1.15, 4.3, 3]} />
      </Part>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.36, 1.21]} material={toon(i % 2 ? "#9aa0b8" : "#c3c7d8")}>
          <boxGeometry args={[1.8, 0.34, 0.05]} />
        </mesh>
      ))}
      <Text font={FONT_GAME} fontSize={0.34} position={[0, 2.08, 1.22]} color={PALETTE.white} anchorX="center" anchorY="middle">
        LOGIKI
      </Text>
      {crate([-2.3, 0.35, 1.2], PALETTE.yellow, 1)}
      {crate([-2.4, 1.05, 1.15], PALETTE.teal, 2)}
      {crate([-1.6, 0.35, 1.7], PALETTE.coral, 3)}
      {crate([2.3, 0.35, 1.3], PALETTE.purple, 4)}
      {/* delivery drone carrying a crate */}
      <group ref={drone}>
        <Part color={PALETTE.navy}>
          <boxGeometry args={[0.5, 0.16, 0.5]} />
        </Part>
        {[[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.12, z]} material={toon(PALETTE.white)}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
          </mesh>
        ))}
        <Part color={PALETTE.yellow} position={[0, -0.35, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
        </Part>
      </group>
    </Site>
  );
}

/* ---------------- Motion Lab: projector wall, camera, bouncing ball ---------------- */
function MotionLab() {
  const ball = useRef<THREE.Mesh>(null);
  const targets = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const k = (t * 0.8) % 1;
    if (ball.current) {
      // Thrown at the wall, then rolls back.
      ball.current.position.set(Math.sin(t * 0.8) * 1.2, 0.3 + Math.sin(k * Math.PI) * 1.6, 1.4 - Math.sin(k * Math.PI) * 1.3);
    }
    targets.current?.children.forEach((c, i) => {
      const p = (t * 1.3 + i * 0.37) % 1;
      c.scale.setScalar(0.4 + p * 0.8);
      ((c as THREE.Mesh).material as THREE.Material).opacity = 1 - p;
    });
  });
  const colors = [PALETTE.pink, PALETTE.yellow, PALETTE.teal, PALETTE.purple];
  return (
    <Site id="motion">
      <Part color={PALETTE.navy} position={[-1.6, 1.2, -0.4]}>
        <boxGeometry args={[0.15, 2.4, 0.15]} />
      </Part>
      <Part color={PALETTE.navy} position={[1.6, 1.2, -0.4]}>
        <boxGeometry args={[0.15, 2.4, 0.15]} />
      </Part>
      <Part color={PALETTE.white} position={[0, 1.6, -0.45]}>
        <boxGeometry args={[3.4, 2, 0.08]} />
      </Part>
      <group ref={targets} position={[0, 1.6, -0.39]}>
        {colors.map((c, i) => (
          <mesh key={i} position={[-1 + i * 0.66, (i % 2) * 0.5 - 0.25, 0]}>
            <ringGeometry args={[0.18, 0.3, 24]} />
            <meshBasicMaterial color={c} transparent />
          </mesh>
        ))}
      </group>
      {/* tripod camera */}
      <group position={[1.9, 0, 1.4]} rotation={[0, -0.6, 0]}>
        {[0, 1, 2].map((i) => (
          <Part key={i} color={PALETTE.navy} position={[Math.cos(i * 2.1) * 0.2, 0.5, Math.sin(i * 2.1) * 0.2]} rotation={[Math.sin(i * 2.1) * 0.3, 0, -Math.cos(i * 2.1) * 0.3]}>
            <cylinderGeometry args={[0.03, 0.03, 1.05, 6]} />
          </Part>
        ))}
        <Part color={PALETTE.teal} position={[0, 1.15, 0]}>
          <boxGeometry args={[0.55, 0.36, 0.4]} />
        </Part>
        <Part color={PALETTE.navy} position={[0, 1.15, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.2, 12]} />
        </Part>
      </group>
      <mesh ref={ball} material={toon(PALETTE.coral)} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <Outlines thickness={0.03} color={PALETTE.outline} />
      </mesh>
    </Site>
  );
}

/* ---------------- Skill Crystals ---------------- */
function Crystals() {
  const group = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    group.current?.children.forEach((c, i) => {
      c.position.y = c.userData.y + Math.sin(t * 1.5 + i) * 0.12;
      c.rotation.y = t * 0.4 + i;
    });
  });
  const colors = [PALETTE.purple, PALETTE.pink, PALETTE.teal, PALETTE.yellow, "#5b8cff", PALETTE.coral];
  const crystals = Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * Math.PI * 2;
    const r = i === 0 ? 0 : 1.4 + (i % 3) * 0.55;
    const h = i === 0 ? 2.2 : 0.9 + ((i * 7) % 5) * 0.18;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, h, c: colors[i % colors.length] };
  });
  return (
    <Site id="skills">
      <Part color={PALETTE.stone} position={[0, 0.15, 0]} scale={[1, 0.4, 1]}>
        <dodecahedronGeometry args={[2.6, 0]} />
      </Part>
      <group ref={group}>
        {crystals.map((k, i) => (
          <mesh
            key={i}
            position={[k.x, 0.6 + k.h * 0.6, k.z]}
            userData={{ y: 0.6 + k.h * 0.6 }}
            scale={[k.h * 0.32, k.h, k.h * 0.32]}
            material={toon(k.c, { emissive: k.c, emissiveIntensity: 0.25 })}
            castShadow
          >
            <octahedronGeometry args={[0.7, 0]} />
            <Outlines thickness={0.03} color={PALETTE.outline} />
          </mesh>
        ))}
      </group>
    </Site>
  );
}

/* ---------------- Academy ---------------- */
function Academy() {
  const cap = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (cap.current) {
      cap.current.position.y = 4.2 + Math.sin(t * 1.4) * 0.2;
      cap.current.rotation.y = t * 0.6;
    }
  });
  return (
    <Site id="education">
      <Part color="#5b8cff" position={[0, 1, -0.3]}>
        <boxGeometry args={[3.6, 2, 2.6]} />
      </Part>
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <Part key={x} color={PALETTE.white} position={[x, 1, 1.25]}>
          <cylinderGeometry args={[0.14, 0.16, 2, 10]} />
        </Part>
      ))}
      <Part color={PALETTE.white} position={[0, 2.15, 0.3]}>
        <boxGeometry args={[3.9, 0.3, 2.2]} />
      </Part>
      <Part color={PALETTE.white} position={[0, 2.7, 0.3]} rotation={[0, 0, 0]} scale={[1, 0.5, 1]}>
        <cylinderGeometry args={[0.01, 2.1, 1.4, 4, 1]} />
      </Part>
      <group ref={cap} position={[0, 4.2, 0.2]}>
        <Part color={PALETTE.navy}>
          <boxGeometry args={[1.5, 0.1, 1.5]} />
        </Part>
        <Part color={PALETTE.navy} position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.45, 0.5, 0.36, 16]} />
        </Part>
        <mesh position={[0.6, -0.25, 0.6]} material={toon(PALETTE.yellow)}>
          <cylinderGeometry args={[0.03, 0.06, 0.5, 6]} />
        </mesh>
      </group>
      {/* book stack */}
      {[PALETTE.coral, PALETTE.yellow, PALETTE.teal].map((c, i) => (
        <Part key={c} color={c} position={[2.4, 0.13 + i * 0.24, 0.9]} rotation={[0, i * 0.3, 0]}>
          <boxGeometry args={[0.9, 0.22, 0.65]} />
        </Part>
      ))}
    </Site>
  );
}

/* ---------------- Pier with mailbox and a bobbing boat ---------------- */
function Pier() {
  const boat = useRef<THREE.Group>(null);
  const mailFlag = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (boat.current) {
      boat.current.position.y = -0.35 + Math.sin(t * 1.5) * 0.08;
      boat.current.rotation.z = Math.sin(t * 1.2) * 0.06;
    }
    if (mailFlag.current) {
      const up = useGame.getState().zone === "contact";
      mailFlag.current.rotation.z = THREE.MathUtils.damp(mailFlag.current.rotation.z, up ? 0 : -Math.PI / 2, 6, 1 / 60);
    }
  });
  return (
    <Site id="contact">
      {/* planks out over the water */}
      {Array.from({ length: 9 }, (_, i) => (
        <Part key={i} color={i % 2 ? PALETTE.wood : "#d9822f"} position={[0, -0.05, 0.8 - i * 0.62]}>
          <boxGeometry args={[1.8, 0.14, 0.56]} />
        </Part>
      ))}
      {[-1.2, -2.8, -4.2].map((z) =>
        [-0.95, 0.95].map((x) => (
          <Part key={`${x}${z}`} color="#a0663a" position={[x, -0.3, z]}>
            <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
          </Part>
        ))
      )}
      {/* mailbox */}
      <Part color={PALETTE.wood} position={[-1.2, 0.5, 0.9]}>
        <boxGeometry args={[0.12, 1, 0.12]} />
      </Part>
      <Part color={PALETTE.coral} position={[-1.2, 1.15, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.24, 0.4, 4, 12]} />
      </Part>
      <group position={[-0.95, 1.15, 1.0]}>
        <mesh ref={mailFlag} position={[0, 0, 0]} material={toon(PALETTE.yellow)}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
        </mesh>
      </group>
      {/* boat */}
      <group ref={boat} position={[2.2, -0.35, -3.2]}>
        <Part color={PALETTE.white} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.8, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </Part>
        <Part color={PALETTE.wood} position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
        </Part>
        <mesh position={[0.32, 0.9, 0]} material={toon(PALETTE.coral)}>
          <coneGeometry args={[0.6, 1.1, 3]} />
        </mesh>
      </group>
    </Site>
  );
}
