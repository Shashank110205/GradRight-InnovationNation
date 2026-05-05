"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAwardXP } from "@/hooks/useAwardXP";

import { YourInsightsSection } from "@/components/shared/YourInsightsSection";
import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel";
import { CareerRiskGenerateForm } from "@/components/student/career/CareerRiskGenerateForm";
import { EMIComfortZone } from "@/components/student/career/EMIComfortZone";
import { NextBestActionsList } from "@/components/student/career/NextBestActionsList";
import { PlacementProbabilityChart } from "@/components/student/career/PlacementProbabilityChart";
import { RiskDriversList } from "@/components/student/career/RiskDriversList";
import { RiskScoreDisplay } from "@/components/student/career/RiskScoreDisplay";
import { SalaryBandDisplay } from "@/components/student/career/SalaryBandDisplay";
import { Button } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
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
  const careerFeature = useFeatureApi<Record<string, unknown>>("career");
  const jobOutlookFeature = useFeatureApi<{
    short_term_3mo?: string | null;
    mid_term_6mo?: string | null;
    long_term_12mo?: string | null;
  }>("job-outlook");

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
      <YourInsightsSection
        data={{
          ...(careerFeature.data ?? {}),
          summary:
            typeof (careerFeature.data as { summary?: unknown } | null)?.summary === "string"
              ? ((careerFeature.data as { summary: string }).summary ?? "")
              : score
                ? `Your current placement readiness is ${Math.round(score.risk_score_raw)} with ${Math.round(
                    score.placement_prob_6m * 100
                  )}% six-month probability.`
                : "Complete one score calculation to see personalized placement, salary, and financing guidance.",
          insights: Array.isArray((careerFeature.data as { roles?: unknown[] } | null)?.roles)
            ? [
                `Top role direction: ${((careerFeature.data as { roles?: string[] }).roles ?? [])
                  .slice(0, 3)
                  .join(", ")}`,
              ]
            : [],
          reasons: [
            profile.broad_field
              ? `Current field signal: ${profile.broad_field}.`
              : "Add your broad field to tighten recommendations.",
            profile.target_country
              ? `Primary destination signal: ${profile.target_country}.`
              : "Add target countries to improve destination-specific guidance.",
          ],
          profile,
        }}
      />

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
        <div className="space-y-6">
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                3-month outlook
              </p>
              <p className="mt-2 text-foreground/90">
                {jobOutlookFeature.data?.short_term_3mo ?? "Loading your short-term outlook..."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                6-month outlook
              </p>
              <p className="mt-2 text-foreground/90">
                {jobOutlookFeature.data?.mid_term_6mo ?? "Complete your score to tighten this forecast."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                12-month outlook
              </p>
              <p className="mt-2 text-foreground/90">
                {jobOutlookFeature.data?.long_term_12mo ?? "Update your goals to sharpen long-term positioning."}
              </p>
            </div>
          </div>

          <ExplainabilityPanel
            variant="admission"
            resultLabel="Placement readiness score"
            resultSummary={`Current readiness is ${Math.round(score.risk_score_raw)} with ${Math.round(
              score.placement_prob_6m * 100
            )}% placement probability in 6 months.`}
            whyPoints={score.top_drivers.slice(0, 4).map((d) => d.user_friendly_summary || d.explanation)}
            improvePoints={score.next_best_actions.slice(0, 4).map((a) => a.action)}
            nextStepHref="/plan/skills"
            nextStepLabel="Open skills roadmap"
            askExplainSeed="Explain in plain language which inputs are helping and hurting my current placement readiness score."
            askChallengeSeed="Challenge my current plan and show the top changes that could improve placement readiness in the next 90 days."
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          Your detailed career cards appear after score generation. Use the form above to calculate
          your latest readiness from profile + destination context.
        </div>
      )}
    </div>
  );
}
