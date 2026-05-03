import { redirect } from "next/navigation";

import { FinancingHubClientLoader } from "@/components/student/finance/financing-hub-client-loader";
import { computeEligibilityEstimateLocally } from "@/lib/finance/eligibility-engine";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";

const INR_PER_USD = 83;
const ILLUSTRATIVE_FAMILY_INCOME = 1_200_000;

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

export default async function FinancePage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const profile = await getStudentProfileByUserId(ctx.appUser.id);
  if (!profile) {
    redirect("/onboarding");
  }

  const risk = await getLatestRiskScoreByUserId(ctx.appUser.id);
  const defaultLoan = defaultLoanInr(profile.budget_band_usd);
  const estimatedProgramCostInr = Math.round(
    estimatedTwoYearCostUsd(profile.budget_band_usd) * INR_PER_USD
  );

  const initialEligibility =
    risk != null
      ? computeEligibilityEstimateLocally({
          loan_amount_requested: defaultLoan,
          salary_band_low_lpa: risk.salary_band_low_lpa,
          salary_band_high_lpa: risk.salary_band_high_lpa,
          family_income_annual: ILLUSTRATIVE_FAMILY_INCOME,
          collateral_available: false,
        })
      : null;

  const displayName =
    ctx.appUser.full_name?.trim() ||
    ctx.authUser.email?.split("@")[0] ||
    "Student";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Finance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Eligibility hints, EMI planning tied to your salary outlook, plain-language
          loan basics, and a family-friendly PDF—built from your profile and latest
          risk score.
        </p>
      </div>

      <FinancingHubClientLoader
        displayName={displayName}
        profile={profile}
        risk={risk}
        defaultLoanInr={defaultLoan}
        estimatedProgramCostInr={estimatedProgramCostInr}
        initialEligibility={initialEligibility}
        initialFamilyIncome={ILLUSTRATIVE_FAMILY_INCOME}
      />
    </div>
  );
}
