import { create } from "zustand";

export type Section = "hero" | "experience" | "projects" | "skills" | "education" | "contact";
export type ContactField = "name" | "email" | "message";
export type ContactStatus = "idle" | "sending" | "sent" | "error";
export type WorldMode = "void" | "heroes";
export type Selection =
  | { kind: "bio" }
  | { kind: "experience"; id: string }
  | { kind: "project"; id: string }
  | { kind: "education"; id: string }
  | null;

export type Quality = "high" | "medium" | "low";

type State = {
  ready: boolean;
  quality: Quality;
  reducedMotion: boolean;
  section: Section;
  mode: WorldMode;
  zeroG: boolean;
  motionLab: boolean;
  shattered: boolean;
  /** true while shards fly back into the monolith */
  reassembling: boolean;
  /** world-space impact point of the last shatter */
  impact: [number, number, number];
  selected: Selection;
  tooltip: { text: string; color: string } | null;
  contact: Record<ContactField, string>;
  contactStatus: ContactStatus;

  setReady: () => void;
  setQuality: (q: Quality) => void;
  setReducedMotion: (v: boolean) => void;
  goTo: (s: Section) => void;
  toggleMode: () => void;
  toggleZeroG: () => void;
  setMotionLab: (v: boolean) => void;
  shatter: (p: [number, number, number]) => void;
  reassemble: () => void;
  finishReassemble: () => void;
  kick: (amount: number) => void;
  select: (s: Selection) => void;
  setTooltip: (t: State["tooltip"]) => void;
  setContact: (field: ContactField, value: string) => void;
  setContactStatus: (s: ContactStatus) => void;
};

/** Per-frame effect values that must not trigger React renders. */
export const fx = { shake: 0 };

export const useWorld = create<State>((set, get) => ({
  ready: false,
  quality: "high",
  reducedMotion: false,
  section: "hero",
  mode: "void",
  zeroG: false,
  motionLab: false,
  shattered: false,
  reassembling: false,
  impact: [0, 2.5, 2],
  selected: null,
  tooltip: null,
  contact: { name: "", email: "", message: "" },
  contactStatus: "idle",

  setReady: () => set({ ready: true }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  goTo: (section) => {
    document.body.style.cursor = "";
    set({ section, tooltip: null, selected: null });
  },
  toggleMode: () => {
    set((s) => ({ mode: s.mode === "void" ? "heroes" : "void" }));
    get().kick(0.25);
  },
  toggleZeroG: () => {
    set((s) => ({ zeroG: !s.zeroG }));
    get().kick(0.35);
  },
  setMotionLab: (motionLab) => set({ motionLab }),
  shatter: (impact) => {
    if (get().shattered) return;
    set({ shattered: true, reassembling: false, impact });
    get().kick(1);
  },
  reassemble: () => {
    if (!get().shattered || get().reassembling) return;
    set({ reassembling: true });
  },
  finishReassemble: () => {
    set({ shattered: false, reassembling: false });
    get().kick(0.4);
  },
  kick: (amount) => {
    if (!get().reducedMotion) fx.shake = Math.min(1.2, fx.shake + amount);
  },
  select: (selected) => set({ selected }),
  setTooltip: (tooltip) => set({ tooltip }),
  setContact: (field, value) =>
    set((s) => ({ contact: { ...s.contact, [field]: value }, contactStatus: s.contactStatus === "sent" ? "idle" : s.contactStatus })),
  setContactStatus: (contactStatus) => {
    set({ contactStatus });
    if (contactStatus === "sent") get().kick(0.9);
  },
}));

export const palettes: Record<WorldMode, { a: string; b: string; fog: string; floor: string }> = {
  void: { a: "#22d3ee", b: "#a855f7", fog: "#05060a", floor: "#07080d" },
  heroes: { a: "#fbbf24", b: "#f97316", fog: "#0a0604", floor: "#0d0905" },
};
