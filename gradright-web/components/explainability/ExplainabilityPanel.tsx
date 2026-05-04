"use client";

import { ChevronRight, HelpCircle, Lightbulb, MessageCircle, ShieldQuestion, Sparkles } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExplainabilityPanelProps = {
  /** Short label for the primary output, e.g. "Modeled admission chance" */
  resultLabel: string;
  /** One-line headline for the result */
  resultSummary: string;
  whyPoints: readonly string[];
  improvePoints: readonly string[];
  nextStepHref: string;
  nextStepLabel: string;
  /** Prefilled user message when opening mentor */
  askExplainSeed: string;
  askChallengeSeed: string;
  className?: string;
};

export function ExplainabilityPanel({
  resultLabel,
  resultSummary,
  whyPoints,
  improvePoints,
  nextStepHref,
  nextStepLabel,
  askExplainSeed,
  askChallengeSeed,
  className,
}: ExplainabilityPanelProps) {
  function openMentorWith(text: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent<{ text: string }>("gr-mentor-prefill", {
        detail: { text },
      })
    );
    window.dispatchEvent(new Event("gr-open-mentor"));
  }

  return (
    <GlassCard
      className={cn(
        "border-brand-primary/20 bg-gradient-to-br from-card via-card to-brand-primary/5 p-5 sm:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-primary">
          <ShieldQuestion className="size-3.5" aria-hidden />
          Explainability
        </span>
        <span className="text-xs text-muted-foreground">{resultLabel}</span>
      </div>
      <p className="mt-3 font-heading text-lg font-semibold text-foreground">{resultSummary}</p>

      <ol className="mt-6 grid gap-4 text-sm md:grid-cols-2">
        <li>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <HelpCircle className="size-3.5 text-brand-primary" aria-hidden />
            Why this result?
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
            {whyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </li>
        <li>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="size-3.5 text-brand-secondary" aria-hidden />
            What improves this?
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
            {improvePoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </li>
      </ol>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => openMentorWith(askExplainSeed)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 gap-2 rounded-xl border-brand-primary/30 bg-background/80"
          )}
        >
          <MessageCircle className="size-4" aria-hidden />
          Ask AI to explain
        </button>
        <button
          type="button"
          onClick={() => openMentorWith(askChallengeSeed)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 gap-2 rounded-xl border-border bg-background/80"
          )}
        >
          <Sparkles className="size-4" aria-hidden />
          Ask AI to challenge
        </button>
        <Link
          href={nextStepHref}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-10 gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95"
          )}
        >
          {nextStepLabel}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </GlassCard>
  );
}
