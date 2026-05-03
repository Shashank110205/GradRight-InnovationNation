import Link from "next/link";
import { redirect } from "next/navigation";

import { CareerPageClient } from "@/components/student/career/CareerPageClient";
import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLatestFullRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { calculateROI } from "@/lib/utils/calculations";

function defaultLoanInr(budget: string | null): number {
  const b = budget ?? "";
  if (b.includes("Above $80")) return 45_00_000;
  if (b.includes("50,000")) return 35_00_000;
  if (b.includes("30,000")) return 28_00_000;
  if (b.includes("Under")) return 20_00_000;
  return 25_00_000;
}

function estimatedTwoYearCostUsd(budget: string | null): number {
  const b = budget ?? "";
  if (b.includes("Above $80")) return 160_000;
  if (b.includes("50,000")) return 100_000;
  if (b.includes("30,000")) return 80_000;
  if (b.includes("Under")) return 55_000;
  return 90_000;
}

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export default async function CareerPage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const profile = await getStudentProfileByUserId(ctx.appUser.id);
  if (!profile) {
    redirect("/onboarding");
  }

  const initialScore = await getLatestFullRiskScoreByUserId(ctx.appUser.id);
  const profileStale = daysSince(profile.updated_at) >= 30;
  const loanInr = defaultLoanInr(profile.budget_band_usd);
  const costUsd = estimatedTwoYearCostUsd(profile.budget_band_usd);
  const midSalary =
    initialScore != null
      ? (initialScore.salary_band_low_lpa + initialScore.salary_band_high_lpa) /
        2
      : 0;
  const paybackYears =
    midSalary > 0
      ? calculateROI(costUsd, midSalary, 83).payback_years
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Career & placement
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Placement probabilities, salary benchmarks, EMI comfort, and
          explainable drivers—linked to your profile and the rule engine.
        </p>
      </div>

      <GlassCard className="relative overflow-hidden p-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            AI Career Navigator
          </p>
          <p className="mt-1 font-heading text-lg font-semibold text-foreground">
            Find My Best University
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Structured programs, costs, ROI, and visa fit—not a chatbot. Built for
            Indian students planning abroad.
          </p>
        </div>
        <Link
          href="/career/navigator"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "mt-4 inline-flex w-full shrink-0 justify-center sm:mt-0 sm:w-auto"
          )}
        >
          Find My Best University →
        </Link>
      </GlassCard>

      <CareerPageClient
        key={
          initialScore
            ? `${initialScore.id}:${initialScore.calculated_at}`
            : "no-risk-row"
        }
        profile={profile}
        initialScore={initialScore}
        profileStale={profileStale}
        loanInr={loanInr}
        estimatedProgramCostUsd={costUsd}
        paybackYears={paybackYears}
      />
    </div>
  );
}
