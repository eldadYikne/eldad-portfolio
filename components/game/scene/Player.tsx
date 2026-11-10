"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Outlines } from "@react-three/drei";
import * as THREE from "three";
import { CITY_COLLIDERS, COLLIDERS, PALETTE, PLAYER_LEVEL, ZONES, walkable } from "../world";
import { toon, toon as toonMat } from "../toon";
import { input, player, useGame } from "../store";
import { sim, useCombat } from "../combat/state";
import type { WeaponId } from "../combat/defs";
import { sfx } from "../audio";

const SPEED = 6.5;
const SPRINT = 1.7;
const JUMP_V = 9.5;
const GRAVITY = 28;
const RADIUS = 0.45;
const CAM_OFFSET = new THREE.Vector3(0, 23, 17);

const COLLIDER_LISTS = [COLLIDERS, CITY_COLLIDERS];
const move = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const lookAt = new THREE.Vector3();
const INTRO_CAM = new THREE.Vector3(0, 46, 34);
const ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * The player: an original chunky avatar (big head, hoodie, laptop backpack)
 * with a procedural walk cycle, circle-vs-circle collisions, zone triggers
 * and a follow camera.
 */
export function Player() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);
  const phase = useRef(0);
  const intro = useRef(0);
  const landSquash = useRef(0);
  const sprintZoom = useRef(0);
  const landPuff = useRef(0);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    // Opening shot: the whole island from high above.
    camera.position.set(0, 46, 34);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((state, dt) => {
    dt = Math.min(dt, 1 / 30);
    const { started, start, enter } = useGame.getState();
    const t = state.clock.elapsedTime;

    /* ---- intro: swoop down, drop the player in ---- */
    if (!started) {
      intro.current = Math.min(1, intro.current + dt / 2.6);
      if (intro.current >= 1) start();
    }
    const e = 1 - Math.pow(1 - intro.current, 3);
    const drop = Math.max(0, 1 - Math.max(0, intro.current - 0.45) / 0.4); // 1 → 0
    const bounce = intro.current > 0.85 ? Math.sin((intro.current - 0.85) * 40) * (1 - intro.current) * 0.6 : 0;

    /* ---- input → desired direction ---- */
    move.set(0, 0, 0);
    if (started) {
      const k = input.keys;
      if (k.has("w") || k.has("arrowup")) move.z -= 1;
      if (k.has("s") || k.has("arrowdown")) move.z += 1;
      if (k.has("a") || k.has("arrowleft")) move.x -= 1;
      if (k.has("d") || k.has("arrowright")) move.x += 1;
      move.x += input.stick.x;
      move.z += input.stick.y;
      if (move.lengthSq() > 0.01) input.target = null;
      else if (input.target) {
        move.set(input.target.x - player.x, 0, input.target.z - player.z);
        if (move.length() < 0.25) {
          input.target = null;
          move.set(0, 0, 0);
        }
      }
    }
    const len = Math.min(1, move.length());
    player.moving = len > 0.05;
    const sprinting = input.sprint && player.moving;

    /* ---- jump ---- */
    const grounded = player.y <= 0.0001;
    if (input.jump) {
      input.jump = false;
      if (grounded && started) {
        player.vy = JUMP_V;
        sfx("jump");
      }
    }
    if (!grounded || player.vy > 0) {
      player.vy -= GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y <= 0) {
        player.y = 0;
        player.vy = 0;
        landSquash.current = 1;
        landPuff.current = performance.now();
        lastLanding = landPuff.current;
        sfx("land");
      }
    }
    landSquash.current = Math.max(0, landSquash.current - dt * 5);

    if (player.moving) {
      move.normalize().multiplyScalar(SPEED * (sprinting ? SPRINT : 1) * len * dt);
      let nx = player.x + move.x;
      let nz = player.z + move.z;
      // Push out of landmarks, trees and rocks.
      for (const list of COLLIDER_LISTS)
        for (const c of list) {
          const dx = nx - c.x;
          const dz = nz - c.z;
          const d = Math.hypot(dx, dz);
          const min = c.r + RADIUS;
          if (d < min && d > 1e-4) {
            nx = c.x + (dx / d) * min;
            nz = c.z + (dz / d) * min;
          }
        }
      // Stay on solid ground (the island or GitHub City).
      if (walkable(nx, nz)) {
        player.x = nx;
        player.z = nz;
      } else input.target = null;
    }
    // Face the attack target while shooting, otherwise the walking direction.
    player.aimT = Math.max(0, player.aimT - dt);
    if (player.aimT > 0 || player.moving) {
      const want = player.aimT > 0 ? player.aimHeading : Math.atan2(move.x, move.z);
      let diff = want - player.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      player.heading += diff * Math.min(1, dt * (player.aimT > 0 ? 20 : 14));
    }

    /* ---- zone triggers ---- */
    const inMission = !!useCombat.getState().mission;
    if (started && inMission) enter(null);
    else if (started) {
      let inside: (typeof ZONES)[number]["id"] | null = null;
      for (const z of ZONES) if (Math.hypot(player.x - z.ring[0], player.z - z.ring[1]) < z.ringR) inside = z.id;
      enter(inside);
    }

    /* ---- pose ---- */
    if (root.current) {
      root.current.position.set(player.x, drop * 14 + bounce + player.y, player.z);
      root.current.rotation.y = player.heading;
    }
    const speedK = player.moving ? 1 : 0;
    phase.current += dt * (player.moving ? (sprinting ? 19 : 13) : 2);
    const s = Math.sin(phase.current);
    const swing = s * 0.85 * speedK;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.9;
    if (armR.current) {
      const armed = useCombat.getState().weapon !== "fists" && inMission;
      if (inMission) {
        // Weapon raised forward, kicking back on every attack.
        armR.current.rotation.x = (armed ? -1.35 : -1.5 * sim.recoil) + sim.recoil * 0.35;
        armR.current.rotation.y = sim.slash.t < 1 ? 1.1 - sim.slash.t * 2.2 : 0;
      } else {
        armR.current.rotation.x = swing * 0.9;
        armR.current.rotation.y = 0;
      }
    }
    // In the air: tuck the legs, throw the free arm up.
    if (player.y > 0.05) {
      if (legL.current) legL.current.rotation.x = -0.7;
      if (legR.current) legR.current.rotation.x = 0.35;
      if (armL.current) armL.current.rotation.x = -2.4;
    }
    if (body.current && landSquash.current > 0) {
      const q = 1 - landSquash.current * 0.22;
      body.current.scale.set(1 / Math.sqrt(q), q, 1 / Math.sqrt(q));
    }
    // Lean further forward when sprinting.
    if (body.current && sprinting) body.current.rotation.x = 0.28;
    // Blink while invulnerable after taking a hit.
    if (body.current) body.current.visible = !(sim.invuln > 0 && Math.floor(t * 24) % 2 === 0);
    if (body.current) {
      const hop = player.moving ? Math.abs(Math.cos(phase.current)) * 0.12 : Math.sin(t * 2) * 0.02;
      body.current.position.y = hop;
      // Squash & stretch on landing and on each step.
      const sq = player.moving ? 1 + Math.cos(phase.current * 2) * 0.03 : 1;
      body.current.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      body.current.rotation.x = player.moving ? 0.12 : 0;
    }
    if (ring.current) {
      ring.current.position.set(player.x, 0.04, player.z);
      ring.current.rotation.z = t * 0.8;
      ring.current.visible = drop < 0.05;
    }
    if (marker.current) {
      marker.current.visible = !!input.target;
      if (input.target) {
        marker.current.position.set(input.target.x, 0.05, input.target.z);
        marker.current.scale.setScalar(0.8 + Math.sin(t * 8) * 0.12);
      }
    }

    /* ---- camera ---- */
    camTarget.set(player.x, 0, player.z).add(CAM_OFFSET);
    sprintZoom.current = THREE.MathUtils.damp(sprintZoom.current, sprinting ? 1 : 0, 3, dt);
    camTarget.y += sprintZoom.current * 2.5;
    camTarget.z += sprintZoom.current * 2;
    // Narrow / portrait screens: pull back so the island stays readable.
    const aspect = state.size.width / state.size.height;
    if (aspect < 1) {
      camTarget.y += (1 - aspect) * 14;
      camTarget.z += (1 - aspect) * 10;
    }
    if (!started) camTarget.lerpVectors(INTRO_CAM, camTarget, e);
    camera.position.lerp(camTarget, started ? 1 - Math.exp(-5 * dt) : 1);
    lookAt.set(player.x, 0.8, player.z - 1);
    if (!started) lookAt.lerpVectors(ORIGIN, lookAt, e);
    camera.lookAt(lookAt);
  });

  return (
    <>
      <group ref={root}>
        <group ref={body}>
          <Avatar legL={legL} legR={legR} armL={armL} armR={armR} />
        </group>
        <Html position={[0, 2.55, 0]} center zIndexRange={[20, 10]} pointerEvents="none">
          <div className="nameplate">
            <span className="nameplate-lvl">{PLAYER_LEVEL}</span>
            <span className="nameplate-name">Eldad</span>
          </div>
        </Html>
      </group>
      {/* team ring under the player */}
      <mesh ref={ring} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.62, 0.78, 32, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color="#41d1ff" transparent opacity={0.9} />
      </mesh>
      {/* click-to-move marker */}
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.3, 0.42, 24]} />
        <meshBasicMaterial color={PALETTE.white} transparent opacity={0.85} />
      </mesh>
      <Dust />
    </>
  );
}

type LimbRef = React.RefObject<THREE.Group | null> | undefined;

/** The avatar model. `holo` swaps every material (used by the AI digital twin). */
export function Avatar({
  legL,
  legR,
  armL,
  armR,
  holo,
  weapon = true,
}: {
  legL?: LimbRef;
  legR?: LimbRef;
  armL?: LimbRef;
  armR?: LimbRef;
  holo?: THREE.Material;
  weapon?: boolean;
}) {
  const toon: typeof toonMat = (c, o) => (holo as THREE.MeshToonMaterial) ?? toonMat(c, o);
  const ink = holo ? null : <Outlines thickness={0.03} color={PALETTE.outline} />;
  const skin = toon("#e0a27c");
  const hoodie = toon(PALETTE.coral);
  const pants = toon(PALETTE.navy);
  return (
    <group>
      {/* legs */}
      {[
        [legL, -0.17],
        [legR, 0.17],
      ].map(([ref, x], i) => (
        <group key={i} ref={ref as LimbRef} position={[x as number, 0.62, 0]}>
          <mesh position={[0, -0.27, 0]} material={pants} castShadow>
            <capsuleGeometry args={[0.13, 0.32, 4, 8]} />
            {ink}
          </mesh>
          <mesh position={[0, -0.55, 0.06]} material={toon(PALETTE.white)} castShadow>
            <boxGeometry args={[0.24, 0.14, 0.36]} />
            {ink}
          </mesh>
        </group>
      ))}
      {/* torso: hoodie */}
      <mesh position={[0, 0.98, 0]} material={hoodie} castShadow>
        <capsuleGeometry args={[0.36, 0.34, 6, 14]} />
        {ink}
      </mesh>
      <mesh position={[0, 0.9, 0.33]} material={toon("#e0574c")}>
        <boxGeometry args={[0.34, 0.16, 0.06]} />
      </mesh>
      {/* laptop backpack */}
      <mesh position={[0, 1.02, -0.38]} material={toon(PALETTE.navy)} castShadow>
        <boxGeometry args={[0.5, 0.56, 0.2]} />
        {ink}
      </mesh>
      <mesh position={[0, 1.08, -0.485]} material={toon("#41d1ff", { emissive: "#41d1ff", emissiveIntensity: 0.5 })}>
        <boxGeometry args={[0.16, 0.16, 0.02]} />
      </mesh>
      {/* arms */}
      {[
        [armL, -0.47],
        [armR, 0.47],
      ].map(([ref, x], i) => (
        <group key={i} ref={ref as LimbRef} position={[x as number, 1.2, 0]}>
          <mesh position={[0, -0.25, 0]} material={hoodie} castShadow>
            <capsuleGeometry args={[0.11, 0.3, 4, 8]} />
            {ink}
          </mesh>
          <mesh position={[0, -0.5, 0]} material={skin}>
            <sphereGeometry args={[0.11, 10, 10]} />
            {ink}
          </mesh>
          {i === 1 && weapon && <HeldWeapon />}
        </group>
      ))}
      {/* big head */}
      <group position={[0, 1.78, 0]}>
        <mesh material={skin} castShadow>
          <sphereGeometry args={[0.44, 24, 20]} />
          {ink}
        </mesh>
        {/* hair */}
        <mesh position={[0, 0.16, -0.04]} scale={[1.04, 0.72, 1.04]} material={toon("#2b1b14")}>
          <sphereGeometry args={[0.44, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* eyes */}
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.4]} material={toon(PALETTE.outline)}>
            <sphereGeometry args={[0.055, 10, 10]} />
          </mesh>
        ))}
        {/* glasses */}
        {[-0.15, 0.15].map((x) => (
          <mesh key={`g${x}`} position={[x, 0.02, 0.42]} material={toon(PALETTE.outline)}>
            <torusGeometry args={[0.11, 0.018, 6, 16]} />
          </mesh>
        ))}
        <mesh position={[0, 0.02, 0.43]} material={toon(PALETTE.outline)}>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
        </mesh>
        {/* smile */}
        <mesh position={[0, -0.16, 0.4]} rotation={[0, 0, Math.PI]} material={toon(PALETTE.outline)}>
          <torusGeometry args={[0.08, 0.016, 6, 12, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
}

/** The weapon in the right hand. The arm points down, so "forward" is -y. */
function HeldWeapon() {
  const weapon = useCombat((s) => s.weapon);
  const inMission = useCombat((s) => !!s.mission);
  if (!inMission || weapon === "fists") return null;
  return <group position={[0, -0.55, 0.05]}>{WEAPON_MODELS[weapon]}</group>;
}

const glow = (c: string) => toon(c, { emissive: c, emissiveIntensity: 0.7 });
const ink2 = <Outlines thickness={0.02} color={PALETTE.outline} />;
const WEAPON_MODELS: Record<Exclude<WeaponId, "fists">, React.ReactNode> = {
  sword: (
    <>
      <mesh position={[0, -0.08, 0]} material={toon(PALETTE.navy)}>
        <boxGeometry args={[0.32, 0.06, 0.08]} />
        {ink2}
      </mesh>
      <mesh position={[0, -0.6, 0]} material={glow("#7ef9ff")}>
        <boxGeometry args={[0.1, 0.95, 0.03]} />
        {ink2}
      </mesh>
    </>
  ),
  pistol: (
    <mesh position={[0, -0.22, 0]} material={toon(PALETTE.yellow)}>
      <boxGeometry args={[0.14, 0.42, 0.16]} />
      {ink2}
    </mesh>
  ),
  shotgun: (
    <>
      <mesh position={[0, -0.35, 0]} material={toon(PALETTE.pink)}>
        <boxGeometry args={[0.16, 0.7, 0.18]} />
        {ink2}
      </mesh>
      <mesh position={[0, -0.75, 0]} material={toon(PALETTE.navy)}>
        <cylinderGeometry args={[0.07, 0.07, 0.2, 8]} />
      </mesh>
    </>
  ),
  laser: (
    <>
      <mesh position={[0, -0.32, 0]} material={toon(PALETTE.purple)}>
        <cylinderGeometry args={[0.07, 0.1, 0.64, 10]} />
        {ink2}
      </mesh>
      <mesh position={[0, -0.68, 0]} material={glow("#e9d5ff")}>
        <sphereGeometry args={[0.09, 10, 10]} />
      </mesh>
    </>
  ),
  rocket: (
    <>
      <mesh position={[0, -0.3, 0]} material={toon(PALETTE.coral)}>
        <cylinderGeometry args={[0.13, 0.13, 0.9, 12]} />
        {ink2}
      </mesh>
      <mesh position={[0, -0.78, 0]} material={toon(PALETTE.yellow)}>
        <coneGeometry args={[0.13, 0.22, 12]} />
      </mesh>
    </>
  ),
};

/** Time of the last landing, shared between the player and its dust. */
let lastLanding = 0;
const lastLand = () => lastLanding;

/** Little dust puffs kicked up while running. */
function Dust() {
  const COUNT = 18;
  const ref = useRef<THREE.InstancedMesh>(null);
  const puffs = useMemo(() => Array.from({ length: COUNT }, () => ({ x: 0, z: 0, t: 1 })), []);
  const next = useRef(0);
  const timer = useRef(0);
  const landed = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    timer.current -= dt;
    if (player.moving && player.y < 0.05 && timer.current <= 0) {
      timer.current = input.sprint ? 0.05 : 0.09;
      const p = puffs[next.current++ % COUNT];
      p.x = player.x - Math.sin(player.heading) * 0.35 + (Math.random() - 0.5) * 0.3;
      p.z = player.z - Math.cos(player.heading) * 0.35 + (Math.random() - 0.5) * 0.3;
      p.t = 0;
    }
    // Landing: a ring of puffs around the feet.
    if (player.y === 0 && player.vy === 0 && landed.current !== lastLand()) {
      landed.current = lastLand();
      for (let k = 0; k < 6; k++) {
        const p = puffs[next.current++ % COUNT];
        const a = (k / 6) * Math.PI * 2;
        p.x = player.x + Math.cos(a) * 0.45;
        p.z = player.z + Math.sin(a) * 0.45;
        p.t = 0;
      }
    }
    puffs.forEach((p, i) => {
      p.t = Math.min(1, p.t + dt * 1.8);
      const s = p.t >= 1 ? 0 : (0.15 + p.t * 0.3) * (1 - p.t);
      dummy.position.set(p.x, 0.12 + p.t * 0.35, p.z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, toon("#fff4e0"), COUNT]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}
