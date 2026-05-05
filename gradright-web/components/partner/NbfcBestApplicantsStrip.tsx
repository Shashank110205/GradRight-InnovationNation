import type { NBFCApplicationListItem } from "@/lib/types";
import {
  candidateQualityScore,
  nbfcBestApplicants,
  repaymentConfidenceDisplay,
} from "@/lib/nbfc/nbfc-decision-layer";
import { cn } from "@/lib/utils";

function toneClass(score: number) {
  if (score >= 65) return "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/25";
  if (score >= 42) return "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/25";
  return "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/25";
}

export function NbfcBestApplicantsStrip({ items }: { items: NBFCApplicationListItem[] }) {
  const top = nbfcBestApplicants(items, 3);
  if (top.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
          Top candidates — AI-ranked
        </p>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          By repayment confidence, then ROI payback
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {top.map((row, idx) => {
          const rc = repaymentConfidenceDisplay(row);
          const cq = candidateQualityScore(row);
          const roi = row.roi_payback_years;
          return (
            <div
              key={row.id}
              className={cn(
                "rounded-xl border p-4 shadow-sm",
                toneClass(rc)
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
                  {idx + 1}
                </span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                  ROI {roi != null && roi > 0 ? `${roi}y` : "—"}
                </span>
              </div>
              <p className="mt-2 font-heading text-sm font-semibold text-slate-900 dark:text-slate-50">
                {row.applicant_name}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                {row.program || "—"} · {row.target_country || "—"}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Repayment confidence</dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {rc}%
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Quality score</dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {cq}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
