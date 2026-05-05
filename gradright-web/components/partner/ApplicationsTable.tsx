"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NBFCApplicationListItem } from "@/lib/types";
import {
  candidateQualityScore,
  nbfcRiskNarrative,
  repaymentConfidenceDisplay,
  sortNbfcApplicationsForDesk,
} from "@/lib/nbfc/nbfc-decision-layer";
import { cn } from "@/lib/utils";
import { formatSalaryBand } from "@/lib/utils/calculations";

const COL_COUNT = 16;

function riskFlagPill(label: NBFCApplicationListItem["risk_label"]) {
  const text =
    label === "low" ? "Low" : label === "medium" ? "Medium" : "High";
  const styles = {
    low: "bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200",
    medium:
      "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/25 dark:text-amber-100",
    high: "bg-rose-500/15 text-rose-900 ring-1 ring-rose-500/30 dark:text-rose-100",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[label]
      )}
    >
      {text}
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

function scholarshipLabel(
  d: NBFCApplicationListItem["scholarship_dependency"]
): string {
  if (d === "high") return "High";
  if (d === "low") return "Low";
  if (d === "medium") return "Med";
  return "—";
}

function scoreCell(score: number) {
  const tone =
    score >= 65
      ? "text-emerald-800 dark:text-emerald-200"
      : score >= 42
        ? "text-amber-800 dark:text-amber-200"
        : "text-rose-800 dark:text-rose-200";
  return (
    <span className={cn("font-semibold tabular-nums", tone)}>{score}</span>
  );
}

function safePct(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

function stubDecision(_id: string, action: "approve" | "review" | "reject") {
  void _id;
  void action;
}

export function ApplicationsTable({
  items,
  allowDetailNav = true,
}: {
  items: NBFCApplicationListItem[];
  /** When false (demo rows), skip links to detail pages that would 404. */
  allowDetailNav?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => sortNbfcApplicationsForDesk(items),
    [items]
  );

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
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="w-10 px-2 py-3" aria-label="Expand" />
              <th className="px-3 py-3">Applicant</th>
              <th className="px-3 py-3">Program</th>
              <th className="px-3 py-3">Country</th>
              <th className="px-3 py-3">Cand. quality (0–100)</th>
              <th className="px-3 py-3">Repay confidence (0–100)</th>
              <th className="px-3 py-3">Risk flag</th>
              <th className="px-3 py-3">Placement 6m</th>
              <th className="px-3 py-3">Salary</th>
              <th className="px-3 py-3">ROI (yrs)</th>
              <th className="px-3 py-3">Scholar</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Docs</th>
              <th className="px-3 py-3">Desk</th>
              <th className="min-w-[200px] px-3 py-3">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((row) => {
              const cq = candidateQualityScore(row);
              const rc = repaymentConfidenceDisplay(row);
              const narrative = nbfcRiskNarrative(row);
              const open = expandedId === row.id;
              const rowRisky = row.risk_label === "high" || cq < 42;

              return (
                <Fragment key={row.id}>
                  <tr
                    className={cn(
                      "hover:bg-slate-50/80 dark:hover:bg-slate-800/50",
                      rowRisky && "bg-rose-50/30 dark:bg-rose-950/10"
                    )}
                  >
                    <td className="px-2 py-2 align-middle">
                      <button
                        type="button"
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                        aria-expanded={open}
                        onClick={() =>
                          setExpandedId((id) => (id === row.id ? null : row.id))
                        }
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {row.applicant_name}
                    </td>
                    <td className="max-w-[180px] px-3 py-3 text-slate-700 dark:text-slate-300">
                      <span className="line-clamp-2">{row.program || "—"}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                      {row.target_country || "—"}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{scoreCell(cq)}</td>
                    <td className="px-3 py-3 tabular-nums">{scoreCell(rc)}</td>
                    <td className="px-3 py-3">{riskFlagPill(row.risk_label)}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-800 dark:text-slate-200">
                      {Number.isFinite(row.placement_prob_6m)
                        ? `${Math.round(row.placement_prob_6m * 100)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                      {formatSalaryBand(
                        row.salary_band_low_lpa,
                        row.salary_band_high_lpa
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                      {row.roi_payback_years != null &&
                      row.roi_payback_years > 0 &&
                      Number.isFinite(row.roi_payback_years)
                        ? `${row.roi_payback_years}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {scholarshipLabel(row.scholarship_dependency)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {row.submitted_at
                        ? new Date(row.submitted_at).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-3">{statusPill(row.status)}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {safePct(row.document_completeness_pct)}
                    </td>
                    <td className="px-3 py-3">
                      {allowDetailNav ? (
                        <Link
                          href={`/nbfc/applications/${row.id}`}
                          className="text-xs font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">Demo</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 border-emerald-300/80 text-[11px] text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
                          onClick={() => stubDecision(row.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 border-slate-300 text-[11px] dark:border-slate-600"
                          onClick={() => stubDecision(row.id, "review")}
                        >
                          Review
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 border-rose-300/80 text-[11px] text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/40"
                          onClick={() => stubDecision(row.id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="bg-slate-50/90 dark:bg-slate-900/80">
                      <td colSpan={COL_COUNT} className="px-4 py-4">
                        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950/60 md:grid-cols-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                              Why this candidate is risky
                            </p>
                            <p className="mt-1 text-slate-700 dark:text-slate-300">
                              {narrative.whyRisky}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                              What improves their profile
                            </p>
                            <p className="mt-1 text-slate-700 dark:text-slate-300">
                              {narrative.improves}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Expected repayment behavior
                            </p>
                            <p className="mt-1 text-slate-700 dark:text-slate-300">
                              {narrative.repaymentBehavior}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
