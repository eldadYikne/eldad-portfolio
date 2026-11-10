import type { BossId } from "../world";

export type WeaponId = "fists" | "sword" | "pistol" | "shotgun" | "laser" | "rocket";

export type Weapon = {
  id: WeaponId;
  name: string;
  icon: string;
  /** seconds between attacks */
  cooldown: number;
  damage: number;
  range: number;
  kind: "melee" | "bullet" | "spread" | "beam" | "rocket";
  pellets?: number;
  speed?: number;
  pierce?: boolean;
  blast?: number;
  color: string;
};

export const WEAPONS: Record<WeaponId, Weapon> = {
  fists: { id: "fists", name: "Bare Hands", icon: "👊", cooldown: 0.5, damage: 14, range: 1.7, kind: "melee", color: "#ffffff" },
  sword: { id: "sword", name: "Refactor Blade", icon: "🗡️", cooldown: 0.45, damage: 36, range: 2.4, kind: "melee", color: "#7ef9ff" },
  pistol: { id: "pistol", name: "Ping Pistol", icon: "🔫", cooldown: 0.32, damage: 24, range: 10, kind: "bullet", speed: 24, color: "#ffd23f" },
  shotgun: { id: "shotgun", name: "Merge Shotgun", icon: "💥", cooldown: 0.75, damage: 14, range: 7.5, kind: "spread", pellets: 6, speed: 20, color: "#ff6fb5" },
  laser: { id: "laser", name: "Lint Laser", icon: "⚡", cooldown: 0.1, damage: 11, range: 12, kind: "beam", speed: 40, pierce: true, color: "#a66cff" },
  rocket: { id: "rocket", name: "Deploy Rocket", icon: "🚀", cooldown: 0.95, damage: 60, range: 12, kind: "rocket", speed: 15, blast: 3, color: "#ff6b5e" },
};

/** The weapon crate that drops at the start of each wave (index = wave - 1). */
export const WAVE_WEAPONS: WeaponId[] = ["sword", "pistol", "shotgun", "laser", "rocket"];

export type Boss = {
  id: BossId;
  name: string;
  title: string;
  icon: string;
  color: string;
  /** 0 easiest … 2 hardest */
  tier: number;
  speedFactor: number;
  blurb: string;
};

export const BOSSES: Record<BossId, Boss> = {
  critter: {
    id: "critter",
    name: "Pixel Critters",
    title: "The Swarm",
    icon: "👾",
    color: "#d97757",
    tier: 0,
    speedFactor: 1.15,
    blurb: "Tiny, fast, and there are a LOT of them.",
  },
  octo: {
    id: "octo",
    name: "Octo-Kittens",
    title: "The Ink Pack",
    icon: "🐙",
    color: "#2b2d55",
    tier: 1,
    speedFactor: 0.85,
    blurb: "Tanky tentacles. From wave 3 they spit ink.",
  },
  knot: {
    id: "knot",
    name: "Knot Spirits",
    title: "The Spinning Six",
    icon: "🌀",
    color: "#1f1f24",
    tier: 2,
    speedFactor: 1.3,
    blurb: "Spin fast, dash faster. The hardest mission.",
  },
};

export const WAVES = 5;
export const PLAYER_MAX_HP = 100;

/** Everything that scales with wave number and boss tier. */
export function waveStats(boss: Boss, wave: number) {
  const m = 1 + boss.tier * 0.35;
  return {
    count: Math.round((6 + wave * 4) * (1 + boss.tier * 0.25)),
    hp: (34 + wave * 16) * m,
    speed: (2.9 + wave * 0.45) * boss.speedFactor,
    damage: (7 + wave * 1.8) * m,
    spawnEvery: Math.max(0.35, 1.1 - wave * 0.12 - boss.tier * 0.1),
    /** monsters arrive in packs from one direction */
    pack: 1 + Math.floor(wave / 2),
    /** Octo-kittens start spitting ink from wave 3 */
    ranged: boss.id === "octo" && wave >= 3,
    /** Knot spirits dash from wave 2 */
    dash: boss.id === "knot" && wave >= 2,
    bossHp: 650 * m,
  };
}
