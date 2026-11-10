import { create } from "zustand";
import type { DataConnection, Peer as PeerT } from "peerjs";
import { input } from "../store";
import { useCombat } from "../combat/state";
import { zoneById } from "../world";
import { useGame } from "../store";

/**
 * Phone-as-controller, host side. The desktop opens a PeerJS peer and shows
 * its id as a QR code; the phone connects peer-to-peer (WebRTC data channel)
 * and streams joystick input. No game server involved.
 */

export type PhoneMsg =
  | { t: "move"; x: number; y: number }
  | { t: "aim"; x: number; y: number; active: boolean }
  | { t: "start" }
  | { t: "hello" };

export type HostMsg =
  | { t: "state"; zone: string | null; mission: boolean; near: boolean; hp: number }
  | { t: "hurt" };

type PhoneState = {
  status: "idle" | "waiting" | "connected" | "error";
  url: string | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  host: () => Promise<void>;
};

let peer: PeerT | null = null;
let conn: DataConnection | null = null;
let unsub: (() => void)[] = [];

export const usePhone = create<PhoneState>((set, get) => ({
  status: "idle",
  url: null,
  open: false,
  setOpen: (open) => {
    set({ open });
    if (open && get().status === "idle") void get().host();
  },
  host: async () => {
    set({ status: "waiting" });
    try {
      const { Peer } = await import("peerjs");
      const id = `eldad-island-${Math.random().toString(36).slice(2, 10)}`;
      peer = new Peer(id, { debug: 0 });
      peer.on("open", () => set({ url: `${window.location.origin}/controller?id=${id}` }));
      peer.on("error", () => set({ status: "error" }));
      peer.on("connection", (c) => {
        conn?.close();
        conn = c;
        c.on("open", () => {
          set({ status: "connected", open: false });
          sendState();
        });
        c.on("data", (d) => handle(d as PhoneMsg));
        c.on("close", () => {
          resetInput();
          set({ status: "waiting" });
        });
      });
      // Mirror game state to the phone (zone name, HP, mission prompt) and buzz on hits.
      unsub.forEach((u) => u());
      unsub = [
        useCombat.subscribe((s, p) => {
          if (s.hurtAt !== p.hurtAt) send({ t: "hurt" });
          if (s.hp !== p.hp || s.mission !== p.mission || s.nearNest !== p.nearNest) sendState();
        }),
        useGame.subscribe((s, p) => s.zone !== p.zone && sendState()),
      ];
    } catch {
      set({ status: "error" });
    }
  },
}));

function send(m: HostMsg) {
  if (conn?.open) conn.send(m);
}

function sendState() {
  const c = useCombat.getState();
  const z = useGame.getState().zone;
  send({ t: "state", zone: z ? zoneById[z].label : null, mission: !!c.mission, near: !!c.nearNest, hp: c.hp });
}

function resetInput() {
  input.stick.x = input.stick.y = 0;
  Object.assign(input.aimStick, { x: 0, y: 0, active: false });
  input.firing = false;
}

function handle(m: PhoneMsg) {
  if (m.t === "move") {
    input.stick.x = clamp(m.x);
    input.stick.y = clamp(m.y);
  } else if (m.t === "aim") {
    Object.assign(input.aimStick, { x: clamp(m.x), y: clamp(m.y), active: m.active });
    input.firing = m.active && Math.hypot(m.x, m.y) > 0.3;
  } else if (m.t === "start") {
    const c = useCombat.getState();
    if (c.nearNest && !c.mission) c.start(c.nearNest);
    else if (c.mission && (c.mission.phase === "victory" || c.mission.phase === "defeat")) c.leave();
  }
}

const clamp = (v: number) => (Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
