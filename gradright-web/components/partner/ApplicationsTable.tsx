import Link from "next/link";

import type { NBFCApplicationListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatSalaryBand } from "@/lib/utils/calculations";

function riskPill(label: NBFCApplicationListItem["risk_label"]) {
  const styles = {
    low: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    medium: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
    high: "bg-rose-500/15 text-rose-900 dark:text-rose-100",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        styles[label]
      )}
    >
      {label}
    </span>
  );
}

function statusPill(status: NBFCApplicationListItem["status"]) {
  return (
    <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-xs font-medium capitalize text-slate-800 dark:bg-slate-800 dark:text-slate-200">
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ApplicationsTable({ items }: { items: NBFCApplicationListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        No applications match these filters. Students who submit loans appear here as
        qualified leads with placement and risk context.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Placement 6m</th>
              <th className="px-4 py-3">Salary band</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Docs</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {row.applicant_name}
                </td>
                <td className="max-w-[200px] px-4 py-3 text-slate-700 dark:text-slate-300">
                  <span className="line-clamp-2">{row.program || "—"}</span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {row.target_country || "—"}
                </td>
                <td className="px-4 py-3">{riskPill(row.risk_label)}</td>
                <td className="px-4 py-3 tabular-nums text-slate-800 dark:text-slate-200">
                  {Math.round(row.placement_prob_6m * 100)}%
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {formatSalaryBand(
                    row.salary_band_low_lpa,
                    row.salary_band_high_lpa
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                  {row.submitted_at
                    ? new Date(row.submitted_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">{statusPill(row.status)}</td>
                <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                  {row.document_completeness_pct}%
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/nbfc/applications/${row.id}`}
                    className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
