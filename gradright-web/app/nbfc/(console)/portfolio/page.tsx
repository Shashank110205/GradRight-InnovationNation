import { CohortRiskHeatmap } from "@/components/partner/CohortRiskHeatmap";
import { getNBFCPortfolioData } from "@/lib/db/queries/applications";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export default async function NbfcPortfolioPage() {
  const data = await getNBFCPortfolioData();
  const { low, medium, high } = data.risk_distribution;
  const riskTotal = low + medium + high || 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">
          Portfolio insights
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Cohort-level placement readiness and concentration risk — powered by the
          same GradRight models used on the student app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applications"
          value={String(data.total_applications)}
          hint="Non-draft pipeline"
        />
        <StatCard
          label="Pending review"
          value={String(data.pending_review)}
          hint="Submitted, in review, or manual queue"
        />
        <StatCard
          label="Approval rate"
          value={`${Math.round(data.approval_rate * 100)}%`}
          hint="Among decided cases (approved ÷ approved+rejected)"
        />
        <StatCard
          label="Risk mix"
          value={`${Math.round((low / riskTotal) * 100)} / ${Math.round((medium / riskTotal) * 100)} / ${Math.round((high / riskTotal) * 100)}`}
          hint="Low / medium / high %"
        />
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-slate-900 dark:text-slate-50">
          Cohort risk heatmap
        </h2>
        <CohortRiskHeatmap cohort={data.cohort_heatmap} />
      </div>
    </div>
  );
}
