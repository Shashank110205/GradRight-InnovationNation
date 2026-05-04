import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationTimeline } from "@/components/partner/ApplicationTimeline";
import { buttonVariants } from "@/components/ui/button";
import { DecisionActions } from "@/components/partner/DecisionActions";
import { DocumentList } from "@/components/partner/DocumentList";
import { StudentProfileSummary } from "@/components/partner/StudentProfileSummary";
import { EMIComfortZone } from "@/components/student/career/EMIComfortZone";
import { PlacementProbabilityChart } from "@/components/student/career/PlacementProbabilityChart";
import { RiskDriversList } from "@/components/student/career/RiskDriversList";
import { RiskScoreDisplay } from "@/components/student/career/RiskScoreDisplay";
import { SalaryBandDisplay } from "@/components/student/career/SalaryBandDisplay";
import { getNBFCApplicationDetailForSupervisor } from "@/lib/db/queries/applications";
import { calculateROI } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";

export default async function NbfcApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getNBFCApplicationDetailForSupervisor(id);
  if (!detail) {
    notFound();
  }

  const { application, risk_score, student_profile, documents } = detail;
  const loanInr = application.loan_amount_requested ?? 1_500_000;
  const paybackYears =
    risk_score && loanInr > 0
      ? calculateROI(
          loanInr / 83,
          (risk_score.salary_band_low_lpa + risk_score.salary_band_high_lpa) / 2,
          83
        ).payback_years
      : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/nbfc/applications"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
          >
            ← Back to queue
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">
            {application.full_name ?? "Applicant"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {application.program ?? "Program TBD"} ·{" "}
            {application.institute ?? "Institute TBD"}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Requested loan
            </p>
            <p className="font-heading text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              ₹{new Intl.NumberFormat("en-IN").format(loanInr)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`mailto:?subject=${encodeURIComponent(
                `GradRight lead: ${application.full_name ?? "Applicant"}`
              )}&body=${encodeURIComponent(
                `Application ID: ${application.id}\nProgram: ${application.program ?? "—"}\nInstitute: ${application.institute ?? "—"}`
              )}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs font-semibold"
              )}
            >
              Reach out
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(
                `Counsel session — ${application.full_name ?? "Applicant"}`
              )}&body=${encodeURIComponent(
                "Schedule a counseling touchpoint. Applicant context is in GradRight NBFC console."
              )}`}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "text-xs font-semibold"
              )}
            >
              Counsel
            </a>
            <button
              type="button"
              title="Wire to your LOS / credit workflow"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "text-xs font-semibold"
              )}
            >
              Pre-qualify
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {risk_score ? (
            <>
              <RiskScoreDisplay score={risk_score} paybackYears={paybackYears} />
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                    Placement probability
                  </p>
                  <PlacementProbabilityChart score={risk_score} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <SalaryBandDisplay score={risk_score} />
                </div>
              </div>
              <EMIComfortZone score={risk_score} loanAmountINR={loanInr} />
              <RiskDriversList drivers={risk_score.top_drivers} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              No risk score linked to this application. The applicant may need to
              complete GradRight Score before credit review.
            </div>
          )}
        </div>
        <div className="space-y-6">
          <StudentProfileSummary profile={student_profile} />
          <DocumentList documents={documents} />
          <ApplicationTimeline application={application} />
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <DecisionActions applicationId={application.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
