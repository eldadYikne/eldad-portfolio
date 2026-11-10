"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RealtimeSession } from "@openai/agents/realtime";
import { useNpc, type Msg } from "./state";

const SUGGESTIONS = [
  "What do you do as Tech Lead at BrightBuild?",
  "What's your favourite tech stack?",
  "Tell me about Bishvil Giborim",
  "ספר לי על משחקי התנועה",
];

const VOICE_INSTRUCTIONS = `You are the AI digital twin of Eldad Yikne inside his portfolio game.
Speak in FIRST PERSON as Eldad. Reply in the language the visitor speaks (Hebrew or English).
Keep every answer to 2-3 short, energetic sentences.
Use your tools to look up facts about my experience, projects and skills before answering. Never invent facts.
Start by greeting the visitor in one sentence and inviting a question.`;

type RealtimeItem = { type?: string; role?: string; content?: { transcript?: string; text?: string }[] };

/** Chat panel that opens while the player stands in the digital twin's ring. */
export function NpcChat() {
  const near = useNpc((s) => s.near);
  const messages = useNpc((s) => s.messages);
  const thinking = useNpc((s) => s.thinking);
  const tts = useNpc((s) => s.tts);
  const voice = useNpc((s) => s.voice);
  const [text, setText] = useState("");
  const [voiceLog, setVoiceLog] = useState<Msg[]>([]);
  const session = useRef<RealtimeSession | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, voiceLog]);

  // Walking away closes the voice session and stops any speech.
  useEffect(() => {
    if (near) {
      const id = setTimeout(() => input.current?.focus({ preventScroll: true }), 300);
      return () => clearTimeout(id);
    }
    stopVoice();
    window.speechSynthesis?.cancel();
    useNpc.getState().set({ talking: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near]);

  useEffect(() => () => stopVoice(), []);

  async function startVoice() {
    const st = useNpc.getState();
    st.set({ voice: "connecting" });
    window.speechSynthesis?.cancel();
    try {
      const [{ RealtimeAgent, RealtimeSession }, { getPdf }, { getProjectsTool }, { getSkillsTool }] = await Promise.all([
        import("@openai/agents/realtime"),
        import("@/lib/agent/pdf-tool"),
        import("@/lib/agent/getProjectsTool"),
        import("@/lib/agent/getProjectsSkills"),
      ]);
      const res = await fetch("/api/realtime-agent");
      const { clientSecret } = await res.json();
      if (!clientSecret) throw new Error("no secret");
      const agent = new RealtimeAgent({
        name: "AI Eldad",
        instructions: VOICE_INSTRUCTIONS,
        tools: [getPdf, getProjectsTool, getSkillsTool],
      });
      const s = new RealtimeSession(agent, {
        model: "gpt-realtime-preview",
        config: {
          inputAudioTranscription: { model: "gpt-4o-mini-transcribe" },
          turnDetection: { type: "server_vad", threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
        },
      });
      s.on("history_updated", (history) => {
        const log = (history as RealtimeItem[])
          .filter((i) => i.type === "message" && (i.role === "user" || i.role === "assistant"))
          .map((i) => ({
            role: i.role as Msg["role"],
            content: i.content?.map((c) => c.transcript ?? c.text ?? "").join(" ").trim() ?? "",
          }))
          .filter((m) => m.content);
        setVoiceLog(log);
      });
      s.on("audio_start", () => useNpc.getState().set({ talking: true }));
      s.on("audio_stopped", () => useNpc.getState().set({ talking: false }));
      await s.connect({ apiKey: clientSecret });
      s.sendMessage("Hi!");
      session.current = s;
      useNpc.getState().set({ voice: "on" });
    } catch {
      useNpc.getState().set({ voice: "off" });
      setVoiceLog((l) => [...l, { role: "assistant", content: "Voice chat isn't available right now. Type your question instead!" }]);
    }
  }

  function stopVoice() {
    session.current?.close();
    session.current = null;
    useNpc.getState().set({ voice: "off", talking: false });
  }

  if (!near) return null;

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const q = text;
    setText("");
    void useNpc.getState().ask(q);
  };

  const log = voice === "off" ? messages : voiceLog;

  return (
    <section className="npc-chat" aria-label="Chat with AI Eldad">
      <header>
        <div className="npc-chat-avatar">🤖</div>
        <div>
          <strong>AI Eldad</strong>
          <em>My digital twin · trained on my real CV</em>
        </div>
        <button
          className={`npc-chip-btn ${tts ? "on" : ""}`}
          onClick={() => useNpc.getState().setTts(!tts)}
          aria-pressed={tts}
          title="Read answers aloud"
        >
          {tts ? "🔈" : "🔇"}
        </button>
      </header>

      <div className="npc-log" ref={scroller} aria-live="polite">
        {log.length === 0 && (
          <p className="npc-empty">
            {voice === "on" ? "🎙️ Listening… just talk." : "Hey! I'm Eldad's AI twin. Ask me anything about my work, in English or עברית."}
          </p>
        )}
        {log.map((m, i) => (
          <div key={i} className={`npc-msg ${m.role}`} dir="auto">
            {m.content || (thinking && i === log.length - 1 ? <span className="npc-dots"><i /><i /><i /></span> : "")}
          </div>
        ))}
      </div>

      {voice === "off" && messages.length < 2 && (
        <div className="npc-suggest">
          {SUGGESTIONS.map((q) => (
            <button key={q} onClick={() => useNpc.getState().ask(q)} dir="auto">
              {q}
            </button>
          ))}
        </div>
      )}

      <form className="npc-input" onSubmit={send}>
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={voice === "on" ? "Voice chat is on…" : "Ask me something…"}
          disabled={voice !== "off"}
          dir="auto"
          aria-label="Your question"
        />
        <button type="submit" disabled={!text.trim() || thinking || voice !== "off"} aria-label="Send">
          ➤
        </button>
        <button
          type="button"
          className={`npc-mic ${voice}`}
          onClick={() => (voice === "off" ? startVoice() : stopVoice())}
          aria-label={voice === "off" ? "Start voice chat" : "Stop voice chat"}
          title="Talk with your voice"
        >
          {voice === "connecting" ? "…" : voice === "on" ? "■" : "🎙️"}
        </button>
      </form>
    </section>
  );
}
