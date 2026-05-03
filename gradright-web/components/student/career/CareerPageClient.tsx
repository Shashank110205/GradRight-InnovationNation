"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAwardXP } from "@/hooks/useAwardXP";

import { CareerRiskGenerateForm } from "@/components/student/career/CareerRiskGenerateForm";
import { EMIComfortZone } from "@/components/student/career/EMIComfortZone";
import { NextBestActionsList } from "@/components/student/career/NextBestActionsList";
import { PlacementProbabilityChart } from "@/components/student/career/PlacementProbabilityChart";
import { RiskDriversList } from "@/components/student/career/RiskDriversList";
import { RiskScoreDisplay } from "@/components/student/career/RiskScoreDisplay";
import { SalaryBandDisplay } from "@/components/student/career/SalaryBandDisplay";
import { Button } from "@/components/ui/button";
import type { APIResponse, RiskScore, StudentProfile } from "@/lib/types";
import type { RiskScorePostBody } from "@/lib/validations/risk-score-input";
import { calculateROI } from "@/lib/utils/calculations";

export function CareerPageClient({
  profile,
  initialScore,
  profileStale,
  loanInr,
  estimatedProgramCostUsd,
  paybackYears,
}: {
  profile: StudentProfile;
  initialScore: RiskScore | null;
  profileStale: boolean;
  loanInr: number;
  estimatedProgramCostUsd: number;
  paybackYears: number;
}) {
  const router = useRouter();
  const { mutate: awardXP } = useAwardXP();
  const careerVisitXpRef = useRef(false);
  const [score, setScore] = useState<RiskScore | null>(initialScore);
  const [recalcOpen, setRecalcOpen] = useState(!initialScore);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (careerVisitXpRef.current) return;
    careerVisitXpRef.current = true;
    awardXP("career_risk_first_view");
  }, [awardXP]);

  async function postScore(body: RiskScorePostBody) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/career/risk-score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as APIResponse<RiskScore>;
      if (!json.success || !json.data) {
        throw new Error(json.error || "Could not generate risk score");
      }
      setScore(json.data);
      setRecalcOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const showResults = score != null && !recalcOpen;

  const displayPayback =
    score != null
      ? calculateROI(
          estimatedProgramCostUsd,
          (score.salary_band_low_lpa + score.salary_band_high_lpa) / 2,
          83
        ).payback_years
      : paybackYears;

  return (
    <div className="space-y-6">
      {profileStale && showResults ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-amber-950 dark:text-amber-100">
            Your profile has not been updated in a while. Recalculate your score
            if your academics or internships changed.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-amber-700/40"
            onClick={() => setRecalcOpen(true)}
          >
            Recalculate
          </Button>
        </div>
      ) : null}

      {recalcOpen ? (
        <CareerRiskGenerateForm
          profile={profile}
          onSubmit={postScore}
          busy={busy}
          error={err}
          submitLabel={score ? "Recalculate score" : "Generate score"}
          detailedFields={score != null}
        />
      ) : null}

      {showResults && score ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <RiskScoreDisplay score={score} paybackYears={displayPayback} />
            <div className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5">
              <p className="mb-3 font-heading text-sm font-semibold text-foreground">
                Placement probability
              </p>
              <PlacementProbabilityChart score={score} />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5">
              <p className="mb-3 font-heading text-sm font-semibold text-foreground">
                Salary band
              </p>
              <SalaryBandDisplay score={score} />
            </div>
          </div>
          <div className="space-y-6">
            <EMIComfortZone score={score} loanAmountINR={loanInr} />
            <RiskDriversList drivers={score.top_drivers} />
            <NextBestActionsList actions={score.next_best_actions} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
