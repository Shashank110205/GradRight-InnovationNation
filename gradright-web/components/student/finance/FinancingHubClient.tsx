"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAwardXP } from "@/hooks/useAwardXP";

import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import type { LoanEligibilityEstimate, StudentProfile } from "@/lib/types";

import { CareerAwareEMICalculator } from "./CareerAwareEMICalculator";
import { FinancialLiteracyAccordion } from "./FinancialLiteracyAccordion";
import { LoanEligibilityEstimator } from "./LoanEligibilityEstimator";
import { ParentSummaryExport } from "./ParentSummaryExport";

function clampLakh(loanInr: number): number {
  const lakhs = Math.round(loanInr / 100_000);
  return Math.min(80, Math.max(5, lakhs));
}

export function FinancingHubClient({
  displayName,
  profile,
  risk,
  defaultLoanInr,
  estimatedProgramCostInr,
  initialEligibility,
  initialFamilyIncome,
}: {
  displayName: string;
  profile: StudentProfile;
  risk: LatestRiskScoreSummary | null;
  defaultLoanInr: number;
  estimatedProgramCostInr: number;
  initialEligibility: LoanEligibilityEstimate | null;
  initialFamilyIncome: number;
}) {
  const { mutate: awardXP } = useAwardXP();
  const financingVisitXpRef = useRef(false);
  const [loanLakh, setLoanLakh] = useState(() => clampLakh(defaultLoanInr));
  const [tenureMonths, setTenureMonths] = useState(120);

  useEffect(() => {
    if (financingVisitXpRef.current) return;
    financingVisitXpRef.current = true;
    awardXP("financing_first_view");
  }, [awardXP]);

  const loanAmountInr = loanLakh * 100_000;
  const targetCountry = profile.target_country?.trim() || "your target country";
  const programHint =
    [profile.degree_type, profile.broad_field].filter(Boolean).join(" · ") ||
    "your program";

  const illustrativeCopy = useMemo(() => {
    if (!risk) {
      return "Run your career assessment to unlock salary-linked estimates.";
    }
    return `Example starting point: ₹${new Intl.NumberFormat("en-IN").format(initialFamilyIncome)} yearly family income, no collateral, loan ₹${new Intl.NumberFormat("en-IN").format(defaultLoanInr)}. Edit and tap “Update estimate”.`;
  }, [risk, initialFamilyIncome, defaultLoanInr]);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Target country
          </p>
          <p className="mt-1 font-medium text-foreground">{targetCountry}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Program focus
          </p>
          <p className="mt-1 font-medium text-foreground">{programHint}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Planning loan
          </p>
          <p className="mt-1 font-medium text-foreground">
            ₹{new Intl.NumberFormat("en-IN").format(loanAmountInr)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LoanEligibilityEstimator
          hasRiskScore={risk != null}
          defaultLoanInr={defaultLoanInr}
          initialEstimate={initialEligibility}
          initialFamilyIncome={initialFamilyIncome}
          illustrativeCopy={illustrativeCopy}
        />

        {risk ? (
          <CareerAwareEMICalculator
            salaryBandLowLpa={risk.salary_band_low_lpa}
            salaryBandHighLpa={risk.salary_band_high_lpa}
            loanLakh={loanLakh}
            tenureMonths={tenureMonths}
            onLoanLakhChange={setLoanLakh}
            onTenureMonthsChange={setTenureMonths}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Salary outlook needed</p>
            <p className="mt-2">
              The EMI planner uses your predicted salary band from the career
              module. Open Career & placement to generate a score, then return
              here.
            </p>
          </div>
        )}
      </div>

      <FinancialLiteracyAccordion />

      <ParentSummaryExport
        displayName={displayName}
        profile={profile}
        risk={risk}
        loanAmountInr={loanAmountInr}
        tenureMonths={tenureMonths}
        estimatedTotalCostInr={estimatedProgramCostInr}
      />
    </div>
  );
}
