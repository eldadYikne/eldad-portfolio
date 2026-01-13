"use client";
import { useEffect, useRef, useState } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageItem } from "@/types/realTimeAgent";
import { getPdf } from "@/lib/agent/pdf-tool";
import { getProjectsTool } from "@/lib/agent/getProjectsTool";
import { getSkillsTool } from "@/lib/agent/getProjectsSkills";
import { X, Mic, MicOff, Square } from "lucide-react";
import ChatWindow from "./ChatWindow";

const AnimatedDots = () => (
  <span className="inline-flex gap-0.5 ml-1">
    <span className="animate-dot-1">.</span>
    <span className="animate-dot-2">.</span>
    <span className="animate-dot-3">.</span>
  </span>
);

const AudioWaveform = () => (
  <div className="flex items-center justify-center gap-1 h-8">
    <div className="w-1 bg-white rounded-full animate-wave-1" />
    <div className="w-1 bg-white rounded-full animate-wave-2" />
    <div className="w-1 bg-white rounded-full animate-wave-3" />
    <div className="w-1 bg-white rounded-full animate-wave-4" />
    <div className="w-1 bg-white rounded-full animate-wave-5" />
  </div>
);

export default function VoiceRealtimeAgent() {
  const [session, setSession] = useState<RealtimeSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTooling, setIsTooling] = useState(false);
  const [input, setInput] = useState("");
  const sessionRef = useRef<RealtimeSession | null>(null);
  const [messageHistory, setMessageHistory] = useState<MessageItem[]>();

  // For Floating Chat integration
  const [open, setOpen] = useState(false);

  const { messages, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/realtime-agent");
      const { clientSecret } = await res.json();
      const agent = new RealtimeAgent({
        name: "PDF Assistant",
        instructions: `
        אתה יכול לשאול אותי על מידע לגבי אלדד יקנה, ואני אעזור לך להשיג את המידע מתוך ה-PDFים שיש לי.
        אני לא יכול לעזור בשום דבר אחר, רק במידע שנמצא ב-PDF.
        תכתוב לי את השאלות שלך, ואני אענה עליהם על פי המידע מה-PDFים.
        אם אין לי מידע על שאלה מסוימת, אני אגיד "אין מידע ב-PDF"
        אתה מדבר רק בשפה עברית ומי שמדבר איתך מדבר רק בשפה בעברית
        תתחיל אתה בהודעה שאתה מציג את עצמך ואומר "שלום, אני הסוכן החכם של אלדד אשמח לתת לך מידע על אלדד".
        אתה מספר על יכולת פתרון בעיות ופיתוח מהיר וחכם בעזרת כלי בינה מלאכותית ובניית סוכנים חכמים
        `,
        tools: [getPdf, getProjectsTool, getSkillsTool],
      });
      const realtimeSession = new RealtimeSession(agent, {
        model: "gpt-realtime-preview",
        config: {
          inputAudioFormat: "pcm16",
          outputAudioFormat: "pcm16",
          inputAudioTranscription: {
            model: "gpt-4o-mini-transcribe",
          },
          turnDetection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      });
      await realtimeSession.connect({ apiKey: clientSecret });
      realtimeSession.sendMessage("מי אתה ומה אתה עושה?");
      realtimeSession.on("history_updated", (history) => {
        setMessageHistory(history as MessageItem[]);
      });
      realtimeSession.on("agent_tool_start", () => {
        setIsTooling(true);
      });
      realtimeSession.on("agent_tool_end", () => {
        setTimeout(() => setIsTooling(false), 2000);
      });
      realtimeSession.on("agent_start", () => {
        setIsThinking(true);
      });
      realtimeSession.on("agent_end", () => {
        setIsThinking(false);
      });
      sessionRef.current = realtimeSession;
      setSession(realtimeSession);
    } catch (err) {
      console.error("Failed to connect", err);
    } finally {
      setConnecting(false);
    }
  };

  const stop = () => {
    if (!sessionRef.current) return;
    sessionRef.current.close();
    setMessageHistory(undefined);
    sessionRef.current = null;
    setSession(null);
  };

  useEffect(() => {
    return () => {
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isListening = session && !isThinking;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        className="fixed right-5 bottom-5 z-80 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white shadow-lg shadow-blue-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="text-lg">✨</span>
        <span className="text-sm font-semibold">
          {open ? "Close" : "Ask AI"}
        </span>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-50 h-[calc(100dvh)] w-[92vw] max-w-md border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="AI chat panel"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600" />
            <div>
              <div className="text-sm font-semibold text-white">
                Eldad&apos;s AI Assistant
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stop();
              setOpen(false);
            }}
            aria-label="Close panel"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <ChatWindow />
        <div className=" bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/90 backdrop-blur-sm p-2">
          <div className="flex justify-center  items-center gap-4">
            {/* Status Text */}
            <div className="text-sm font-medium text-white/80 h-2 flex items-center">
              {connecting ? (
                <>
                  Connecting
                  <AnimatedDots />
                </>
              ) : session && !isThinking ? (
                <>
                  Listening
                  <AnimatedDots />
                </>
              ) : isThinking ? (
                isTooling ? (
                  <>
                    Looking that up
                    <AnimatedDots />
                  </>
                ) : (
                  <>
                    Let me think
                    <AnimatedDots />
                  </>
                )
              ) : (
                "Tap the mic to start"
                // ""
              )}
            </div>

            {/* Waveform (visible when listening) */}
            <div className="h-2 flex items-center justify-center">
              {isListening && <AudioWaveform />}
            </div>

            {/* Large Mic Button */}
            <div className="flex items-center gap-4">
              {session ? (
                <button
                  type="button"
                  onClick={stop}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-gradient-to-r from-red-500 to-red-600 animate-mic-pulse"
                      : "bg-gradient-to-r from-orange-500 to-orange-600"
                  } shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95`}
                  aria-label="Stop voice chat"
                >
                  <Square size={16} className="text-white" fill="white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connect}
                  disabled={connecting}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    connecting ? "" : "hover:shadow-blue-500/50"
                  }`}
                  aria-label="Start voice chat"
                >
                  {connecting ? (
                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mic size={32} className="text-white" />
                  )}
                </button>
              )}
            </div>

            {/* Helper text */}
            <p className="text-xs text-white/40 text-center">
              {session
                ? "Speak clearly • Press stop when done"
                : "Voice chat with AI assistant"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
  // return (
  //   <>
  //     {/* Floating button */}
  //     <button
  //       type="button"
  //       onClick={() => setOpen((v) => !v)}
  //       aria-label={open ? "Close AI chat" : "Open AI chat"}
  //       className="fixed right-5 bottom-5 z-80 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white shadow-lg shadow-blue-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
  //     >
  //       <span className="text-lg">✨</span>
  //       <span className="text-sm font-semibold">
  //         {open ? "Close" : "Ask AI"}
  //       </span>
  //     </button>

  //     {/* Backdrop */}
  //     <div
  //       className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
  //         open
  //           ? "opacity-100 pointer-events-auto"
  //           : "opacity-0 pointer-events-none"
  //       }`}
  //     />

  //     {/* Slide-in panel */}
  //     <div
  //       ref={panelRef}
  //       className={`fixed right-0 top-0 z-50 h-[calc(100dvh)] w-[92vw] max-w-md border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${
  //         open ? "translate-x-0" : "translate-x-full"
  //       }`}
  //       role="dialog"
  //       aria-modal="true"
  //       aria-label="AI chat panel"
  //     >
  //       <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
  //         <div className="flex items-center gap-2">
  //           <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600" />
  //           <div>
  //             <div className="text-sm font-semibold text-white">
  //               Eldad&apos;s AI Assistant
  //             </div>
  //           </div>
  //         </div>
  //         <button
  //           type="button"
  //           onClick={() => {
  //             stop();
  //             setOpen(false);
  //           }}
  //           aria-label="Close panel"
  //           className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
  //         >
  //           <X size={20} />
  //         </button>
  //       </div>

  //       {/* Messages */}

  //       <div className="h-[calc(100dvh-280px)] overflow-y-auto px-4 py-4">
  //         <div className="space-y-3">
  //           {messageHistory &&
  //             messageHistory.length > 0 &&
  //             messageHistory
  //               ?.filter((ms) => ms.type === "message")
  //               .map((m: MessageItem, index: number) => {
  //                 const text =
  //                   m?.content?.find((c) => c.transcript)?.transcript ?? "";
  //                 return (
  //                   text && (
  //                     <div
  //                       key={m.itemId || `${m.role}-${index}`}
  //                       dir="auto"
  //                       className={[
  //                         "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
  //                         m.role === "user"
  //                           ? "ml-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-600/15"
  //                           : "bg-white/10 text-white/90",
  //                       ].join(" ")}
  //                     >
  //                       {text}
  //                     </div>
  //                   )
  //                 );
  //               })}
  //           <div ref={messagesEndRef} />
  //         </div>
  //       </div>

  //       {/* Voice Control Section */}

  //       <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/90 backdrop-blur-sm p-6">
  //         <div className="flex flex-col items-center gap-4">
  //           {/* Status Text */}
  //           <div className="text-sm font-medium text-white/80 h-6 flex items-center">
  //             {connecting ? (
  //               <>
  //                 Connecting
  //                 <AnimatedDots />
  //               </>
  //             ) : session && !isThinking ? (
  //               <>
  //                 Listening
  //                 <AnimatedDots />
  //               </>
  //             ) : isThinking ? (
  //               isTooling ? (
  //                 <>
  //                   Looking that up
  //                   <AnimatedDots />
  //                 </>
  //               ) : (
  //                 <>
  //                   Let me think
  //                   <AnimatedDots />
  //                 </>
  //               )
  //             ) : (
  //               "Tap the mic to start"
  //               // ""
  //             )}
  //           </div>

  //           {/* Waveform (visible when listening) */}
  //           <div className="h-8 flex items-center justify-center">
  //             {isListening && <AudioWaveform />}
  //           </div>

  //           {/* Large Mic Button */}
  //           <div className="flex items-center gap-4">

  //             {session ? (
  //               <button
  //                 type="button"
  //                 onClick={stop}
  //                 className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
  //                   isListening
  //                     ? "bg-gradient-to-r from-red-500 to-red-600 animate-mic-pulse"
  //                     : "bg-gradient-to-r from-orange-500 to-orange-600"
  //                 } shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95`}
  //                 aria-label="Stop voice chat"
  //               >
  //                 <Square size={32} className="text-white" fill="white" />
  //               </button>
  //             ) : (
  //               <button
  //                 type="button"
  //                 onClick={connect}
  //                 disabled={connecting}
  //                 className={`relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
  //                   connecting ? "" : "hover:shadow-blue-500/50"
  //                 }`}
  //                 aria-label="Start voice chat"
  //               >
  //                 {connecting ? (
  //                   <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
  //                 ) : (
  //                   <Mic size={32} className="text-white" />
  //                 )}
  //               </button>
  //             )}
  //           </div>

  //           {/* Helper text */}
  //           <p className="text-xs text-white/40 text-center">
  //             {session
  //               ? "Speak clearly • Press stop when done"
  //               : "Voice chat with AI assistant"}
  //           </p>
  //         </div>
  //       </div>

  //     </div>
  //   </>
  // );
}
