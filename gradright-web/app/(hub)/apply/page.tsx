import { redirect } from "next/navigation";

import { LoanPageClient } from "@/components/student/apply/LoanPageClient";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";

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

      <LoanPageClient
        profile={profile}
        defaultFullName={displayName}
        defaultInstitute={defaultInstitute}
        defaultProgramHint={defaultProgramHint}
        defaultLoanInr={defaultLoanInr(profile.budget_band_usd)}
      />
    </div>
  );
}
