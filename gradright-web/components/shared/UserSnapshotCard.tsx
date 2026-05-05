"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel";
import { GlassCard } from "@/components/shell/GlassCard";
import { CountUp } from "@/components/shell/CountUp";
import { buttonVariants } from "@/components/ui/button";
import type { WowTrustSnapshot } from "@/lib/trust-layer/wow-trust-snapshot";
import { cn } from "@/lib/utils";

type UserSnapshotCardProps = {
  snapshot: WowTrustSnapshot;
  className?: string;
  /** When false, hides the Explore CTA (e.g. on Explore itself). */
  showExploreLink?: boolean;
};

export function UserSnapshotCard({
  snapshot,
  className,
  showExploreLink = true,
}: UserSnapshotCardProps) {
  const [open, setOpen] = useState(false);

  if (!snapshot.ready) {
    return (
      <GlassCard
        className={cn(
          "relative overflow-hidden border-brand-primary/30 bg-gradient-to-br from-brand-primary/12 via-card to-violet-500/8 p-5 shadow-md md:p-6",
          className
        )}
      >
        <div className="flex flex-wrap items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-md">
            <Sparkles className="size-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
              Your snapshot
            </p>
            <h2 className="font-heading text-lg font-bold text-foreground md:text-xl">
              Complete your profile to unlock your personalized plan
            </h2>
            <p className="text-sm text-muted-foreground">{snapshot.supportingLine}</p>
            <Link
              href="/dashboard/score-upgrade"
              prefetch
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "mt-1 inline-flex rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95"
              )}
            >
              Finish profile intelligence
            </Link>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className={cn(
        "relative overflow-hidden border-brand-primary/25 bg-gradient-to-br from-brand-primary/14 via-card to-violet-500/10 p-5 shadow-lg md:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-24 hidden h-48 w-48 rounded-full bg-brand-secondary/15 blur-3xl md:block" />
      <div className="relative z-[1] space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-md">
            <Sparkles className="size-6 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
              You in 10 seconds
            </p>
            <h2 className="font-heading text-lg font-bold leading-snug text-foreground md:text-xl">
              {snapshot.identityLine}
            </h2>
            <p className="text-sm font-medium text-foreground/90">{snapshot.supportingLine}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Admission confidence
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-brand-primary tabular-nums">
              <CountUp to={snapshot.admissionConfidencePct} />%
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Loan approval confidence
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-brand-secondary tabular-nums">
              <CountUp to={snapshot.loanConfidencePct} />%
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Career success probability
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-foreground tabular-nums">
              <CountUp to={snapshot.careerSuccessPct} />%
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-foreground">
          <span className="font-semibold text-amber-900 dark:text-amber-100">What if you delay? </span>
          {snapshot.delayNarrative}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Best path for you (top 3)
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-background shadow-md hover:bg-foreground/90"
            )}
            aria-expanded={open}
          >
            Show my best path
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </div>

        <ol className="list-decimal space-y-2 pl-5 text-sm font-medium text-foreground">
          {snapshot.bestPathSteps.map((s, i) => (
            <li key={i} className="leading-snug">
              {s}
            </li>
          ))}
        </ol>

        {open ? (
          <div className="space-y-4 border-t border-border/60 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <ExplainabilityPanel
              whyRecommended={snapshot.explainWhy}
              whatCouldGoWrong={snapshot.explainRisk}
              whatToDoNext={snapshot.explainNext}
            />
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {snapshot.expandedPlanText}
            </div>
            <div className="flex flex-wrap gap-2">
              {showExploreLink ? (
                <Link
                  href="/explore"
                  prefetch
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
                >
                  Open Explore
                </Link>
              ) : null}
              <Link
                href="/funding"
                prefetch
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                Funding
              </Link>
              <Link
                href="/career/navigator"
                prefetch
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-xl")}
              >
                Navigator
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
