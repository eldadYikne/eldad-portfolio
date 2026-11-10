import { create } from "zustand";
import { isMuted } from "../audio";

export type Msg = { role: "user" | "assistant"; content: string };

type NpcState = {
  near: boolean;
  messages: Msg[];
  /** an answer is streaming in */
  thinking: boolean;
  /** text-to-speech for typed answers */
  tts: boolean;
  voice: "off" | "connecting" | "on";
  /** the twin is talking (streaming text or speaking audio) */
  talking: boolean;
  setNear: (v: boolean) => void;
  ask: (q: string) => Promise<void>;
  setTts: (v: boolean) => void;
  set: (p: Partial<NpcState>) => void;
};

export const useNpc = create<NpcState>((set, get) => ({
  near: false,
  messages: [],
  thinking: false,
  tts: true,
  voice: "off",
  talking: false,
  setNear: (near) => get().near !== near && set({ near }),
  setTts: (tts) => {
    if (!tts) window.speechSynthesis?.cancel();
    set({ tts });
  },
  set: (p) => set(p),

  /** Streams an answer from the existing RAG agent, in the digital-twin persona. */
  ask: async (q) => {
    const question = q.trim();
    if (!question || get().thinking) return;
    const history = get().messages.slice(-6);
    set((s) => ({ messages: [...s.messages, { role: "user", content: question }, { role: "assistant", content: "" }], thinking: true, talking: true }));
    const append = (chunk: string) =>
      set((s) => {
        const msgs = s.messages.slice();
        const last = msgs[msgs.length - 1];
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
        return { messages: msgs };
      });
    try {
      const res = await fetch("/api/chat-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question, persona: "npc", history, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.replace(/^data: /, "");
          try {
            const data = JSON.parse(line);
            if (data.type === "chunk") append(data.content);
            if (data.type === "error") throw new Error(data.error);
          } catch {
            /* partial or non-JSON line */
          }
        }
      }
    } catch {
      append("Hmm, my brain is offline right now 😅 Try again in a moment, or leave me a message at the pier!");
    }
    set({ thinking: false });
    const answer = get().messages[get().messages.length - 1]?.content ?? "";
    speak(answer, () => set({ talking: false }));
  },
}));

/** Read an answer aloud with the browser's built-in speech synthesis. */
function speak(text: string, done: () => void) {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth || !useNpc.getState().tts || isMuted() || !text) return done();
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const hebrew = /[֐-׿]/.test(text);
  u.lang = hebrew ? "he-IL" : "en-US";
  const voice = synth.getVoices().find((v) => v.lang.startsWith(hebrew ? "he" : "en"));
  if (voice) u.voice = voice;
  u.rate = 1.05;
  u.onend = done;
  u.onerror = done;
  synth.speak(u);
}
