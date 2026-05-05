"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

type ChatMsg = { role: "user" | "assistant"; text: string };

export function NbfcChatbotToggle() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "NBFC assistant ready. Ask about candidate decisions, risk signals, or approval rationale.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    const query = input.trim();
    if (!query) return;
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/nbfc/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { candidate: string; explanation: string; recommended_action: string };
        error?: string;
      };
      if (!json.success || !json.data) {
        setMessages((prev) => [...prev, { role: "assistant", text: json.error ?? "Unable to answer right now." }]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `${json.data.candidate}: ${json.data.explanation} Next action: ${json.data.recommended_action}`,
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Explainability service unreachable." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[70] rounded-full bg-slate-900 p-3 text-white shadow-lg"
        aria-label="Open NBFC assistant"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
      {open ? (
        <div className="fixed bottom-20 right-5 z-[70] w-[360px] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-3 text-sm font-semibold dark:border-slate-700">NBFC Decision Assistant</div>
          <div className="max-h-72 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, idx) => (
              <div key={`${m.role}-${idx}`} className={m.role === "assistant" ? "rounded-lg bg-slate-100 p-2 dark:bg-slate-800" : "rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/40"}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void ask();
              }}
              placeholder="Why was Aarav approved?"
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={() => void ask()}
              disabled={loading}
              className="rounded bg-slate-900 px-3 py-1 text-white disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
