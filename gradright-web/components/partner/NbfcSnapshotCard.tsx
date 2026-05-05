import type { NBFCApplicationListItem } from "@/lib/types";
import { nbfcSnapshotCounts } from "@/lib/nbfc/nbfc-decision-layer";

export function NbfcSnapshotCard({
  items,
  isDemo,
}: {
  items: NBFCApplicationListItem[];
  isDemo?: boolean;
}) {
  const { total, highPotential, loanReady, risky } = nbfcSnapshotCounts(items);

  return (
    <section className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/50 p-5 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-slate-950 dark:to-violet-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            Lender decision snapshot
          </p>
          <h2 className="mt-1 font-heading text-lg font-bold text-slate-900 dark:text-slate-50">
            Portfolio at a glance
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Counts from the same desk signals as the queue: placement, documents, risk band, and
            profile-linked intelligence — no extra schema.
          </p>
        </div>
        {isDemo ? (
          <span className="inline-flex w-fit rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
            Demo data
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total applicants
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {total}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
            High potential
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
            {highPotential}
          </p>
          <p className="mt-1 text-xs text-emerald-900/70 dark:text-emerald-200/80">
            Low risk + strong 6m placement
          </p>
        </div>
        <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
            Loan-ready
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-indigo-800 dark:text-indigo-200">
            {loanReady}
          </p>
          <p className="mt-1 text-xs text-indigo-900/70 dark:text-indigo-200/80">
            Docs pack ≥72%
          </p>
        </div>
        <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-800 dark:text-rose-200">
            Risky candidates
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-rose-800 dark:text-rose-200">
            {risky}
          </p>
          <p className="mt-1 text-xs text-rose-900/70 dark:text-rose-200/80">
            High band, weak placement, or elevated desk read
          </p>
        </div>
      </div>
    </section>
  );
}
