import type { RiskScore } from "@/lib/types";
import {
  calculateEMIComfortZone,
  formatLoanAmount,
} from "@/lib/utils/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EMIComfortZone({
  score,
  loanAmountINR,
}: {
  score: RiskScore;
  loanAmountINR: number;
}) {
  const zone = calculateEMIComfortZone(
    score.salary_band_low_lpa,
    score.salary_band_high_lpa,
    loanAmountINR
  );

  const labelStyles = {
    comfortable: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    moderate: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    high_stress: "bg-rose-500/15 text-rose-800 dark:text-rose-200",
  } as const;

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">EMI comfort zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        <p className="text-muted-foreground">
          At a reference loan of{" "}
          <span className="font-medium text-foreground">
            {formatLoanAmount(loanAmountINR)}
          </span>{" "}
          (10-year term, 11.5% illustrative rate), monthly EMI is roughly{" "}
          <span className="font-medium text-foreground">
            ₹{new Intl.NumberFormat("en-IN").format(zone.emi_monthly)}/mo
          </span>
          — about{" "}
          <span className="font-medium text-foreground">
            {zone.emi_pct_at_low_salary}%
          </span>{" "}
          of take-home at the low end of your band and{" "}
          <span className="font-medium text-foreground">
            {zone.emi_pct_at_high_salary}%
          </span>{" "}
          at the high end (78% take-home assumption).
        </p>
        <div
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
            labelStyles[zone.comfort_label]
          )}
        >
          {zone.comfort_label.replace("_", " ")}
        </div>
      </CardContent>
    </Card>
  );
}
