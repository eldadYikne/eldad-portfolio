import { create } from "zustand";
import type { ZoneId } from "./world";

type State = {
  ready: boolean;
  /** intro fly-in finished, controls live */
  started: boolean;
  /** the visitor left the title screen (one-way) */
  entered: boolean;
  zone: ZoneId | null;
  visited: ZoneId[];
  /** last zone visited for the first time, drives the +XP popup */
  reward: { id: ZoneId; at: number } | null;
  setReady: () => void;
  start: () => void;
  setEntered: () => void;
  enter: (z: ZoneId | null) => void;
};

export const useGame = create<State>((set, get) => ({
  ready: false,
  started: false,
  entered: false,
  zone: null,
  visited: [],
  reward: null,
  setReady: () => set({ ready: true }),
  start: () => set({ started: true }),
  setEntered: () => set({ entered: true }),
  enter: (zone) => {
    if (zone === get().zone) return;
    if (zone && !get().visited.includes(zone)) {
      set((s) => ({ zone, visited: [...s.visited, zone], reward: { id: zone, at: performance.now() } }));
    } else set({ zone });
  },
}));

/**
 * Per-frame input and player state. Mutable on purpose: read in useFrame
 * and by the minimap without triggering React renders.
 */
export const input = {
  keys: new Set<string>(),
  /** virtual joystick, -1..1 on each axis (x = right, y = down) */
  stick: { x: 0, y: 0 },
  /** click / tap destination on the ground */
  target: null as null | { x: number; z: number },
  /** world point under the mouse cursor (ground plane) */
  aim: { x: 0, z: 0, valid: false },
  /** touch aim stick, -1..1 (x = right, y = down) */
  aimStick: { x: 0, y: 0, active: false },
  /** mouse button / aim stick held */
  firing: false,
  /** Shift held */
  sprint: false,
  /** set on Space press, consumed by the player on the next frame */
  jump: false,
};

/**
 * Title-screen → game transition. `p` eases toward `target` (0..1) and only
 * ever moves forward: once you're on the island there's no way back.
 */
export const intro = { p: 0, target: 0 };

export const player = {
  x: 0,
  z: 4.6,
  heading: 0,
  moving: false,
  /** while > 0 the avatar faces its attack target instead of its walking direction */
  aimT: 0,
  aimHeading: 0,
  /** height above the ground while jumping */
  y: 0,
  vy: 0,
};

/** True while the user is typing in a form field (key events must not drive the game). */
export function isTyping(e: Event) {
  return e.target instanceof Element && !!e.target.closest("input, textarea");
}
