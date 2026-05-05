import type { NBFCApplicationListItem } from "@/lib/types";

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Desk-facing quality score (0–100) from placement, docs, risk band, and quality tag — does not replace server `repayment_score`. */
export function candidateQualityScore(row: NBFCApplicationListItem): number {
  const placement = (row.placement_prob_6m ?? 0) * 100;
  const docs = row.document_completeness_pct ?? 0;
  const riskAdj =
    row.risk_label === "low" ? 14 : row.risk_label === "medium" ? 0 : -18;
  const qualityAdj =
    row.candidate_quality === "strong"
      ? 10
      : row.candidate_quality === "elevated_risk"
        ? -14
        : 0;
  return clampPct(placement * 0.42 + docs * 0.38 + 12 + riskAdj + qualityAdj);
}

export function repaymentConfidenceDisplay(row: NBFCApplicationListItem): number {
  return clampPct(row.repayment_confidence_pct ?? 0);
}

export type NbfcSnapshotCounts = {
  total: number;
  highPotential: number;
  loanReady: number;
  risky: number;
};

export function nbfcSnapshotCounts(items: NBFCApplicationListItem[]): NbfcSnapshotCounts {
  const total = items.length;
  const highPotential = items.filter(
    (i) => i.risk_label === "low" && i.placement_prob_6m >= 0.62
  ).length;
  const loanReady = items.filter(
    (i) => i.document_completeness_pct >= 72 && i.status !== "rejected"
  ).length;
  const risky = items.filter(
    (i) =>
      i.risk_label === "high" ||
      i.candidate_quality === "elevated_risk" ||
      i.placement_prob_6m < 0.42
  ).length;
  return { total, highPotential, loanReady, risky };
}

export type NbfcPortfolioInsight = {
  avgRepaymentConfidence: number;
  riskDistribution: { low: number; medium: number; high: number };
  /** Higher = better — inverse of average payback years when present. */
  expectedReturnIndex: number | null;
};

export function nbfcPortfolioInsights(
  items: NBFCApplicationListItem[]
): NbfcPortfolioInsight {
  if (!items.length) {
    return {
      avgRepaymentConfidence: 0,
      riskDistribution: { low: 0, medium: 0, high: 0 },
      expectedReturnIndex: null,
    };
  }
  const sum = items.reduce((acc, i) => acc + (i.repayment_confidence_pct ?? 0), 0);
  const avgRepaymentConfidence = clampPct(sum / items.length);
  const riskDistribution = {
    low: items.filter((i) => i.risk_label === "low").length,
    medium: items.filter((i) => i.risk_label === "medium").length,
    high: items.filter((i) => i.risk_label === "high").length,
  };
  const rois = items
    .map((i) => i.roi_payback_years)
    .filter((y): y is number => y != null && y > 0 && Number.isFinite(y));
  const avgPayback =
    rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : null;
  const expectedReturnIndex =
    avgPayback != null && avgPayback > 0 ? clampPct(120 / avgPayback) : null;
  return { avgRepaymentConfidence, riskDistribution, expectedReturnIndex };
}

export type NbfcRiskNarrative = {
  whyRisky: string;
  improves: string;
  repaymentBehavior: string;
};

export function nbfcRiskNarrative(row: NBFCApplicationListItem): NbfcRiskNarrative {
  const parts: string[] = [];
  if (row.risk_label === "high") {
    parts.push("GradRight risk band is high versus cohort benchmarks.");
  }
  if (row.placement_prob_6m < 0.48) {
    parts.push("Six-month placement outlook sits below the comfort band for aggressive ticket sizes.");
  }
  if (row.scholarship_dependency === "high") {
    parts.push("Scholarship-heavy funding path adds execution risk if aid slips.");
  }
  if (row.candidate_quality === "elevated_risk") {
    parts.push("Desk quality flag reads elevated — review profile depth and offer certainty.");
  }
  const whyRisky =
    parts.length > 0
      ? parts.join(" ")
      : "No acute red flags in the bundled desk read — still verify offer and liquidity independently.";

  const improve: string[] = [];
  if (row.document_completeness_pct < 80) {
    improve.push("Raise document completeness above 80% with verified income and admission artifacts.");
  }
  if (row.placement_prob_6m < 0.58) {
    improve.push("Ask the student to refresh GradScore inputs (tests, experience) to lift placement confidence.");
  }
  if (row.risk_label !== "low") {
    improve.push("Pair with a smaller first tranche or co-borrower structure if policy allows.");
  }
  const improves =
    improve.length > 0
      ? improve.join(" ")
      : "Maintain cadence: keep profile intelligence fresh and align loan ask to verified offer terms.";

  const midSal = (row.salary_band_low_lpa + row.salary_band_high_lpa) / 2;
  const repaymentBehavior = `Modeled behavior: ${Math.round(
    row.placement_prob_6m * 100
  )}% six-month placement outlook with mid salary band ~${midSal.toFixed(
    0
  )} LPA reference; repayment_confidence desk read ${repaymentConfidenceDisplay(row)}%.`;

  return { whyRisky, improves, repaymentBehavior };
}

export function nbfcBestApplicants(
  items: NBFCApplicationListItem[],
  limit: number
): NBFCApplicationListItem[] {
  return [...items]
    .filter((i) => i.status !== "rejected")
    .sort((a, b) => {
      const rc =
        (b.repayment_confidence_pct ?? 0) - (a.repayment_confidence_pct ?? 0);
      if (rc !== 0) return rc;
      const ra = a.roi_payback_years ?? 99;
      const rb = b.roi_payback_years ?? 99;
      return ra - rb;
    })
    .slice(0, limit);
}

const riskOrder: Record<NBFCApplicationListItem["risk_label"], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/** Strong repayment outlook and faster modeled payback first; lower risk as tie-breaker. */
export function sortNbfcApplicationsForDesk(
  items: NBFCApplicationListItem[]
): NBFCApplicationListItem[] {
  return [...items].sort((a, b) => {
    const rcB = repaymentConfidenceDisplay(b);
    const rcA = repaymentConfidenceDisplay(a);
    if (rcB !== rcA) return rcB - rcA;
    const roiA = a.roi_payback_years ?? 999;
    const roiB = b.roi_payback_years ?? 999;
    if (roiA !== roiB) return roiA - roiB;
    return riskOrder[a.risk_label] - riskOrder[b.risk_label];
  });
}
