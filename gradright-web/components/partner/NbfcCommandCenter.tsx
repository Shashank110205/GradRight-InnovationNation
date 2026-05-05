import type { NBFCApplicationListItem } from "@/lib/types";
import { nbfcSnapshotCounts } from "@/lib/nbfc/nbfc-decision-layer";

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

export function NbfcCommandCenter({
  items,
  isDemo,
}: {
  items: NBFCApplicationListItem[];
  isDemo?: boolean;
}) {
  const { total: n, highPotential, loanReady } = nbfcSnapshotCounts(items);
  const active = items.filter((i) => i.status !== "rejected").length;
  const funnelSubmitted = items.filter((i) => i.status === "submitted").length;
  const funnelReview = items.filter(
    (i) => i.status === "under_review" || i.status === "manual_review"
  ).length;
  const funnelApproved = items.filter((i) => i.status === "approved").length;
  const potentialLeads = items.filter((i) => i.status === "submitted").length;
  const applicationsActive = funnelReview;
  const approvedDesk = funnelApproved;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900/80">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            NBFC command center
          </p>
          <h2 className="mt-1 font-heading text-xl font-bold text-slate-900 dark:text-slate-50">
            Lead intelligence at a glance
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Placement outlook, document readiness, and scholarship dependency — pulled from
            GradRight onboarding and <span className="font-medium">student_profiles</span>{" "}
            where linked.
          </p>
        </div>
        {isDemo ? (
          <span className="inline-flex w-fit rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
            Demo data
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total in view
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {n}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            High potential
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            {highPotential}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Low risk + strong 6m placement signal
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Loan-ready (docs)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
            {loanReady}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ≥72% document pack heuristic
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Active pipeline
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {active}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Excluding rejected
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Pipeline: potential leads → in review → approved
        </p>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="bg-slate-400 dark:bg-slate-500"
            style={{ width: `${pct(funnelSubmitted, n)}%` }}
            title="Submitted"
          />
          <div
            className="bg-indigo-500"
            style={{ width: `${pct(funnelReview, n)}%` }}
            title="In review"
          />
          <div
            className="bg-emerald-500"
            style={{ width: `${pct(funnelApproved, n)}%` }}
            title="Approved"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Submitted {funnelSubmitted}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Review {funnelReview}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Approved {funnelApproved}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Potential leads
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {potentialLeads}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Submitted — not yet in credit review
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Applications (in review)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-indigo-800 dark:text-indigo-200">
            {applicationsActive}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Under review or manual queue
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Approved
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
            {approvedDesk}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Credit decision complete
          </p>
        </div>
      </div>
    </section>
  );
}
