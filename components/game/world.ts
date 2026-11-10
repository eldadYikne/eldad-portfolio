import { education, experience, profile, projects, skills } from "@/content/portfolio";

/* ------------------------------------------------------------------ *
 * Static world layout. Everything here is plain data, computed once,  *
 * shared by the 3D scene, the minimap and the movement code.          *
 * ------------------------------------------------------------------ */

/** Seeded RNG so the island looks identical on every visit. */
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Island coastline radius at angle θ (world x/z plane). */
export function islandRadius(theta: number) {
  return 25 + 2.4 * Math.sin(3 * theta + 1) + 1.4 * Math.sin(5 * theta + 2) + 0.7 * Math.sin(9 * theta + 0.5);
}

export function insideIsland(x: number, z: number, margin = 0) {
  return Math.hypot(x, z) < islandRadius(Math.atan2(z, x)) - margin;
}

export const PALETTE = {
  grass: "#6fd47a",
  grassDark: "#4fb563",
  sand: "#f7d9a0",
  cliff: "#c98a55",
  water: "#3fc5e8",
  waterDeep: "#2a8fd6",
  wood: "#e9933f",
  stone: "#d9d4e6",
  purple: "#a66cff",
  pink: "#ff6fb5",
  coral: "#ff6b5e",
  yellow: "#ffd23f",
  teal: "#2ec4b6",
  navy: "#2b2d55",
  white: "#fbfaff",
  outline: "#2a1f3d",
};

export type ZoneId =
  | "about"
  | "asadra"
  | "codere"
  | "gocode"
  | "giborim"
  | "logiki"
  | "motion"
  | "skills"
  | "education"
  | "contact";

export type Zone = {
  id: ZoneId;
  /** landmark centre */
  pos: [number, number];
  /** trigger circle the player steps into (usually in front of the landmark) */
  ring: [number, number];
  ringR: number;
  /** collision radius of the landmark itself */
  solidR: number;
  color: string;
  label: string;
  icon: string;
  kind: "about" | "experience" | "project" | "skills" | "education" | "contact";
};

export const ZONES: Zone[] = [
  { id: "about", pos: [0, -1.5], ring: [0, 1.6], ringR: 2.2, solidR: 1.1, color: PALETTE.yellow, label: "Spawn · About me", icon: "⭐", kind: "about" },
  { id: "asadra", pos: [-9, -15], ring: [-9, -11.2], ringR: 2.4, solidR: 2.4, color: "#22b8e8", label: "Asadra HQ", icon: "🚀", kind: "experience" },
  { id: "codere", pos: [0.5, -18], ring: [0.5, -14.2], ringR: 2.4, solidR: 2.6, color: PALETTE.purple, label: "Codere Online", icon: "🎲", kind: "experience" },
  { id: "gocode", pos: [10, -14.5], ring: [9, -10.8], ringR: 2.4, solidR: 2.4, color: PALETTE.pink, label: "Go-Code", icon: "⚙️", kind: "experience" },
  { id: "giborim", pos: [17.5, -2], ring: [13.6, -1.5], ringR: 2.4, solidR: 2.6, color: PALETTE.coral, label: "Bishvil Giborim", icon: "🏅", kind: "project" },
  { id: "logiki", pos: [16.5, 8.5], ring: [12.6, 7], ringR: 2.4, solidR: 2.6, color: PALETTE.wood, label: "Logiki", icon: "📦", kind: "project" },
  { id: "motion", pos: [8.5, 16], ring: [6.8, 12.4], ringR: 2.4, solidR: 2.4, color: PALETTE.teal, label: "Motion Lab", icon: "🎥", kind: "project" },
  { id: "skills", pos: [-16, 1.5], ring: [-11.8, 1.2], ringR: 2.6, solidR: 3.2, color: PALETTE.purple, label: "Skill Crystals", icon: "💎", kind: "skills" },
  { id: "education", pos: [-10.5, 14], ring: [-8, 10.6], ringR: 2.4, solidR: 2.6, color: "#5b8cff", label: "Academy", icon: "🎓", kind: "education" },
  { id: "contact", pos: [0, 22.5], ring: [0, 19.2], ringR: 2.3, solidR: 1.2, color: PALETTE.coral, label: "Pier · Contact", icon: "✉️", kind: "contact" },
];

export const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<ZoneId, Zone>;

/* ---------------- paths: curved sand trails from spawn to every ring ---------------- */

export type Path = [number, number][];

export const PATHS: Path[] = ZONES.filter((z) => z.id !== "about").map((z, i) => {
  const [ex, ez] = z.ring;
  const sx = 0;
  const sz = 1.6;
  // Bend each trail sideways a little so they don't look ruler-drawn.
  const mx = (sx + ex) / 2 + (i % 2 ? 1 : -1) * 1.6 * Math.sign(ez || 1);
  const mz = (sz + ez) / 2 + (i % 2 ? -1 : 1) * 1.2;
  const pts: Path = [];
  for (let t = 0; t <= 1.0001; t += 1 / 24) {
    const u = 1 - t;
    pts.push([u * u * sx + 2 * u * t * mx + t * t * ex, u * u * sz + 2 * u * t * mz + t * t * ez]);
  }
  return pts;
});

export function distToPaths(x: number, z: number) {
  let best = Infinity;
  for (const p of PATHS)
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, az] = p[i];
      const [bx, bz] = p[i + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
    }
  return best;
}

/* ---------------- monster nests (boss missions) ---------------- */

export type BossId = "critter";
export type Nest = { id: BossId; pos: [number, number]; ring: [number, number]; ringR: number };

export const NESTS: Nest[] = [
  { id: "critter", pos: [-17.5, -8.5], ring: [-14.4, -6.6], ringR: 2.2 },
];
export const nestById = Object.fromEntries(NESTS.map((n) => [n.id, n])) as Record<BossId, Nest>;

/* ---------------- GitHub City: a second island to the north ---------------- */

export const CITY = { x: 0, z: -64, half: 15 };
/** Portal on the main island, and the return portal in the city. */
export const PORTALS = {
  toCity: { x: 15.5, z: 12.5 },
  toIsland: { x: 0, z: CITY.z + CITY.half - 2.5 },
};

export function insideCity(x: number, z: number, margin = 0) {
  return Math.abs(x - CITY.x) < CITY.half - margin && Math.abs(z - CITY.z) < CITY.half - margin;
}

/** Anywhere the player may stand. */
export function walkable(x: number, z: number) {
  return insideIsland(x, z, 1.2) || insideCity(x, z, 0.8);
}

/** Building footprints in the city, filled once the repos load. */
export const CITY_COLLIDERS: { x: number; z: number; r: number }[] = [];

/* ---------------- the AI digital twin NPC ---------------- */

export const NPC = { pos: [-4.4, 3.4] as [number, number], ring: [-3.1, 4.7] as [number, number], ringR: 1.6 };

function nearZone(x: number, z: number, pad: number) {
  if (Math.hypot(x - PORTALS.toCity.x, z - PORTALS.toCity.z) < 2 + pad) return true;
  if (Math.hypot(x - NPC.pos[0], z - NPC.pos[1]) < 1.4 + pad || Math.hypot(x - NPC.ring[0], z - NPC.ring[1]) < NPC.ringR + pad) return true;
  if (NESTS.some((n) => Math.hypot(x - n.pos[0], z - n.pos[1]) < 2.6 + pad || Math.hypot(x - n.ring[0], z - n.ring[1]) < n.ringR + pad)) return true;
  return ZONES.some((zn) => Math.hypot(x - zn.pos[0], z - zn.pos[1]) < zn.solidR + pad || Math.hypot(x - zn.ring[0], z - zn.ring[1]) < zn.ringR + pad * 0.6);
}

/* ---------------- scattered nature (deterministic) ---------------- */

export type Prop = { x: number; z: number; s: number; r: number; v: number };

function scatter(seed: number, count: number, ok: (x: number, z: number) => boolean, scale: [number, number]) {
  const rand = rng(seed);
  const out: Prop[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 26;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (!ok(x, z)) continue;
    out.push({ x, z, s: scale[0] + rand() * (scale[1] - scale[0]), r: rand() * Math.PI * 2, v: rand() });
  }
  return out;
}

export const TREES = scatter(
  7,
  46,
  (x, z) => insideIsland(x, z, 1.6) && distToPaths(x, z) > 2.4 && !nearZone(x, z, 2.5) && Math.hypot(x, z) > 5,
  [0.8, 1.35]
);

export const ROCKS = scatter(11, 26, (x, z) => insideIsland(x, z, 0.8) && distToPaths(x, z) > 1.8 && !nearZone(x, z, 1.5), [0.35, 0.9]);

export const GRASS = scatter(3, 2600, (x, z) => insideIsland(x, z, 0.5) && distToPaths(x, z) > 1.4 && !nearZone(x, z, 0.4), [0.6, 1.3]);

export const FLOWERS = scatter(5, 220, (x, z) => insideIsland(x, z, 0.8) && distToPaths(x, z) > 1.5 && !nearZone(x, z, 0.8), [0.7, 1.2]);

/* ---------------- collision circles for the player ---------------- */

export const COLLIDERS: { x: number; z: number; r: number }[] = [
  ...ZONES.map((z) => ({ x: z.pos[0], z: z.pos[1], r: z.solidR })),
  ...NESTS.map((n) => ({ x: n.pos[0], z: n.pos[1], r: 1.6 })),
  { x: NPC.pos[0], z: NPC.pos[1], r: 0.7 },
  ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.55 * t.s })),
  ...ROCKS.filter((r) => r.s > 0.6).map((r) => ({ x: r.x, z: r.z, r: 0.6 * r.s })),
];

/* ---------------- what each zone's card says ---------------- */

export type ZoneCard = {
  kicker: string;
  title: string;
  subtitle?: string;
  lines: string[];
  chips?: string[];
  chipsLabel?: string;
};

export function cardFor(id: ZoneId): ZoneCard {
  const exp = experience.find((e) => e.id === id || (id === "codere" && e.id === "codere"));
  const proj = projects.find((p) => p.id === id);
  switch (id) {
    case "about":
      return { kicker: "Player profile", title: profile.name, subtitle: profile.title, lines: [profile.tagline, ...profile.bio] };
    case "asadra":
    case "codere":
    case "gocode": {
      const e = exp ?? experience.find((x) => x.id === (id === "gocode" ? "gocode" : id))!;
      return { kicker: e.period, title: e.company, subtitle: e.role, lines: [e.summary, ...e.highlights], chips: e.stack, chipsLabel: "Loadout" };
    }
    case "giborim":
    case "logiki":
    case "motion": {
      const p = proj!;
      return { kicker: p.kicker, title: p.name, lines: [p.summary, ...p.highlights], chips: p.stack, chipsLabel: "Built with" };
    }
    case "skills":
      return {
        kicker: `${skills.length} crystals collected`,
        title: "Skill Crystals",
        subtitle: "Every crystal is a skill in the inventory",
        lines: [],
        chips: skills.map((s) => s.name),
        chipsLabel: "Inventory",
      };
    case "education":
      return {
        kicker: "Training history",
        title: "The Academy",
        lines: education.map((e) => `${e.title}${e.school ? `, ${e.school}` : ""} (${e.year})`),
      };
    case "contact":
      return { kicker: "Send a message", title: "The Pier", subtitle: "Drop a letter in the mailbox", lines: [] };
  }
}

/** Years since the first dev job: the player's level. */
export const PLAYER_LEVEL = Math.max(1, new Date().getFullYear() - 2022);
