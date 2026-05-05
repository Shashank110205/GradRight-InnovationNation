"use client";

import { AlertTriangle, ArrowRight, Lightbulb, MessageCircle } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Explore / WOW: three-block explainability. */
export type ExploreExplainabilityProps = {
  variant?: "explore";
  title?: string;
  whyRecommended: string;
  whatCouldGoWrong: string;
  whatToDoNext: string;
  className?: string;
};

/** Admission predictor legacy layout (unchanged contract). */
export type AdmissionExplainabilityProps = {
  variant: "admission";
  resultLabel: string;
  resultSummary: string;
  whyPoints: string[];
  improvePoints: string[];
  nextStepHref: string;
  nextStepLabel: string;
  askExplainSeed: string;
  askChallengeSeed: string;
  className?: string;
};

export type ExplainabilityPanelProps =
  | ExploreExplainabilityProps
  | AdmissionExplainabilityProps;

function openMentorPrefill(text: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("gr-mentor-prefill", { detail: { text } }));
}

export function ExplainabilityPanel(props: ExplainabilityPanelProps) {
  if (props.variant === "admission") {
    return (
      <GlassCard
        className={cn(
          "space-y-4 border-brand-primary/20 bg-gradient-to-br from-brand-primary/8 via-card to-transparent p-5",
          props.className
        )}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-pink">
            {props.resultLabel}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{props.resultSummary}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Why this read</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
              {props.whyPoints.map((p, i) => (
                <li key={`why-${i}`}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">What could shift it</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
              {props.improvePoints.map((p, i) => (
                <li key={`im-${i}`}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={props.nextStepHref}
            prefetch
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-xl")}
          >
            {props.nextStepLabel}
          </Link>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl"
            )}
            onClick={() => openMentorPrefill(props.askExplainSeed)}
          >
            <MessageCircle className="mr-2 inline size-4" aria-hidden />
            Ask mentor to explain
          </button>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl"
            )}
            onClick={() => openMentorPrefill(props.askChallengeSeed)}
          >
            Challenge assumptions
          </button>
        </div>
      </GlassCard>
    );
  }

  const title = props.title ?? "Why this is on your Explore map";
  return (
    <GlassCard
      className={cn(
        "space-y-3 border-brand-primary/20 bg-gradient-to-br from-brand-primary/6 via-card to-transparent p-4 text-sm",
        props.className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-pink">
        Explainability
      </p>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{props.whyRecommended}</p>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border/50 pt-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-foreground">What could go wrong</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {props.whatCouldGoWrong}
            </p>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border/50 pt-2">
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand-secondary" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-foreground">What you should do next</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{props.whatToDoNext}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
