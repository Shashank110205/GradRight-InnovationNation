"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { MessageCircle, SendHorizontal, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { resolveMentorMode } from "@/lib/ai/mentor-mode";
import type { MentorMode } from "@/lib/ai/mentor-mode";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "gradright-dashboard-chat";
const MAX_MESSAGES = 50;

const STARTERS_BY_MODE: Record<
  MentorMode,
  readonly [string, string, string]
> = {
  dashboard: [
    "What are the next 2 moves I should make this week for my applications?",
    "How do I sanity-check visa timelines for my target country?",
    "What profile fields most improve prediction accuracy?",
  ],
  discover: [
    "What should I know about scholarships for my field before I shortlist schools?",
    "How do I read admissions requirements without getting overwhelmed?",
    "What myths about studying abroad should I ignore?",
  ],
  result: [
    "Explain what typically moves modeled admission chances up or down.",
    "Challenge my assumptions about my reach / match / safety list.",
    "What data would make this prediction more trustworthy?",
  ],
  profile: [
    "What’s the highest-impact field to deepen next on my profile?",
    "How should I talk about budget and parent comfort without awkwardness?",
    "What’s a good way to phrase my career ambition for applications?",
  ],
};

function mentorChrome(mode: MentorMode): {
  title: string;
  description: string;
  fabLabel: string;
  useDiscoverIcon: boolean;
} {
  if (mode === "discover") {
    return {
      title: "Discover AI",
      description:
        "Awareness-first answers: country fit, requirements myths, and roadmap questions.",
      fabLabel: "Open Discover AI",
      useDiscoverIcon: true,
    };
  }
  if (mode === "result") {
    return {
      title: "Result mentor",
      description:
        "Explain or challenge model outputs — plain language, no invented percentages.",
      fabLabel: "Open result mentor",
      useDiscoverIcon: false,
    };
  }
  if (mode === "profile") {
    return {
      title: "Profile mentor",
      description:
        "Short, adaptive questions to deepen your profile and sharpen predictions.",
      fabLabel: "Open profile mentor",
      useDiscoverIcon: false,
    };
  }
  return {
    title: "GradRight AI mentor",
    description:
      "Strategic guidance across your journey — funding stays optional until you’re ready.",
    fabLabel: "Open AI mentor",
    useDiscoverIcon: false,
  };
}

function textFromMessage(m: UIMessage): string {
  return m.parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && typeof (p as { text?: string }).text === "string"
    )
    .map((p) => p.text)
    .join("");
}

export function ChatbotToggle({ appUserId }: { appUserId: string }) {
  const pathname = usePathname();
  const mentorMode = resolveMentorMode(pathname);
  const chrome = mentorChrome(mentorMode);
  const starters = STARTERS_BY_MODE[mentorMode];

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            ...body,
            messages,
            user_id: appUserId,
            mentor_mode: mentorMode,
          },
        }),
      }),
    [appUserId, mentorMode]
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "gradright-dashboard",
    transport,
  });

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as UIMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-MAX_MESSAGES));
        }
      }
    } catch {
      /* ignore */
    }
    queueMicrotask(() => {
      setHydrated(true);
    });
  }, [setMessages]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
    } catch {
      /* ignore */
    }
  }, [hydrated, messages]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string }>).detail;
      if (detail?.text) setInput(detail.text);
      setOpen(true);
    };
    window.addEventListener("gr-open-mentor", onOpen);
    window.addEventListener("gr-mentor-prefill", onPrefill as EventListener);
    return () => {
      window.removeEventListener("gr-open-mentor", onOpen);
      window.removeEventListener("gr-mentor-prefill", onPrefill as EventListener);
    };
  }, []);

  const busy = status === "streaming" || status === "submitted";
  const FabIcon = chrome.useDiscoverIcon ? Sparkles : MessageCircle;

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        variant="default"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-40 size-14 rounded-full bg-brand-primary text-white shadow-elegant hover:bg-brand-primary/90 bottom-24 md:bottom-8 md:right-8"
        aria-label={chrome.fabLabel}
      >
        <FabIcon className="size-6" aria-hidden />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-6 py-4 text-left">
            <SheetTitle>{chrome.title}</SheetTitle>
            <SheetDescription>{chrome.description}</SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Try one of these:</p>
                  <div className="flex flex-col gap-2">
                    {starters.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={busy}
                        onClick={() => sendMessage({ text: s })}
                        className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((m) => {
                const text = textFromMessage(m);
                if (!text && m.role === "assistant") return null;
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={cn("flex", isUser ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        isUser
                          ? "bg-brand-primary text-white"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {text}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              className="flex gap-2 border-t border-border p-4"
              onSubmit={(e) => {
                e.preventDefault();
                const t = input.trim();
                if (!t || busy) return;
                sendMessage({ text: t });
                setInput("");
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message…"
                disabled={busy}
                className="flex-1"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                className="shrink-0 bg-brand-primary text-white hover:bg-brand-primary/90"
                aria-label="Send"
              >
                <SendHorizontal className="size-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
