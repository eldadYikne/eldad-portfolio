"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

type ChatMessage = {
  isUser: boolean;
  text: string;
  sources?: string[];
};

const ChatWindow = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [streamingSources, setStreamingSources] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!prompt.trim() || isLoading) return;

    // Cancel any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    const userMessage = prompt;
    setPrompt("");
    setStreamingText("");
    setStreamingSources([]);

    setMessages((prev) => [...prev, { isUser: true, text: userMessage }]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, stream: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullText = "";
      let sources: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "sources") {
                sources = data.sources;
                setStreamingSources(sources);
              } else if (data.type === "chunk") {
                fullText += data.content;
                setStreamingText(fullText);
              } else if (data.type === "done") {
                // Add the complete message to history
                setMessages((prev) => [
                  ...prev,
                  { isUser: false, text: fullText, sources },
                ]);
                setStreamingText("");
                setStreamingSources([]);
              } else if (data.type === "error") {
                setMessages((prev) => [
                  ...prev,
                  { isUser: false, text: `Error: ${data.error}` },
                ]);
                setStreamingText("");
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { isUser: false, text: "Failed to get response. Please try again." },
        ]);
        setStreamingText("");
      }
    }

    setIsLoading(false);
    abortControllerRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !streamingText && (
          <div className="text-center text-white/50 py-8">
            <p className="text-lg font-medium">Ask me anything about Eldad</p>
            <p className="text-sm mt-2">
              I can help with information from his CV and profile
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessageItem key={index} message={message} />
        ))}

        {/* Streaming message */}
        {streamingText && (
          <div
            dir="auto"
            className="max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap bg-white/10 text-white/90"
          >
            <p>{streamingText}</p>
            {streamingSources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/50">
                Sources: {[...new Set(streamingSources)].join(", ")}
              </div>
            )}
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex items-center gap-2 text-white/60 px-4 py-3">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-4 bg-zinc-950/90">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            dir="auto"
            className="flex-1 h-11 rounded-xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-purple-500/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/15 hover:opacity-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const ChatMessageItem = ({ message }: { message: ChatMessage }) => {
  return (
    <div
      dir="auto"
      className={[
        "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
        message.isUser
          ? "ml-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-600/15"
          : "bg-white/10 text-white/90",
      ].join(" ")}
    >
      <p>{message.text}</p>
      {message.sources && message.sources.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/50">
          Sources: {[...new Set(message.sources)].join(", ")}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
