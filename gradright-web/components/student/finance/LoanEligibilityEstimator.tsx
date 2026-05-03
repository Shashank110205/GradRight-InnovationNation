"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  APIResponse,
  LoanEligibilityApiPayload,
  LoanEligibilityEstimate,
} from "@/lib/types";
import type { LoanEligibilityPostBody } from "@/lib/validations/loan-eligibility";
import { formatLoanAmount } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";

function bandPillClass(band: LoanEligibilityEstimate["eligibility_band"]): string {
  switch (band) {
    case "likely":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "moderate":
      return "bg-amber-500/15 text-amber-900 dark:text-amber-100";
    case "unlikely":
      return "bg-rose-500/15 text-rose-900 dark:text-rose-100";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function bandLabel(band: LoanEligibilityEstimate["eligibility_band"]): string {
  switch (band) {
    case "likely":
      return "Likely band (illustrative)";
    case "moderate":
      return "Moderate band (illustrative)";
    case "unlikely":
      return "Unlikely band (illustrative)";
    default:
      return band;
  }
}

export function LoanEligibilityEstimator({
  hasRiskScore,
  defaultLoanInr,
  initialEstimate,
  initialFamilyIncome,
  illustrativeCopy,
}: {
  hasRiskScore: boolean;
  defaultLoanInr: number;
  initialEstimate: LoanEligibilityEstimate | null;
  initialFamilyIncome: number;
  illustrativeCopy: string;
}) {
  const [familyIncome, setFamilyIncome] = useState(String(initialFamilyIncome));
  const [collateral, setCollateral] = useState(false);
  const [coBorrower, setCoBorrower] =
    useState<LoanEligibilityPostBody["co_borrower_type"]>("none");
  const [loanAmount, setLoanAmount] = useState(String(Math.round(defaultLoanInr)));
  const [estimate, setEstimate] = useState<LoanEligibilityEstimate | null>(
    initialEstimate
  );
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasRiskScore) {
      setError("Run your career assessment first.");
      return;
    }

    const inc = Number(familyIncome.replace(/,/g, ""));
    const loan = Number(loanAmount.replace(/,/g, ""));
    if (!Number.isFinite(inc) || inc <= 0) {
      setError("Enter a valid annual family income.");
      return;
    }
    if (!Number.isFinite(loan) || loan <= 0) {
      setError("Enter a valid loan amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/finance/eligibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          family_income: inc,
          collateral_available: collateral,
          co_borrower_type: coBorrower,
          loan_amount_requested: loan,
        } satisfies LoanEligibilityPostBody),
      });
      const json = (await res.json()) as APIResponse<LoanEligibilityApiPayload>;
      if (!json.success || !json.data) {
        setError(json.error ?? "Could not estimate eligibility.");
        return;
      }
      setEstimate(json.data);
      setDisclaimer(json.data.disclaimer);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Loan eligibility estimator</CardTitle>
        <CardDescription>
          Non-binding band based on your inputs and your latest salary outlook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="text-xs text-muted-foreground">{illustrativeCopy}</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="family_income">Annual family income (₹)</Label>
            <Input
              id="family_income"
              inputMode="numeric"
              value={familyIncome}
              onChange={(e) => setFamilyIncome(e.target.value)}
              placeholder="e.g. 1200000"
              disabled={!hasRiskScore}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="collateral"
              checked={collateral}
              onCheckedChange={(v) => setCollateral(v === true)}
              disabled={!hasRiskScore}
            />
            <Label htmlFor="collateral" className="font-normal">
              We can offer collateral (property or similar)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="co_borrower">Co-borrower</Label>
            <select
              id="co_borrower"
              className={cn(
                "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm",
                !hasRiskScore && "cursor-not-allowed opacity-50"
              )}
              value={coBorrower}
              onChange={(e) =>
                setCoBorrower(e.target.value as LoanEligibilityPostBody["co_borrower_type"])
              }
              disabled={!hasRiskScore}
            >
              <option value="none">No co-borrower</option>
              <option value="parent">Parent / guardian</option>
              <option value="salaried_spouse">Working spouse</option>
              <option value="other_family">Other family member</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan_amount">Loan amount you have in mind (₹)</Label>
            <Input
              id="loan_amount"
              inputMode="numeric"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="e.g. 3500000"
              disabled={!hasRiskScore}
            />
          </div>

          <Button type="submit" disabled={!hasRiskScore || loading}>
            {loading ? "Estimating…" : "Update estimate"}
          </Button>
        </form>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {estimate ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Band:</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  bandPillClass(estimate.eligibility_band)
                )}
              >
                {bandLabel(estimate.eligibility_band)}
              </span>
            </div>
            <p>
              <span className="text-muted-foreground">Max suggested loan: </span>
              <span className="font-medium text-foreground">
                {formatLoanAmount(estimate.max_recommended_loan)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Comfort EMI range (monthly): </span>
              <span className="font-medium text-foreground">
                ₹{new Intl.NumberFormat("en-IN").format(Math.round(estimate.comfort_emi_range.low))}{" "}
                – ₹
                {new Intl.NumberFormat("en-IN").format(Math.round(estimate.comfort_emi_range.high))}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">EMI to income (rule-of-thumb): </span>
              <span className="font-medium text-foreground">
                {estimate.income_to_emi_ratio}%
              </span>
            </p>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground border border-border rounded-md p-3">
          {disclaimer ??
            "This is a non-binding estimate. Actual eligibility is determined by lender review."}
        </p>
      </CardContent>
    </Card>
  );
}
