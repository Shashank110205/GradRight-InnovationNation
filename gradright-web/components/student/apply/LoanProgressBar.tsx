"use client";

import { Progress } from "@/components/ui/progress";

const TOTAL_STEPS = 8;

export function LoanProgressBar({ currentStep }: { currentStep: number }) {
  const step = Math.min(Math.max(0, currentStep), TOTAL_STEPS - 1);
  const pct = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {step + 1} of {TOTAL_STEPS}
        </span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground">
        Saved automatically. Typical completion time: 8-12 minutes.
      </p>
    </div>
  );
}
