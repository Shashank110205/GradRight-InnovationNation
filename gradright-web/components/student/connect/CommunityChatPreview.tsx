"use client";

import { MessageCircle } from "lucide-react";

import { GlassCard } from "@/components/shell/GlassCard";

type ChatLine = { who: string; text: string; highlight?: boolean };

const THREADS: { id: string; label: string; messages: ChatLine[] }[] = [
  {
    id: "1",
    label: "Mumbai → Ireland · Fall 2026",
    messages: [
      { who: "Aisha", text: "Has anyone staggered deposit vs visa proof for Dublin admits?" },
      {
        who: "Community guide",
        text: "Start with the program’s deposit policy, then line up bank statements the consulate already likes—keep the story consistent across SOP and funds.",
        highlight: true,
      },
    ],
  },
  {
    id: "2",
    label: "US · CS · scholarship-first",
    messages: [
      { who: "Jordan", text: "Worth sending a funding appeal before the April wave if LORs are still the same?" },
      {
        who: "Rahul",
        text: "Only if you have one new signal—internship, paper, or stronger test. Keep the note under 180 words and attach one proof point.",
      },
    ],
  },
];

export function CommunityChatPreview() {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 text-brand-primary">
        <MessageCircle className="h-5 w-5" aria-hidden />
        <h2 className="font-heading text-lg font-semibold text-foreground">Community conversations</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Preview threads — calm, specific, outcome-linked. Live groups roll out next; for now, rehearse
        questions here and bring them to your mentor.
      </p>
      <div className="mt-6 space-y-6">
        {THREADS.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary">{t.label}</p>
            <div className="mt-4 space-y-3">
              {t.messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.highlight === true
                      ? "rounded-xl border border-brand-primary/25 bg-brand-primary/8 px-3 py-2.5 text-sm text-foreground"
                      : "rounded-xl bg-background/80 px-3 py-2.5 text-sm text-muted-foreground"
                  }
                >
                  <span className="font-semibold text-foreground">{m.who}:</span> {m.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
