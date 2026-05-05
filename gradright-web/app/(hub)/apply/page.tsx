import { redirect } from "next/navigation";
import Link from "next/link";

import { LoanPageClient } from "@/components/student/apply/LoanPageClient";
import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { cn } from "@/lib/utils";

function defaultLoanInr(budget: string | null): number {
  const b = budget ?? "";
  if (b.includes("Above $80")) return 45_00_000;
  if (b.includes("50,000")) return 35_00_000;
  if (b.includes("30,000")) return 28_00_000;
  if (b.includes("Under")) return 20_00_000;
  return 25_00_000;
}

export default async function ApplyHubPage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const profile = await getStudentProfileByUserId(ctx.appUser.id);
  if (!profile) {
    redirect("/onboarding");
  }

  const displayName =
    ctx.appUser.full_name?.trim() ||
    ctx.authUser.email?.split("@")[0] ||
    "Student";

  const defaultInstitute = profile.institute_name?.trim() || "";
  const defaultProgramHint =
    [profile.degree_type, profile.broad_field].filter(Boolean).join(" · ") ||
    "";
  const targetCountry = profile.target_country?.trim() || "your target country";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Apply
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Loan application and documents — save as you go and pick up on any device.
        </p>
      </div>

      <GlassCard gradient className="border-brand-primary/30 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-pink">
          Funding Partner Spotlight
        </p>
        <h2 className="mt-2 font-heading text-xl font-semibold text-foreground">
          Poonawalla Fincorp as your financing companion
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Not just a loan step. This flow is designed as a guided lifecycle from planning to
          disbursement support. You get a structured path with clarity on eligibility, documents,
          repayment expectations, co-borrower setup, and next actions.
        </p>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            End-to-end guidance from first form to submission
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            Clear checklist for collateral, co-borrower, and repayment
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            Built for your profile: {targetCountry} · {defaultProgramHint || "program profile"}
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            One workspace for document upload, review, and final apply
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="#loan-application" className={cn(buttonVariants({ variant: "default" }))}>
            Apply with Poonawalla support
          </Link>
          <Link href="/funding#smart-financing" className={cn(buttonVariants({ variant: "outline" }))}>
            Review financing process
          </Link>
        </div>
      </GlassCard>

      <section id="loan-application" className="scroll-mt-24">
      <LoanPageClient
        profile={profile}
        defaultFullName={displayName}
        defaultInstitute={defaultInstitute}
        defaultProgramHint={defaultProgramHint}
        defaultLoanInr={defaultLoanInr(profile.budget_band_usd)}
      />
      </section>
    </div>
  );
}
