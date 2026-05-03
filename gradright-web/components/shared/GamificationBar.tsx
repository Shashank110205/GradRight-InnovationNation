"use client";

import { Flame, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
} from "@/components/ui/progress";
import { getXpProgressPercent, getXpTierInfo } from "@/lib/dashboard/xp-levels";
import { cn } from "@/lib/utils";

type GamificationBarProps = {
  xpPoints: number;
  streakDays: number;
  badges: string[];
};

export function GamificationBar({ xpPoints, streakDays, badges }: GamificationBarProps) {
  const [open, setOpen] = useState(false);
  const tier = useMemo(() => getXpTierInfo(xpPoints), [xpPoints]);
  const pct = useMemo(() => getXpProgressPercent(xpPoints), [xpPoints]);
  const preview = badges.slice(0, 3);
  const showStreak = streakDays >= 3;

  return (
    <section className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Progress
        </p>
        <p className="mt-1 text-lg font-bold text-foreground">
          {tier.tierLabel}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            · {xpPoints} XP
          </span>
        </p>
        {tier.nextTierLabel ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Next: {tier.nextTierLabel}
            {tier.nextTierMin != null ? ` at ${tier.nextTierMin} XP` : null}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">Top tier unlocked.</p>
        )}
        <Progress value={pct} className="mt-3 w-full flex-col items-stretch gap-1">
          <div className="flex w-full items-center justify-between gap-2">
            <ProgressLabel className="text-xs text-muted-foreground">
              Tier progress
            </ProgressLabel>
            <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
          </div>
          <ProgressTrack className="h-2">
            <ProgressIndicator className="bg-brand-primary" />
          </ProgressTrack>
        </Progress>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showStreak ? (
          <div
            className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300"
            title="Active day streak"
          >
            <Flame className="size-4 text-amber-500" aria-hidden />
            {streakDays} day streak
          </div>
        ) : null}

        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex flex-wrap items-center gap-2">
            {preview.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                Complete tasks to earn badges.
              </span>
            ) : (
              preview.map((b) => (
                <span
                  key={b}
                  className={cn(
                    "rounded-full border border-brand-primary/25 bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary"
                  )}
                >
                  {b}
                </span>
              ))
            )}
            {badges.length > 0 ? (
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <Trophy className="size-3.5" aria-hidden />
                  All badges
                </button>
              </DialogTrigger>
            ) : null}
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your badges</DialogTitle>
              <DialogDescription>
                Unlocked from milestones and rewards across GradRight.
              </DialogDescription>
            </DialogHeader>
            {badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No badges yet — keep going.</p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
                {badges.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
                  >
                    <Trophy className="size-4 shrink-0 text-brand-accent" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
