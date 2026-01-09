"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close chat on Escape key press
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close chat if clicked outside the panel
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!open) return;
      const panel = panelRef.current;
      if (!panel || panel.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const handleReset = () => {
    // setMessages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput(""); // Reset input field after submitting
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white shadow-lg shadow-blue-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="text-lg">✨</span>
        <span className="text-sm font-semibold">
          {open ? "Close" : "Ask AI"}
        </span>
      </button>

      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className={[
          "fixed right-0 top-0 z-50 h-dvh w-[92vw] max-w-md border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="AI chat panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600" />
            <div>
              <div className="text-sm font-semibold text-white">
                AI Assistant
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              title="Reset"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[calc(100dvh-206px)] overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-white/50 text-sm py-8">
                Hi! Ask me anything about Eldad's skills, projects, or
                experience.
              </div>
            )}
            {messages.map((m: any) => (
              <div
                key={m.id}
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-600/15"
                    : "bg-white/10 text-white/90",
                ].join(" ")}
              >
                {m.content}
              </div>
            ))}
            {status === "submitted" && (
              <div className="max-w-[85%] rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  >
                    .
                  </span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  >
                    .
                  </span>
                </span>
              </div>
            )}
            {status === "error" && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error?.message || "Something went wrong"}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-white/10 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-11 flex-1 rounded-xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-purple-500/60"
              placeholder="Type your message…"
              disabled={status !== "ready"}
            />
            <button
              type="submit"
              disabled={status !== "ready"}
              className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 hover:opacity-95 active:opacity-90 disabled:opacity-60"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-[11px] text-white/40">
            Tip: Press <span className="text-white/60">Esc</span> to close.
          </div>
        </form>
      </div>
    </>
  );
}
