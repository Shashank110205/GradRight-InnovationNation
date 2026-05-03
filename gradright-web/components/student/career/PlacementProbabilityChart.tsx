"use client";

import type { RiskScore } from "@/lib/types";

function pct(v: number): number {
  return Math.round(v * 100);
}

export function PlacementProbabilityChart({ score }: { score: RiskScore }) {
  const items = [
    { label: "3 months", value: pct(score.placement_prob_3m) },
    { label: "6 months", value: pct(score.placement_prob_6m) },
    { label: "12 months", value: pct(score.placement_prob_12m) },
  ];
  const max = 100;

  return (
    <div className="flex h-52 items-end justify-center gap-3 sm:gap-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex w-full max-w-[100px] flex-col items-center gap-2"
        >
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {item.value}%
          </span>
          <div className="flex h-36 w-full items-end overflow-hidden rounded-t-lg bg-muted">
            <div
              className="w-full rounded-t-lg bg-primary transition-[height] duration-500"
              style={{
                height: `${Math.min(100, (item.value / max) * 100)}%`,
                minHeight: item.value > 0 ? "4px" : 0,
              }}
              title={`${item.label}: ${item.value}%`}
            />
          </div>
          <span className="text-center text-[11px] text-muted-foreground">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
