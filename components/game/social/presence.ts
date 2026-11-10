import { create } from "zustand";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { player } from "../store";

/**
 * Live presence: every visitor publishes a throttled position to Firestore
 * and sees everyone else as a ghost. Writes only happen when you actually
 * move (≤ 1/s) plus a slow heartbeat, which keeps it well inside free quota.
 */

export type Ghost = { id: string; x: number; z: number; h: number; moving: boolean; country: string; at: number };

const COLLECTION = "presence";
const STALE_MS = 20_000;

/** Latest data per ghost; read every frame by the scene (no React). */
export const ghosts = new Map<string, Ghost>();

export const usePresence = create<{ ids: string[]; enabled: boolean }>(() => ({ ids: [], enabled: false }));

let started = false;

export function startPresence() {
  if (started || typeof window === "undefined") return () => {};
  started = true;
  const me = sessionId();
  let country = "";
  let lastX = Infinity;
  let lastZ = Infinity;
  let lastWrite = 0;
  let dead = false;

  fetch("/api/whoami")
    .then((r) => r.json())
    .then((d) => (country = d.country ?? ""))
    .catch(() => {});

  const ref = doc(db, COLLECTION, me);
  const publish = (force = false) => {
    if (dead) return;
    const now = Date.now();
    const moved = Math.hypot(player.x - lastX, player.z - lastZ) > 0.25;
    if (!force && !(moved && now - lastWrite > 1000) && now - lastWrite < 8000) return;
    lastX = player.x;
    lastZ = player.z;
    lastWrite = now;
    setDoc(ref, { x: +player.x.toFixed(2), z: +player.z.toFixed(2), h: +player.heading.toFixed(2), moving: player.moving, country, at: now }).catch(() => {
      // Most likely Firestore rules don't allow the presence collection yet.
      dead = true;
      usePresence.setState({ enabled: false });
    });
  };
  const timer = setInterval(publish, 250);

  const unsub = onSnapshot(
    query(collection(db, COLLECTION), orderBy("at", "desc"), limit(25)),
    (snap) => {
      usePresence.setState({ enabled: true });
      const now = Date.now();
      const seen = new Set<string>();
      snap.forEach((d) => {
        if (d.id === me) return;
        const g = d.data() as Omit<Ghost, "id">;
        if (now - g.at > STALE_MS) return;
        seen.add(d.id);
        ghosts.set(d.id, { id: d.id, ...g });
      });
      for (const id of ghosts.keys()) if (!seen.has(id)) ghosts.delete(id);
      sync();
    },
    () => usePresence.setState({ enabled: false })
  );

  // Drop ghosts that stopped sending heartbeats.
  const sweep = setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, g] of ghosts) if (now - g.at > STALE_MS) (ghosts.delete(id), (changed = true));
    if (changed) sync();
  }, 5000);

  const leave = () => void deleteDoc(ref).catch(() => {});
  window.addEventListener("pagehide", leave);

  return () => {
    clearInterval(timer);
    clearInterval(sweep);
    unsub();
    window.removeEventListener("pagehide", leave);
    leave();
    started = false;
  };
}

function sync() {
  const ids = [...ghosts.keys()].sort();
  const prev = usePresence.getState().ids;
  if (ids.length !== prev.length || ids.some((id, i) => id !== prev[i])) usePresence.setState({ ids });
}

function sessionId() {
  try {
    let id = sessionStorage.getItem("island-session");
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("island-session", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

/** "IL" → 🇮🇱 */
export function flag(country: string) {
  if (!/^[A-Z]{2}$/.test(country)) return "🌍";
  return String.fromCodePoint(...[...country].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
