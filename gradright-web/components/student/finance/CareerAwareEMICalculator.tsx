"use client";

import {
  calculateEMIComfortZone,
  formatSalaryBand,
} from "@/lib/utils/calculations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TENURES = [84, 120, 144] as const;

export function CareerAwareEMICalculator({
  salaryBandLowLpa,
  salaryBandHighLpa,
  loanLakh,
  tenureMonths,
  onLoanLakhChange,
  onTenureMonthsChange,
  disabled,
}: {
  salaryBandLowLpa: number;
  salaryBandHighLpa: number;
  loanLakh: number;
  tenureMonths: number;
  onLoanLakhChange: (lakhs: number) => void;
  onTenureMonthsChange: (months: number) => void;
  disabled?: boolean;
}) {
  const loanInr = loanLakh * 100_000;
  const zone = calculateEMIComfortZone(
    salaryBandLowLpa,
    salaryBandHighLpa,
    loanInr,
    tenureMonths
  );

  const pctHigh = zone.emi_pct_at_high_salary;
  const comfortStyles =
    pctHigh <= 25
      ? {
          bar: "bg-emerald-500",
          text: "text-emerald-700 dark:text-emerald-300",
          label: "Comfortable range",
        }
      : pctHigh <= 40
        ? {
            bar: "bg-amber-500",
            text: "text-amber-800 dark:text-amber-200",
            label: "Worth planning carefully",
          }
        : {
            bar: "bg-rose-500",
            text: "text-rose-800 dark:text-rose-200",
            label: "Stressful at the high end of your band",
          };

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Career-aware EMI</CardTitle>
        <CardDescription>
          Tied to your latest predicted salary band (take-home assumed at 78% of
          salary).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Loan amount</span>
            <span className="font-medium text-foreground">
              ₹{loanLakh}L
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            step={1}
            value={loanLakh}
            disabled={disabled}
            onChange={(e) => onLoanLakhChange(Number(e.target.value))}
            className="w-full accent-primary disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹5L</span>
            <span>₹80L</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Tenure (months)</span>
          <div className="flex flex-wrap gap-2">
            {TENURES.map((m) => (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => onTenureMonthsChange(m)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  tenureMonths === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {m} mo
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Monthly EMI
          </p>
          <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-foreground">
            ₹{new Intl.NumberFormat("en-IN").format(zone.emi_monthly)}
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">
            At your predicted salary of{" "}
            {formatSalaryBand(salaryBandLowLpa, salaryBandHighLpa)}, this EMI is{" "}
            <span className={cn("font-semibold", comfortStyles.text)}>
              {pctHigh}% of take-home
            </span>{" "}
            at the high end of your band (and {zone.emi_pct_at_low_salary}% at
            the low end).
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", comfortStyles.bar)}
              style={{ width: `${Math.min(100, pctHigh)}%` }}
            />
          </div>
          <p className={cn("mt-2 text-xs font-medium", comfortStyles.text)}>
            {comfortStyles.label} — illustrative rate 11.5% p.a.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
