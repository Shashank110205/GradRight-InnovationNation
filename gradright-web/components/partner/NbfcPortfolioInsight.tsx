import type { NBFCApplicationListItem } from "@/lib/types";
import { nbfcPortfolioInsights } from "@/lib/nbfc/nbfc-decision-layer";

export function NbfcPortfolioInsight({ items }: { items: NBFCApplicationListItem[] }) {
  const { avgRepaymentConfidence, riskDistribution, expectedReturnIndex } =
    nbfcPortfolioInsights(items);
  const n = items.length;
  if (n === 0) return null;

  const lowPct = Math.round((riskDistribution.low / n) * 100);
  const medPct = Math.round((riskDistribution.medium / n) * 100);
  const highPct = Math.round((riskDistribution.high / n) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Portfolio insight
      </p>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg repayment confidence</p>
            <p className="mt-0.5 font-heading text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {avgRepaymentConfidence}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Expected returns (index)</p>
            <p className="mt-0.5 font-heading text-xl font-bold tabular-nums text-indigo-800 dark:text-indigo-200">
              {expectedReturnIndex != null ? `${expectedReturnIndex}` : "—"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Higher = faster modeled payback vs cohort
            </p>
          </div>
        </div>
        <div className="min-w-[220px] flex-1 lg:max-w-md">
          <p className="text-xs text-slate-500 dark:text-slate-400">Risk distribution</p>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="bg-emerald-500"
              style={{ width: `${lowPct}%` }}
              title={`Low ${riskDistribution.low}`}
            />
            <div
              className="bg-amber-400"
              style={{ width: `${medPct}%` }}
              title={`Medium ${riskDistribution.medium}`}
            />
            <div
              className="bg-rose-500"
              style={{ width: `${highPct}%` }}
              title={`High ${riskDistribution.high}`}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-400">
            <span>
              Low {riskDistribution.low} ({lowPct}%)
            </span>
            <span>
              Med {riskDistribution.medium} ({medPct}%)
            </span>
            <span>
              High {riskDistribution.high} ({highPct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
