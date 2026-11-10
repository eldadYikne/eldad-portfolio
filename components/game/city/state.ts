import { create } from "zustand";
import type { Repo } from "@/app/api/github/route";
import { CITY, CITY_COLLIDERS } from "../world";

export type Building = Repo & { x: number; z: number; w: number; h: number; color: string; fresh: boolean };

export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3b82f6",
  JavaScript: "#facc15",
  Vue: "#34d399",
  HTML: "#fb923c",
  SCSS: "#f472b6",
  CSS: "#a855f7",
  Python: "#22d3ee",
  "C++": "#ef4444",
  PHP: "#8b5cf6",
};

type CityState = {
  status: "idle" | "loading" | "ready" | "error";
  buildings: Building[];
  /** index of the building the player is standing next to */
  near: number;
  inCity: boolean;
  /** bumps on every teleport, drives the warp flash */
  warpAt: number;
  load: () => Promise<void>;
  set: (p: Partial<CityState>) => void;
};

export const useCity = create<CityState>((set, get) => ({
  status: "idle",
  buildings: [],
  near: -1,
  inCity: false,
  warpAt: 0,
  set: (p) => set(p),
  load: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const { repos } = (await (await fetch("/api/github")).json()) as { repos: Repo[] };
      set({ buildings: layout(repos), status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },
}));

/** Grid the repos into blocks with streets, tallest (largest) toward the centre. */
function layout(repos: Repo[]): Building[] {
  const sorted = [...repos].sort((a, b) => b.size - a.size);
  const cols = Math.ceil(Math.sqrt(sorted.length));
  const gap = 3.4;
  const span = (cols - 1) * gap;
  // Spiral-ish ordering: biggest buildings land closest to the middle.
  const cells: { x: number; z: number; d: number }[] = [];
  for (let r = 0; r < cols; r++)
    for (let c = 0; c < cols; c++) {
      const x = CITY.x - span / 2 + c * gap;
      const z = CITY.z - span / 2 + r * gap - 1.5;
      cells.push({ x, z, d: Math.hypot(x - CITY.x, z - CITY.z) });
    }
  cells.sort((a, b) => a.d - b.d);
  const month = Date.now() - 30 * 86400_000;
  const out = sorted.slice(0, cells.length).map((repo, i) => {
    const h = Math.min(9, 1.2 + Math.log2(repo.size / 40 + 1) * 0.95);
    const w = 1.6 + Math.min(0.6, repo.stars * 0.15);
    return {
      ...repo,
      // Cached responses from before stacks were added won't have the field.
      stack: Array.isArray(repo.stack) ? repo.stack : [],
      x: cells[i].x,
      z: cells[i].z,
      w,
      h,
      color: LANG_COLORS[repo.language ?? ""] ?? "#94a3b8",
      fresh: new Date(repo.pushedAt).getTime() > month,
    };
  });
  CITY_COLLIDERS.length = 0;
  out.forEach((b) => CITY_COLLIDERS.push({ x: b.x, z: b.z, r: b.w * 0.62 }));
  return out;
}
