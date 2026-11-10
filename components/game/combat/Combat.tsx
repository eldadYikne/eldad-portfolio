"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { COLLIDERS, NESTS, insideIsland, nestById, type BossId, type Nest } from "../world";
import { input, isTyping, player } from "../store";
import { sfx } from "../audio";
import { toon } from "../toon";
import { BOSSES, PLAYER_MAX_HP, WAVES, WAVE_WEAPONS, WEAPONS, waveStats } from "./defs";
import { ENEMY_POOL, sim, useCombat, type Enemy, type Shot } from "./state";
import { Monster, animateMonster, flashMonster, newParts } from "./Monsters";

const ENEMY_SCALE = 0.62;
const BOSS_SCALE = 2.4;
const tmp = new THREE.Object3D();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
/** Unit-length strip starting at the origin and pointing along +y. */
const AIM_STRIP = new THREE.PlaneGeometry(0.35, 1).translate(0, 0.5, 0);

/** Open ground: on the island and clear of buildings, trees and rocks. */
function isOpen(x: number, z: number, pad: number) {
  if (!insideIsland(x, z, 1.5)) return false;
  return !COLLIDERS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + pad);
}

/* ================================================================== *
 *  Simulation helpers                                                 *
 * ================================================================== */

function free<T extends { active: boolean }>(list: T[]) {
  return list.find((x) => !x.active);
}

function spawnPoint(minR: number, maxR: number, pad = 0.8): [number, number] {
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = minR + Math.random() * (maxR - minR);
    const x = player.x + Math.cos(a) * r;
    const z = player.z + Math.sin(a) * r;
    if (isOpen(x, z, pad)) return [x, z];
  }
  // Fallback: back toward the centre of the island, which is always open.
  return [player.x * 0.5, player.z * 0.5];
}

function spawnEnemy(stats: ReturnType<typeof waveStats>, at?: [number, number]) {
  const e = free(sim.enemies);
  if (!e) return null;
  const [x, z] = at ?? spawnPoint(9, 12);
  Object.assign(e, {
    active: true, boss: false, x, z, hp: stats.hp, maxHp: stats.hp, speed: stats.speed * (0.85 + Math.random() * 0.3),
    damage: stats.damage, r: 0.5, heading: 0, age: 0, flash: 0, dying: 0, hitCd: 0,
    shootT: 1 + Math.random() * 2, kx: 0, kz: 0,
  } satisfies Partial<Enemy>);
  return e;
}

function burst(x: number, z: number, color: string, r = 1) {
  const b = free(sim.bursts);
  if (b) Object.assign(b, { active: true, x, z, t: 0, r, color });
}

function fireShot(list: Shot[], x: number, z: number, heading: number, speed: number, range: number, damage: number, pierce = false, blast = 0) {
  const s = free(list);
  if (!s) return;
  s.active = true;
  s.x = x;
  s.z = z;
  s.vx = Math.sin(heading) * speed;
  s.vz = Math.cos(heading) * speed;
  s.life = range / speed;
  s.damage = damage;
  s.pierce = pierce;
  s.blast = blast;
  s.hit.clear();
}

function damageEnemy(i: number, dmg: number, fromX: number, fromZ: number) {
  const e = sim.enemies[i];
  if (!e.active || e.dying > 0) return;
  e.hp -= dmg;
  e.flash = 1;
  sfx("hit");
  const dx = e.x - fromX;
  const dz = e.z - fromZ;
  const d = Math.hypot(dx, dz) || 1;
  const k = e.boss ? 1.5 : 7;
  e.kx += (dx / d) * k;
  e.kz += (dz / d) * k;
  if (e.boss) useCombat.getState().patch({ bossHp: Math.max(0, e.hp / e.maxHp) });
  if (e.hp <= 0) {
    e.dying = 0.0001;
    sfx(e.boss ? "boss_die" : "pop");
    const mission = useCombat.getState().mission;
    burst(e.x, e.z, mission ? BOSSES[mission.boss].color : "#fff", e.boss ? 3 : 1);
    if (!e.boss && Math.random() < 0.1) {
      const p = free(sim.pickups);
      if (p) Object.assign(p, { active: true, kind: "heart", x: e.x, z: e.z, t: 0 });
    }
  }
}

function explode(x: number, z: number, r: number, dmg: number) {
  const b = free(sim.blasts);
  if (b) Object.assign(b, { active: true, x, z, t: 0, r, color: "#ffb347" });
  sfx("boom");
  sim.enemies.forEach((e, i) => {
    if (e.active && Math.hypot(e.x - x, e.z - z) < r + e.r) damageEnemy(i, dmg, x, z);
  });
}

function hurtPlayer(dmg: number, fromX: number, fromZ: number) {
  if (sim.invuln > 0) return;
  const st = useCombat.getState();
  if (!st.mission || st.mission.phase !== "fight") return;
  sim.hp = Math.max(0, sim.hp - dmg);
  sim.invuln = 0.5;
  sfx("hurt");
  const dx = player.x - fromX;
  const dz = player.z - fromZ;
  const d = Math.hypot(dx, dz) || 1;
  const nx = player.x + (dx / d) * 0.9;
  const nz = player.z + (dz / d) * 0.9;
  if (insideIsland(nx, nz, 1.2)) {
    player.x = nx;
    player.z = nz;
  }
  st.setHp(sim.hp, true);
  if (sim.hp <= 0) st.patch({ phase: "defeat", bannerAt: performance.now() });
}

function startWave(wave: number) {
  const st = useCombat.getState();
  const m = st.mission!;
  const boss = BOSSES[m.boss];
  const ws = waveStats(boss, wave);
  sim.phaseT = 0;
  sim.spawnLeft = ws.count;
  sim.spawnTimer = 1.2;
  if (wave > 1) {
    sim.hp = Math.min(PLAYER_MAX_HP, sim.hp + 40);
    st.setHp(sim.hp);
  }
  // A new weapon crate drops somewhere nearby: go grab it.
  const p = free(sim.pickups);
  if (p) {
    const [x, z] = spawnPoint(3, 5, 1.4);
    Object.assign(p, { active: true, kind: "weapon", weapon: WAVE_WEAPONS[wave - 1], x, z, t: 0 });
  }
  let total = ws.count;
  if (wave === WAVES) {
    // The big one wakes up and joins the fight.
    const n = nestById[m.boss];
    const e = spawnEnemy(ws, n.pos);
    if (e) {
      Object.assign(e, { boss: true, hp: ws.bossHp, maxHp: ws.bossHp, speed: ws.speed * 0.72, damage: ws.damage * 1.8, r: 1.3, age: 0.5 });
      sim.bossSlot = sim.enemies.indexOf(e);
      total += 1;
    }
  }
  st.patch({ wave, phase: "fight", total, left: total, bossHp: wave === WAVES ? 1 : null, bannerAt: performance.now() });
}

/* ================================================================== *
 *  Scene component                                                    *
 * ================================================================== */

export function Combat() {
  const mission = useCombat((s) => s.mission);
  const kind = mission?.boss;
  const { camera, raycaster, gl } = useThree();

  // Hold the mouse button to fire. Only presses on the canvas count,
  // so clicking HUD buttons never shoots.
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (e.button === 0 && e.pointerType === "mouse") input.firing = true;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType === "mouse") input.firing = false;
    };
    const blur = () => (input.firing = false);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("blur", blur);
    };
  }, [gl]);

  useFrame((state, dt) => {
    dt = Math.min(dt, 1 / 30);
    const st = useCombat.getState();
    const m = st.mission;

    if (!m) {
      const near = NESTS.find((n) => Math.hypot(player.x - n.ring[0], player.z - n.ring[1]) < n.ringR);
      st.setNear(near ? near.id : null);
      return;
    }
    if (st.nearNest) st.setNear(null);

    const boss = BOSSES[m.boss];
    const ws = waveStats(boss, m.wave);
    sim.phaseT += dt;
    sim.invuln = Math.max(0, sim.invuln - dt);
    sim.recoil = Math.max(0, sim.recoil - dt * 6);
    sim.slash.t = Math.min(1, sim.slash.t + dt * 4.5);

    /* ---- phase machine ---- */
    if (m.phase === "intro" && sim.phaseT > 1.8) startWave(1);
    if (m.phase === "clear" && sim.phaseT > 2.6) {
      if (m.wave >= WAVES) {
        st.patch({ phase: "victory", bannerAt: performance.now() });
        st.win();
      } else startWave(m.wave + 1);
    }
    const fighting = m.phase === "fight";

    /* ---- spawning ---- */
    if (fighting && sim.spawnLeft > 0) {
      sim.spawnTimer -= dt;
      if (sim.spawnTimer <= 0) {
        // A pack charges in together from one side.
        const [cx, cz] = spawnPoint(7.5, 10);
        for (let k = 0; k < ws.pack && sim.spawnLeft > 0; k++) {
          const a = Math.random() * Math.PI * 2;
          if (!spawnEnemy(ws, [cx + Math.cos(a) * 0.9, cz + Math.sin(a) * 0.9])) break;
          sim.spawnLeft--;
        }
        sim.spawnTimer = ws.spawnEvery * ws.pack;
      }
    }

    /* ---- player aim (mouse / aim stick) & attack ---- */
    const weapon = WEAPONS[st.weapon];
    sim.attackCd -= dt;
    if (input.aimStick.active && Math.hypot(input.aimStick.x, input.aimStick.y) > 0.25) {
      player.aimHeading = Math.atan2(input.aimStick.x, input.aimStick.y);
    } else {
      raycaster.setFromCamera(state.pointer, camera);
      if (raycaster.ray.intersectPlane(ground, hitPoint)) {
        input.aim.x = hitPoint.x;
        input.aim.z = hitPoint.z;
        input.aim.valid = true;
        player.aimHeading = Math.atan2(hitPoint.x - player.x, hitPoint.z - player.z);
      }
    }
    player.aimT = 0.2; // in a mission the avatar always faces the crosshair
    if (fighting && input.firing && sim.attackCd <= 0) {
      const aim = player.aimHeading;
      sim.attackCd = weapon.cooldown;
      sim.recoil = 1;
      sfx(`shoot_${weapon.id}`);
      const hx = player.x + Math.sin(aim) * 0.6;
      const hz = player.z + Math.cos(aim) * 0.6;
      if (weapon.kind === "melee") {
        sim.slash.t = 0;
        sim.slash.heading = aim;
        sim.slash.r = weapon.range;
        sim.enemies.forEach((e, i) => {
          if (!e.active || e.dying > 0) return;
          const dx = e.x - player.x;
          const dz = e.z - player.z;
          const d = Math.hypot(dx, dz);
          let diff = Math.atan2(dx, dz) - aim;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          if (d < weapon.range + e.r && Math.abs(diff) < 1.1) damageEnemy(i, weapon.damage, player.x, player.z);
        });
      } else if (weapon.kind === "spread") {
        const n = weapon.pellets ?? 5;
        for (let p = 0; p < n; p++) fireShot(sim.shots, hx, hz, aim + (p / (n - 1) - 0.5) * 0.7, weapon.speed!, weapon.range, weapon.damage);
      } else {
        fireShot(sim.shots, hx, hz, aim, weapon.speed!, weapon.range, weapon.damage, !!weapon.pierce, weapon.blast ?? 0);
      }
    }

    /* ---- player shots ---- */
    for (const s of sim.shots) {
      if (!s.active) continue;
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      s.life -= dt;
      for (let i = 0; i < ENEMY_POOL && s.active; i++) {
        const e = sim.enemies[i];
        if (!e.active || e.dying > 0 || s.hit.has(i)) continue;
        if (Math.hypot(e.x - s.x, e.z - s.z) < e.r + 0.3) {
          if (s.blast > 0) {
            explode(s.x, s.z, s.blast, s.damage);
            s.active = false;
          } else {
            damageEnemy(i, s.damage, s.x - s.vx * 0.05, s.z - s.vz * 0.05);
            if (s.pierce) s.hit.add(i);
            else s.active = false;
          }
        }
      }
      if (s.active && s.life <= 0) {
        if (s.blast > 0) explode(s.x, s.z, s.blast, s.damage);
        s.active = false;
      }
    }

    /* ---- enemies ---- */
    let alive = 0;
    sim.enemies.forEach((e, i) => {
      if (!e.active) return;
      if (e.dying > 0) {
        e.dying += dt;
        if (e.dying > 0.35) {
          e.active = false;
          if (e.boss) sim.bossSlot = -1;
        }
        return;
      }
      alive++;
      e.age += dt;
      e.flash = Math.max(0, e.flash - dt * 6);
      e.hitCd -= dt;
      e.kx *= 1 - Math.min(1, dt * 8);
      e.kz *= 1 - Math.min(1, dt * 8);
      if (e.age < 0.45 || !fighting) return;

      const dx = player.x - e.x;
      const dz = player.z - e.z;
      const d = Math.hypot(dx, dz) || 1;
      e.heading = Math.atan2(dx, dz);

      // The critter boss keeps calling for backup.
      if (e.boss) {
        e.shootT -= dt;
        if (e.shootT <= 0) {
          for (let k = 0; k < 2; k++) {
            const a = Math.random() * Math.PI * 2;
            spawnEnemy(ws, [e.x + Math.cos(a) * 1.8, e.z + Math.sin(a) * 1.8]);
          }
          e.shootT = 4;
        }
      }

      e.x += ((dx / d) * e.speed + e.kx) * dt;
      e.z += ((dz / d) * e.speed + e.kz) * dt;

      // Jumping clears small monsters (not the boss).
      if (d < e.r + 0.45 && e.hitCd <= 0 && (e.boss || player.y < 0.7)) {
        hurtPlayer(e.damage, e.x, e.z);
        e.hitCd = 0.8;
      }
    });

    // Keep the horde from stacking into one blob.
    for (let i = 0; i < ENEMY_POOL; i++) {
      const a = sim.enemies[i];
      if (!a.active || a.dying > 0) continue;
      for (let j = i + 1; j < ENEMY_POOL; j++) {
        const b = sim.enemies[j];
        if (!b.active || b.dying > 0) continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d = Math.hypot(dx, dz);
        const min = a.r + b.r;
        if (d < min && d > 1e-4) {
          const push = (min - d) / 2;
          const wa = a.boss ? 0.1 : 1;
          const wb = b.boss ? 0.1 : 1;
          a.x -= (dx / d) * push * wa;
          a.z -= (dz / d) * push * wa;
          b.x += (dx / d) * push * wb;
          b.z += (dz / d) * push * wb;
        }
      }
    }

    /* ---- pickups ---- */
    for (const p of sim.pickups) {
      if (!p.active) continue;
      p.t += dt;
      if (Math.hypot(player.x - p.x, player.z - p.z) < 1.7) {
        p.active = false;
        if (p.kind === "weapon" && p.weapon) {
          st.setWeapon(p.weapon);
          sfx("pickup");
        } else {
          sfx("heal");
          sim.hp = Math.min(PLAYER_MAX_HP, sim.hp + 25);
          st.setHp(sim.hp);
        }
        burst(p.x, p.z, p.kind === "weapon" ? WEAPONS[p.weapon!].color : "#ff4d6d", 0.8);
      }
    }

    /* ---- effects ---- */
    for (const b of sim.blasts) if (b.active && (b.t += dt * 2.6) >= 1) b.active = false;
    for (const b of sim.bursts) if (b.active && (b.t += dt * 2.2) >= 1) b.active = false;

    /* ---- wave bookkeeping ---- */
    if (fighting) {
      const left = alive + sim.spawnLeft;
      if (left !== m.left) st.patch({ left });
      if (left === 0 && sim.phaseT > 1) {
        sim.phaseT = 0;
        st.patch({ phase: "clear", bannerAt: performance.now() });
      }
    }
    void state;
  });

  return (
    <>
      {NESTS.map((n) => (
        <NestMonster key={n.id} nest={n} />
      ))}
      {kind && <EnemyPool key={kind} kind={kind} />}
      <Shots />
      <Pickups />
      <Effects />
    </>
  );
}

/* ================================================================== *
 *  Visuals                                                            *
 * ================================================================== */

/** The big monster guarding each nest. In wave 5 it leaves the nest and fights. */
function NestMonster({ nest }: { nest: Nest }) {
  const parts = useMemo(newParts, []);
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const defeated = useCombat((s) => s.defeated.includes(nest.id));
  const mission = useCombat((s) => s.mission);
  const boss = BOSSES[nest.id];
  const homeYaw = Math.atan2(nest.ring[0] - nest.pos[0], nest.ring[1] - nest.pos[1]);
  const inMission = mission?.boss === nest.id;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const fighting = inMission && sim.bossSlot >= 0;
    if (fighting) {
      const e = sim.enemies[sim.bossSlot];
      g.position.set(e.x, 0, e.z);
      g.rotation.set(0, e.heading, 0);
      const s = e.dying > 0 ? BOSS_SCALE * (1 - e.dying / 0.35) : BOSS_SCALE;
      g.scale.setScalar(Math.max(0.01, s));
      animateMonster(nest.id, parts, t, 1);
      flashMonster(parts, e.flash);
    } else {
      g.position.set(nest.pos[0], 0, nest.pos[1]);
      if (defeated) {
        // Knocked out: tipped over, smaller, slowly breathing.
        g.rotation.set(0, homeYaw, Math.PI / 2.2);
        g.scale.setScalar(BOSS_SCALE * 0.7 * (1 + Math.sin(t * 1.5) * 0.02));
      } else {
        g.rotation.set(0, homeYaw + Math.sin(t * 0.7) * 0.25, 0);
        const roar = inMission && mission?.phase === "intro" ? 1 + Math.sin(t * 30) * 0.06 : 1;
        g.scale.setScalar(BOSS_SCALE * roar);
        animateMonster(nest.id, parts, t, inMission ? 1 : 0.25);
      }
      flashMonster(parts, 0);
    }
    if (ring.current) {
      ring.current.visible = !inMission;
      ring.current.rotation.z += dt * 0.6;
    }
  });

  return (
    <>
      <group ref={group}>
        <Monster kind={nest.id} parts={parts} outline />
      </group>
      {/* nest: scorched ground + start ring */}
      <mesh position={[nest.pos[0], 0.03, nest.pos[1]]} rotation-x={-Math.PI / 2} material={toon("#8f6a4a")}>
        <circleGeometry args={[2.6, 28]} />
      </mesh>
      <group position={[nest.ring[0], 0.05, nest.ring[1]]} rotation-x={-Math.PI / 2}>
        <mesh>
          <circleGeometry args={[nest.ringR, 32]} />
          <meshBasicMaterial color={defeated ? "#22c55e" : "#ef4444"} transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <group ref={ring}>
          <mesh>
            <ringGeometry args={[nest.ringR - 0.16, nest.ringR, 40, 1, 0, Math.PI * 1.6]} />
            <meshBasicMaterial color={defeated ? "#22c55e" : "#ef4444"} transparent opacity={0.95} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {!inMission && (
        <Html position={[nest.pos[0], 5.4, nest.pos[1]]} center zIndexRange={[15, 5]} pointerEvents="none">
          <div className={`boss-tag ${defeated ? "done" : ""}`} style={{ ["--c" as string]: boss.color }}>
            {defeated ? "🏆" : <span className="boss-bang">!</span>}
            {boss.name}
          </div>
        </Html>
      )}
    </>
  );
}

function EnemyPool({ kind }: { kind: BossId }) {
  return (
    <>
      {Array.from({ length: ENEMY_POOL }, (_, i) => (
        <EnemySlot key={i} i={i} kind={kind} />
      ))}
    </>
  );
}

function EnemySlot({ i, kind }: { i: number; kind: BossId }) {
  const parts = useMemo(newParts, []);
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    const e = sim.enemies[i];
    if (!g) return;
    if (!e.active || e.boss) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const rise = e.age < 0.45 ? -1.2 * (1 - e.age / 0.45) : 0;
    g.position.set(e.x, rise, e.z);
    g.rotation.y = e.heading;
    const s = e.dying > 0 ? ENEMY_SCALE * (1 + e.dying * 2) * (1 - e.dying / 0.35) : ENEMY_SCALE;
    g.scale.setScalar(Math.max(0.01, s));
    animateMonster(kind, parts, state.clock.elapsedTime + i * 0.37, 1);
    flashMonster(parts, e.dying > 0 ? 1 : e.flash);
  });
  return (
    <group ref={group} visible={false}>
      <Monster kind={kind} parts={parts} />
    </group>
  );
}

/** Player projectiles: one instanced mesh, one draw call. */
function Shots() {
  const bullets = useRef<THREE.InstancedMesh>(null);
  const bulletMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd23f" }), []);
  useFrame((state) => {
    const w = WEAPONS[useCombat.getState().weapon];
    bulletMat.color.set(w.color);
    const write = (mesh: THREE.InstancedMesh | null, list: Shot[], size: number, y: number) => {
      if (!mesh) return;
      list.forEach((s, i) => {
        tmp.position.set(s.x, y, s.z);
        const stretch = s.pierce ? 3 : 1;
        tmp.scale.set(s.active ? size : 0, s.active ? size : 0, s.active ? size * stretch : 0);
        tmp.rotation.set(0, Math.atan2(s.vx, s.vz), 0);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    write(bullets.current, sim.shots, w.kind === "rocket" ? 2.2 : 1, 0.95);
  });
  return (
    <>
      <instancedMesh ref={bullets} args={[undefined, bulletMat, sim.shots.length]} frustumCulled={false}>
        <sphereGeometry args={[0.13, 8, 8]} />
      </instancedMesh>
    </>
  );
}

/** Weapon crates (with a light beam) and health hearts. */
function Pickups() {
  return (
    <>
      {sim.pickups.map((_, i) => (
        <PickupSlot key={i} i={i} />
      ))}
    </>
  );
}

function PickupSlot({ i }: { i: number }) {
  const group = useRef<THREE.Group>(null);
  const crate = useRef<THREE.Group>(null);
  const heart = useRef<THREE.Group>(null);
  const label = useRef<HTMLDivElement>(null);
  useFrame((state) => {
    const p = sim.pickups[i];
    const g = group.current;
    if (!g) return;
    g.visible = p.active;
    if (label.current) label.current.style.display = p.active && p.kind === "weapon" ? "flex" : "none";
    if (!p.active) return;
    const t = state.clock.elapsedTime;
    // Crates fall from the sky, then bob.
    const fall = Math.max(0, 1 - p.t / 0.6);
    g.position.set(p.x, fall * fall * 10 + Math.sin(t * 3) * 0.1, p.z);
    g.rotation.y = t * 1.5;
    if (crate.current) crate.current.visible = p.kind === "weapon";
    if (heart.current) heart.current.visible = p.kind === "heart";
    if (label.current && p.weapon) {
      const w = WEAPONS[p.weapon];
      label.current.textContent = `${w.icon} ${w.name}`;
    }
  });
  return (
    <group ref={group} visible={false}>
      <group ref={crate}>
        <mesh position={[0, 0.45, 0]} material={toon("#e9933f")} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} material={toon("#ffd23f")}>
          <boxGeometry args={[0.84, 0.16, 0.84]} />
        </mesh>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[0.35, 0.5, 6, 16, 1, true]} />
          <meshBasicMaterial color="#fff3a0" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 1.5, 0]} center zIndexRange={[25, 20]} pointerEvents="none">
          <div ref={label} className="pickup-tag" />
        </Html>
      </group>
      <group ref={heart} position={[0, 0.6, 0]} scale={0.8}>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} position={[x, 0.1, 0]} material={toon("#ff4d6d")}>
            <sphereGeometry args={[0.24, 12, 12]} />
          </mesh>
        ))}
        <mesh position={[0, -0.14, 0]} rotation={[0, 0, Math.PI]} material={toon("#ff4d6d")}>
          <coneGeometry args={[0.39, 0.5, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/** Sword slashes, rocket explosions and death pops. */
function Effects() {
  const aimLine = useRef<THREE.Mesh>(null);
  const aimArc = useRef<THREE.Mesh>(null);
  const reticle = useRef<THREE.Mesh>(null);
  const slash = useRef<THREE.Mesh>(null);
  const slashMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false, side: THREE.DoubleSide }), []);
  const blasts = useRef<(THREE.Mesh | null)[]>([]);
  const bursts = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    // Aim guide on the ground, like a mobile brawler: a strip for guns, an arc for melee.
    const st = useCombat.getState();
    const show = !!st.mission && (st.mission.phase === "fight" || st.mission.phase === "intro");
    const w = WEAPONS[st.weapon];
    const melee = w.kind === "melee";
    const firing = input.firing ? 1 : 0.6;
    if (aimLine.current) {
      aimLine.current.visible = show && !melee;
      aimLine.current.position.set(player.x, 0.06, player.z);
      aimLine.current.rotation.set(-Math.PI / 2, 0, player.aimHeading + Math.PI);
      aimLine.current.scale.set(w.kind === "spread" ? 2.4 : 1, w.range, 1);
      (aimLine.current.material as THREE.MeshBasicMaterial).opacity = 0.32 * firing;
    }
    if (aimArc.current) {
      aimArc.current.visible = show && melee;
      aimArc.current.position.set(player.x, 0.06, player.z);
      aimArc.current.rotation.set(-Math.PI / 2, 0, player.aimHeading - Math.PI / 2 - 1.1);
      aimArc.current.scale.setScalar(w.range);
      (aimArc.current.material as THREE.MeshBasicMaterial).opacity = 0.3 * firing;
    }
    if (reticle.current) {
      reticle.current.visible = show && input.aim.valid && !input.aimStick.active;
      reticle.current.position.set(input.aim.x, 0.07, input.aim.z);
      reticle.current.rotation.z = state.clock.elapsedTime * 2;
    }
    const s = slash.current;
    if (s) {
      const k = sim.slash.t;
      s.visible = k < 1;
      s.position.set(player.x, 0.9, player.z);
      s.rotation.set(-Math.PI / 2, 0, sim.slash.heading - Math.PI / 2 - 1.2 + k * 0.6);
      s.scale.setScalar(sim.slash.r * (0.7 + k * 0.4));
      slashMat.color.set(WEAPONS[useCombat.getState().weapon].color);
      slashMat.opacity = (1 - k) * 0.9;
    }
    const draw = (meshes: (THREE.Mesh | null)[], list: typeof sim.blasts, grow: number) =>
      list.forEach((b, i) => {
        const m = meshes[i];
        if (!m) return;
        m.visible = b.active;
        if (!b.active) return;
        m.position.set(b.x, 0.6, b.z);
        m.scale.setScalar(b.r * (0.3 + b.t * grow));
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.color.set(b.color);
        mat.opacity = 1 - b.t;
      });
    draw(blasts.current, sim.blasts, 1);
    draw(bursts.current, sim.bursts, 1.2);
  });

  return (
    <>
      {/* unit strip from the player forward (+y before the -90° X rotation) */}
      <mesh ref={aimLine} visible={false} geometry={AIM_STRIP}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh ref={aimArc} visible={false}>
        <ringGeometry args={[0.5, 1, 24, 1, 0, 2.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={reticle} visible={false} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.28, 0.4, 4, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh ref={slash} material={slashMat} visible={false}>
        <ringGeometry args={[0.45, 1, 24, 1, 0, 2.4]} />
      </mesh>
      {sim.blasts.map((_, i) => (
        <mesh key={`b${i}`} ref={(m) => void (blasts.current[i] = m)} visible={false}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
      {sim.bursts.map((_, i) => (
        <mesh key={`p${i}`} ref={(m) => void (bursts.current[i] = m)} visible={false}>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshBasicMaterial transparent depthWrite={false} wireframe />
        </mesh>
      ))}
    </>
  );
}
