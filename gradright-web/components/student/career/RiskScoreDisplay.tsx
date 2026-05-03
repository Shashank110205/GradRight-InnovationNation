import type { RiskScore } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const labelBadge: Record<
  RiskScore["risk_label"],
  string
> = {
  low: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  medium: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
  high: "bg-rose-500/15 text-rose-900 dark:text-rose-100",
};

export function RiskScoreDisplay({
  score,
  paybackYears,
}: {
  score: RiskScore;
  /** Optional simple ROI payback from `calculateROI`. */
  paybackYears?: number;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-xl">
              Placement readiness score
            </CardTitle>
            <CardDescription>
              Rule-engine model {score.model_version} · updated{" "}
              {new Date(score.calculated_at).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </CardDescription>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold capitalize",
              labelBadge[score.risk_label]
            )}
          >
            {score.risk_label} risk
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-end gap-2">
          <p className="font-heading text-4xl font-bold tabular-nums text-foreground">
            {score.risk_score_raw}
          </p>
          <span className="pb-1.5 text-sm text-muted-foreground">/ 100</span>
        </div>
        {paybackYears != null && paybackYears > 0 ? (
          <p className="text-sm text-muted-foreground">
            Illustrative payback horizon (cost ÷ first-year salary at mid-band):
            ~{paybackYears} years at a reference exchange rate—use only as a
            planning anchor.
          </p>
        ) : null}
        {score.ai_summary ? (
          <p className="text-sm leading-relaxed text-foreground">
            {score.ai_summary}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
