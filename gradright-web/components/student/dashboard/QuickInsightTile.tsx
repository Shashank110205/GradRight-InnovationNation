import { TrendingUp } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";

export function QuickInsightTile({
  risk,
}: {
  risk: LatestRiskScoreSummary | null;
}) {
  const label = risk?.risk_label ?? null;
  const prob = risk != null ? Math.round(risk.placement_prob_6m * 100) : null;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-brand-secondary" aria-hidden />
        <h3 className="text-sm font-semibold">Quick insight</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {label ? (
          <>
            Your latest placement outlook band is{" "}
            <span className="font-medium capitalize text-foreground">{label}</span>
            {prob != null ? (
              <>
                {" "}
                with about <span className="font-medium text-foreground">{prob}%</span>{" "}
                placement probability at six months in the current snapshot.
              </>
            ) : (
              "."
            )}
          </>
        ) : (
          "Complete onboarding to generate your first risk snapshot and insight."
        )}
      </p>
      {risk?.ai_summary ? (
        <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
          {risk.ai_summary}
        </p>
      ) : null}
      <div className="mt-auto pt-4">
        <Link
          href="/onboarding"
          prefetch
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          Refine profile
        </Link>
      </div>
    </section>
  );
}
