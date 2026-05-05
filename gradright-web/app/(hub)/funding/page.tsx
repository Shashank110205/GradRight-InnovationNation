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
  const targetCountry = profile.target_country?.trim() || "your target country";
  const programHint =
    [profile.degree_type, profile.broad_field].filter(Boolean).join(" · ") ||
    "your selected program";
  const universityHint = profile.target_universities?.[0]?.trim() || "your shortlisted university";
  const maxSuggestedLoan = initialEligibility?.max_recommended_loan ?? defaultLoan;
  const readinessBand = initialEligibility?.eligibility_band ?? "moderate";
  const readinessTone =
    readinessBand === "likely"
      ? "You are in a stronger starting position."
      : readinessBand === "unlikely"
        ? "You can still improve this with structure."
        : "You have a workable baseline to build from.";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="animate-in fade-in duration-500">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Funding · How can I do this safely?
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Personalized funding clarity for {displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Built from your Profile Hub signals ({targetCountry}, {programHint}). This module explains
          your likely cost, living burden, affordability confidence, financing process, and EMI
          trade-offs in one connected flow.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="#cost-planner" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            Total cost
          </Link>
          <Link href="#living" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            Living cost
          </Link>
          <Link href="#readiness" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            Can you afford
          </Link>
          <Link
            href="#smart-financing"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Financing process
          </Link>
          <Link href="#emi" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            EMI
          </Link>
        </div>
      </div>

      <section id="readiness" className="scroll-mt-24">
        <GlassCard className="border-brand-primary/20 bg-brand-primary/5 p-5 md:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Can you afford this plan?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {readinessTone} Your current affordability estimate aligns around{" "}
            <span className="font-medium text-foreground">
              ₹
              {new Intl.NumberFormat("en-IN").format(Math.round(maxSuggestedLoan))}
            </span>{" "}
            as a practical upper reference (illustrative).
          </p>
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              Profile-aware confidence: country <span className="font-medium text-foreground">{targetCountry}</span>,
              program <span className="font-medium text-foreground">{programHint}</span>.
            </li>
            <li>Grounded explainability: every estimate is tied to assumptions shown on the screen.</li>
            <li>Fear reduction: we show best-case and stress-case, not just one number.</li>
          </ul>
        </GlassCard>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section id="cost-planner" className="scroll-mt-24">
          <GlassCard className="h-full p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">Total cost planner</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              For {targetCountry} and your current profile band, illustrative two-year cost is{" "}
              <span className="font-medium text-foreground">
                ≈ {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(estimatedProgramCostInr)}
              </span>
              . Use this as baseline before admit-level tuning.
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <span className="text-muted-foreground">Country signal:</span>{" "}
                <span className="font-medium text-foreground">{targetCountry}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <span className="text-muted-foreground">Program signal:</span>{" "}
                <span className="font-medium text-foreground">{programHint}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <span className="text-muted-foreground">University focus:</span>{" "}
                <span className="font-medium text-foreground">{universityHint}</span>
              </div>
            </div>
          </GlassCard>
        </section>
        <section id="living" className="scroll-mt-24">
          <GlassCard className="h-full p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">Living expenses</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              For better decision quality, model monthly burn as: rent + groceries + transport +
              insurance + emergency buffer. Keep a 10-15% contingency for FX and city variation.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Track monthly velocity, not only annual lump sum.</li>
              <li>Build one lean budget and one realistic budget before finalizing loan size.</li>
              <li>Avoid over-borrowing by separating essentials from lifestyle spend.</li>
            </ul>
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
          <h2 className="font-heading text-xl font-semibold text-foreground">Smart financing process</h2>
          <p className="mt-1 text-sm text-muted-foreground" id="emi">
            Understand the full loan journey before applying: eligibility, co-borrower strategy,
            collateral choice, repayment structure, and EMI comfort under realistic salary bands.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <GlassCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Financing checklist
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Set target loan from cost minus savings/scholarship.</li>
              <li>Choose co-borrower path and income proof strategy.</li>
              <li>Compare collateral vs unsecured total repayment cost.</li>
              <li>Validate moratorium, prepayment, and late-fee rules.</li>
            </ol>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Repayment clarity
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>EMI affordability must work for low-salary and median scenarios.</li>
              <li>Check whether interest accrues during moratorium.</li>
              <li>Prefer plans allowing partial prepayment without high penalty.</li>
              <li>Keep 3-6 months EMI reserve for job transition risk.</li>
            </ul>
          </GlassCard>
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

      <GlassCard className="border-dashed border-border/80 p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Ready to move to application?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Once this plan feels comfortable, move to the guided application workspace. Your process
          remains structured from document readiness to final submission.
        </p>
        <Link
          href="/apply"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "mt-4 inline-flex"
          )}
        >
          Start funding application →
        </Link>
      </GlassCard>
    </div>
  );
}
