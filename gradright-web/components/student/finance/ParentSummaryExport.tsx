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
import type { StudentProfile } from "@/lib/types";
import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import { generateParentSummaryPDF } from "@/lib/utils/pdf-export";
import { joinTargetCountries, parseTargetCountries } from "@/lib/types";

export function ParentSummaryExport({
  displayName,
  profile,
  risk,
  loanAmountInr,
  tenureMonths,
  estimatedTotalCostInr,
}: {
  displayName: string;
  profile: StudentProfile;
  risk: LatestRiskScoreSummary | null;
  loanAmountInr: number;
  tenureMonths: number;
  estimatedTotalCostInr: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDownload() {
    setError(null);
    if (!risk) {
      setError("Complete your career assessment first.");
      return;
    }
    setBusy(true);
    try {
      const countries = parseTargetCountries(profile.target_country ?? "");
      const uniLine =
        profile.target_universities.length > 0
          ? profile.target_universities.slice(0, 4).join(", ")
          : "—";

      const blob = await generateParentSummaryPDF({
        studentName: displayName,
        degreeLabel: profile.degree_type ?? "Program",
        fieldLabel: profile.broad_field ?? "Field",
        targetCountry:
          countries.length > 0
            ? joinTargetCountries(countries)
            : profile.target_country ?? "—",
        targetIntake: profile.target_intake,
        targetUniversitiesLine: uniLine,
        estimatedTotalCostInr,
        loanAmountInr,
        tenureMonths,
        interestRateAnnual: 0.115,
        salaryBandLowLpa: risk.salary_band_low_lpa,
        salaryBandHighLpa: risk.salary_band_high_lpa,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "GradRight-family-summary.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not build the PDF. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Share with family</CardTitle>
        <CardDescription>
          A calm, jargon-free PDF using your study plan and the loan settings
          above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <Button
          type="button"
          onClick={onDownload}
          disabled={!risk || busy}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          {busy ? "Building PDF…" : "Share with Parents (PDF)"}
        </Button>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
