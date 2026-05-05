"use client";

import Link from "next/link";

import { Lightbulb } from "lucide-react";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import type { FeatureEnrichProfile } from "@/lib/ui/enrich-feature-data";
import {
  type FeatureModuleView,
  normalizeFeatureModuleView,
} from "@/lib/ui/normalize-feature-module";
import { cn } from "@/lib/utils";

type YourInsightsSectionProps = {
  /** Raw `/api/features/*` data object. */
  data: Record<string, unknown> | null | undefined;
  /** Optional profile overlay (e.g. from dashboard context) — merged with hub-derived signals. */
  profile?: FeatureEnrichProfile | null;
  className?: string;
};

export function YourInsightsSection({ data, profile, className }: YourInsightsSectionProps) {
  const v: FeatureModuleView = normalizeFeatureModuleView(data ?? undefined, profile ?? undefined);

  return (
    <GlassCard className={cn("space-y-6 p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <Lightbulb className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Your Insights</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Based on your profile, here&apos;s what matters most right now.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/score-upgrade"
          prefetch
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 rounded-xl")}
        >
          Improve My Profile
        </Link>
      </div>

      {/* 1. Summary */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Summary
        </p>
        <p className="mt-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground">
          {v.summary}
        </p>
      </div>

      {/* 2. Insights */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Insights
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
          {v.insights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {/* 3. Reasons */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Reasons
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {v.reasons.map((line, i) => (
            <li key={i} className="border-l-2 border-brand-primary/35 pl-3">
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Actions (highlighted) */}
      <div className="rounded-2xl border-2 border-brand-primary/35 bg-brand-primary/5 px-4 py-4 shadow-inner">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
          Actions
        </p>
        <ul className="mt-3 space-y-2 text-sm font-medium text-foreground">
          {v.actions.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Metrics */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Metrics
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {v.metrics.length ? (
            v.metrics.map((m, i) => (
              <span
                key={`${m.label}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground"
              >
                <span className="text-muted-foreground">{m.label}:</span>
                {m.value}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              Metrics appear as your profile and scores populate — update Improve Profile to reveal more.
            </span>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <Link
          href="/dashboard/score-upgrade"
          prefetch
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-xl")}
        >
          Improve My Profile
        </Link>
        <Link
          href="/plan/admission"
          prefetch
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
        >
          See My Chances
        </Link>
      </div>
    </GlassCard>
  );
}
