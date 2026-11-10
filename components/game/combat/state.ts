import { create } from "zustand";
import type { BossId } from "../world";
import { PLAYER_MAX_HP, type WeaponId } from "./defs";

export type Phase = "intro" | "fight" | "clear" | "victory" | "defeat";

export type Mission = {
  boss: BossId;
  wave: number;
  phase: Phase;
  /** enemies still to defeat this wave (spawned + queued) */
  left: number;
  total: number;
  /** 0..1 while the boss itself is fighting (wave 5) */
  bossHp: number | null;
  /** bumps every time a banner should replay */
  bannerAt: number;
};

type CombatUI = {
  nearNest: BossId | null;
  mission: Mission | null;
  hp: number;
  weapon: WeaponId;
  weaponAt: number;
  defeated: BossId[];
  hurtAt: number;
  setNear: (n: BossId | null) => void;
  start: (boss: BossId) => void;
  leave: () => void;
  patch: (m: Partial<Mission>) => void;
  setHp: (hp: number, hurt?: boolean) => void;
  setWeapon: (w: WeaponId) => void;
  win: () => void;
};

export const useCombat = create<CombatUI>((set, get) => ({
  nearNest: null,
  mission: null,
  hp: PLAYER_MAX_HP,
  weapon: "fists",
  weaponAt: 0,
  defeated: [],
  hurtAt: 0,
  setNear: (nearNest) => get().nearNest !== nearNest && set({ nearNest }),
  start: (boss) => {
    resetSim();
    set({
      mission: { boss, wave: 1, phase: "intro", left: 0, total: 0, bossHp: null, bannerAt: performance.now() },
      hp: PLAYER_MAX_HP,
      weapon: "fists",
    });
  },
  leave: () => {
    resetSim();
    set({ mission: null, hp: PLAYER_MAX_HP, weapon: "fists" });
  },
  patch: (m) => set((s) => (s.mission ? { mission: { ...s.mission, ...m } } : {})),
  setHp: (hp, hurt) => set({ hp, ...(hurt ? { hurtAt: performance.now() } : {}) }),
  setWeapon: (weapon) => set({ weapon, weaponAt: performance.now() }),
  win: () =>
    set((s) => ({
      defeated: s.mission && !s.defeated.includes(s.mission.boss) ? [...s.defeated, s.mission.boss] : s.defeated,
    })),
}));

/* ------------------------------------------------------------------ *
 * Simulation state: mutated every frame by <Combat/>, never rendered  *
 * through React.                                                       *
 * ------------------------------------------------------------------ */

export type Enemy = {
  active: boolean;
  boss: boolean;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  r: number;
  heading: number;
  /** seconds since spawn (rise-from-ground animation) */
  age: number;
  /** >0 while flashing white after a hit */
  flash: number;
  /** >0 while playing the death animation */
  dying: number;
  hitCd: number;
  shootT: number;
  kx: number;
  kz: number;
};

export type Shot = {
  active: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  damage: number;
  pierce: boolean;
  blast: number;
  hit: Set<number>;
};

export type Pickup = { active: boolean; kind: "weapon" | "heart"; weapon?: WeaponId; x: number; z: number; t: number };
export type Fx = { active: boolean; x: number; z: number; t: number; r: number; color: string };

const make = <T>(n: number, f: () => T) => Array.from({ length: n }, f);

export const ENEMY_POOL = 44;

export const sim = {
  enemies: make<Enemy>(ENEMY_POOL, () => ({
    active: false, boss: false, x: 0, z: 0, hp: 0, maxHp: 0, speed: 0, damage: 0, r: 0.5, heading: 0,
    age: 0, flash: 0, dying: 0, hitCd: 0, shootT: 0, kx: 0, kz: 0,
  })),
  shots: make<Shot>(120, () => ({ active: false, x: 0, z: 0, vx: 0, vz: 0, life: 0, damage: 0, pierce: false, blast: 0, hit: new Set() })),
  pickups: make<Pickup>(8, () => ({ active: false, kind: "heart", x: 0, z: 0, t: 0 })),
  blasts: make<Fx>(10, () => ({ active: false, x: 0, z: 0, t: 0, r: 1, color: "#fff" })),
  bursts: make<Fx>(16, () => ({ active: false, x: 0, z: 0, t: 0, r: 1, color: "#fff" })),
  slash: { t: 1, heading: 0, r: 2 },
  attackCd: 0,
  recoil: 0,
  invuln: 0,
  hp: 100,
  phaseT: 0,
  spawnLeft: 0,
  spawnTimer: 0,
  /** world position of the boss while it fights in wave 5 */
  bossSlot: -1,
};

export function resetSim() {
  sim.enemies.forEach((e) => (e.active = false));
  sim.shots.forEach((s) => (s.active = false));
  sim.pickups.forEach((p) => (p.active = false));
  sim.blasts.forEach((b) => (b.active = false));
  sim.bursts.forEach((b) => (b.active = false));
  sim.slash.t = 1;
  sim.attackCd = 0;
  sim.recoil = 0;
  sim.invuln = 0;
  sim.hp = 100;
  sim.phaseT = 0;
  sim.spawnLeft = 0;
  sim.spawnTimer = 0;
  sim.bossSlot = -1;
}
