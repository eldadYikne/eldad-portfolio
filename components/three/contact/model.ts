import * as THREE from "three";

export type Field = "name" | "email" | "message";
export const FIELDS: Field[] = ["name", "email", "message"];

/* ---------------- board layout (world units) ---------------- */

export const BOARD = { x: 0, y: 5.2, z: -9.35, w: 13.4, h: 5.8, d: 0.3 };
export const FONT_MONO = "/fonts/jetbrains-mono-latin-700-normal.woff";
export const GLYPH = 0.36;
/** JetBrains Mono advance width is 600/1000 em. */
export const ADV = GLYPH * 0.6;
export const COLS = 44;
export const SLOT_X0 = -4.6;
export const FACE_Z = BOARD.z + BOARD.d / 2 + 0.02;

export const ROW_Y: Record<Field, number[]> = {
  name: [6.95],
  email: [6.35],
  message: [5.65, 5.13, 4.61, 4.09, 3.57],
};


/**
 * Character index -> board cell (row * COLS + col), or -1 when it doesn't fit.
 * The message wraps on word boundaries; single-line fields just clip.
 */
const layoutCache: Record<Field, { value: string; cells: number[] }> = {
  name: { value: "", cells: [] },
  email: { value: "", cells: [] },
  message: { value: "", cells: [] },
};
export function layout(field: Field, value: string) {
  const c = layoutCache[field];
  if (c.value === value && c.cells.length === value.length) return c.cells;
  const rows = ROW_Y[field].length;
  const cells: number[] = new Array(value.length).fill(-1);
  let row = 0;
  let col = 0;
  for (let i = 0; i < value.length && row < rows; i++) {
    const ch = value[i];
    if (ch === "\n") {
      row++;
      col = 0;
      continue;
    }
    if (field === "message" && !/\s/.test(ch) && (i === 0 || /\s/.test(value[i - 1]))) {
      let len = 0;
      while (i + len < value.length && !/\s/.test(value[i + len])) len++;
      if (col > 0 && col + len > COLS && len <= COLS) {
        row++;
        col = 0;
        if (row >= rows) break;
      }
    }
    if (/\s/.test(ch) && col === 0 && row > 0) continue; // no leading spaces on wrapped lines
    cells[i] = row * COLS + col;
    col++;
    if (col >= COLS) {
      if (field !== "message") break;
      row++;
      col = 0;
    }
  }
  layoutCache[field] = { value, cells };
  return cells;
}

/** World position of the glyph centre for character `i`, or null if it's off the board. */
export function slotPosition(field: Field, value: string, i: number, out = new THREE.Vector3()) {
  const cell = layout(field, value)[i] ?? -1;
  if (cell < 0) return null;
  const row = Math.floor(cell / COLS);
  const col = cell % COLS;
  return out.set(BOARD.x + SLOT_X0 + col * ADV + ADV / 2, ROW_Y[field][row], FACE_Z);
}

/** Board-visible rows: characters that have not landed yet are blanks. */
export function visibleRows(field: Field, value: string, landed: boolean[] | null) {
  const cells = layout(field, value);
  const grid = ROW_Y[field].map(() => new Array(COLS).fill(" "));
  for (let i = 0; i < value.length; i++) {
    const cell = cells[i];
    if (cell < 0 || /\s/.test(value[i]) || (landed && !landed[i])) continue;
    grid[Math.floor(cell / COLS)][cell % COLS] = value[i];
  }
  return grid.map((r) => r.join("").replace(/\s+$/, ""));
}

/* ---------------- landed state, shared by the squad and the board ---------------- */

/** null = squad inactive, every character counts as landed. */
export const landed: Record<Field, boolean[] | null> = { name: null, email: null, message: null };

const listeners = new Set<() => void>();
export function onBoardChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function boardChanged() {
  listeners.forEach((fn) => fn());
}
