import { redirect } from "next/navigation";

import { FinancingHubClientLoader } from "@/components/student/finance/financing-hub-client-loader";
import { GlassCard } from "@/components/shell/GlassCard";
import { computeEligibilityEstimateLocally } from "@/lib/finance/eligibility-engine";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export const metadata = {
  title: "Funding",
  description: "Cost clarity, scholarships, and calm financing tools when you are ready.",
};

export default async function FundingHubPage() {
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="animate-in fade-in duration-500">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Funding · How can I do this safely?
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Build confidence before you commit
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Visibility first: costs, living velocity, scholarships, and readiness. Smart financing
          and EMI tools stay here when you choose to use them — no pressure narrative.
        </p>
      </div>

      <section id="readiness" className="scroll-mt-24">
        <GlassCard className="border-brand-primary/20 bg-brand-primary/5 p-5 md:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Funding readiness</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you can explain your monthly burn and one backup plan, you&apos;re already ahead of
            most applicants. Use the blocks below in order — skip anything that doesn&apos;t apply
            yet.
          </p>
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Ground truth on tuition + living (rough ranges are fine).</li>
            <li>Scholarship categories that match your profile signals.</li>
            <li>Career-linked EMI stress tests only when you want them.</li>
          </ul>
        </GlassCard>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section id="cost-planner" className="scroll-mt-24">
          <GlassCard className="h-full p-5">
            <h2 className="font-heading text-lg font-semibold text-foreground">Cost planner</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Illustrative two-year program cost (from your budget band):{" "}
              <span className="font-medium text-foreground">
                ≈ {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(estimatedProgramCostInr)}
              </span>
              . Tune this with your admits and city choice.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Official fees change by intake — always verify on the program page.
            </p>
          </GlassCard>
        </section>
        <section id="living" className="scroll-mt-24">
          <GlassCard className="h-full p-5">
            <h2 className="font-heading text-lg font-semibold text-foreground">Living expenses</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Model rent + food + transport as monthly velocity, not a single lump sum. Add a 10%
              buffer for surprises and FX swings.
            </p>
            <Link
              href="/explore/articles/financial-literacy-abroad"
              className={cn(
                buttonVariants({ variant: "link", className: "mt-2 h-auto px-0 text-brand-primary" })
              )}
            >
              Read the cash-flow explainer →
            </Link>
          </GlassCard>
        </section>
      </div>

      <section id="roi" className="scroll-mt-24">
        <GlassCard className="p-5 md:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">ROI lens</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ROI is payoff vs. risk: salary bands from your profile snapshot, program cost, and how
            tight cash flow would feel month to month. The admission predictor and career hub feed
            the same story — not isolated calculators.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/plan/admission" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
              Admission predictor
            </Link>
            <Link href="/career" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
              Job outlook
            </Link>
          </div>
        </GlassCard>
      </section>

      <section id="smart-financing" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Smart financing tools</h2>
          <p className="mt-1 text-sm text-muted-foreground" id="emi">
            EMI understanding and eligibility hints — optional, numbers are illustrative until you
            verify with lenders and official program costs.
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
      </section>

      <GlassCard className="border-dashed border-border/80 p-5">
        <h2 className="font-heading text-lg font-semibold text-foreground">Secure funding</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          When documents and intent are ready, the loan workspace stays isolated from awareness
          content — continue only if this is your active step.
        </p>
        <Link
          href="/apply"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-4 inline-flex"
          )}
        >
          Go to application workspace →
        </Link>
      </GlassCard>
    </div>
  );
}
