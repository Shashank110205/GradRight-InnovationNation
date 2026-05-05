"use client";

import { MessageCircle, Users } from "lucide-react";
import { useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";

type ChatLine = { who: string; text: string; ts: string; mine?: boolean };

const THREADS: { id: string; label: string; members: string; messages: ChatLine[] }[] = [
  {
    id: "1",
    label: "US CS Applicants · Fall 2026",
    members: "128 members",
    messages: [
      {
        who: "Aisha",
        text: "Anyone here done a scholarship reconsideration email after admit?",
        ts: "09:12",
      },
      {
        who: "Rohan",
        text: "Yes. Keep it under 200 words and add one new achievement proof.",
        ts: "09:13",
      },
      {
        who: "You",
        text: "Super helpful. I will attach my internship conversion letter too.",
        ts: "09:14",
        mine: true,
      },
    ],
  },
  {
    id: "2",
    label: "Germany + EU Peer Circle",
    members: "94 members",
    messages: [
      {
        who: "Noor",
        text: "Blocked on APS + visa slot timing. Any sequence that worked for you?",
        ts: "10:21",
      },
      {
        who: "Prateek",
        text: "I booked APS first, then prepared financial docs in parallel. Saved 3 weeks.",
        ts: "10:23",
      },
      {
        who: "You",
        text: "Can someone share a checklist for first month living setup?",
        ts: "10:25",
        mine: true,
      },
    ],
  },
  {
    id: "3",
    label: "MBA Loans + ROI Group",
    members: "76 members",
    messages: [
      {
        who: "Megha",
        text: "How did you split loan vs family contribution without over-borrowing?",
        ts: "11:02",
      },
      {
        who: "Arjun",
        text: "I funded fixed costs via loan and kept 6 months EMI reserve from savings.",
        ts: "11:03",
      },
      {
        who: "You",
        text: "This is exactly what I needed. Thank you!",
        ts: "11:04",
        mine: true,
      },
    ],
  },
];

export function CommunityChatPreview() {
  const [activeId, setActiveId] = useState(THREADS[0]?.id ?? "1");
  const active = THREADS.find((t) => t.id === activeId) ?? THREADS[0];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 text-brand-primary">
        <MessageCircle className="h-5 w-5" aria-hidden />
        <h2 className="font-heading text-lg font-semibold text-foreground">Community chats</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        WhatsApp-style peer groups by interests: country, field, scholarships, and funding strategy.
        This preview is static and curated for focused student discussions.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/15 p-3">
          {THREADS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={
                t.id === active.id
                  ? "w-full rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-3 py-3 text-left"
                  : "w-full rounded-xl border border-transparent bg-background/70 px-3 py-3 text-left hover:border-border"
              }
            >
              <p className="text-sm font-semibold text-foreground">{t.label}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" /> {t.members}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
          <div className="mb-3 border-b border-border pb-3">
            <p className="font-semibold text-foreground">{active.label}</p>
            <p className="text-xs text-muted-foreground">{active.members}</p>
          </div>
          <div className="space-y-3">
            {active.messages.map((m, i) => (
              <div key={i} className={m.mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.mine
                      ? "max-w-[90%] rounded-2xl rounded-br-md bg-brand-primary px-3 py-2 text-sm text-white"
                      : "max-w-[90%] rounded-2xl rounded-bl-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                  }
                >
                  {!m.mine ? <p className="text-xs font-semibold text-brand-primary">{m.who}</p> : null}
                  <p>{m.text}</p>
                  <p className={m.mine ? "mt-1 text-right text-[10px] text-white/80" : "mt-1 text-right text-[10px] text-muted-foreground"}>
                    {m.ts}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            Type a question... (static demo)
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
