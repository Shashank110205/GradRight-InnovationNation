import type { NBFCApplicationListItem, LoanApplicationStatus, RiskLabel } from "@/lib/types";

export type NbfcDecisionFlag = "auto_approved" | "human_review_required";

export type NbfcMatchRecord = {
  id: string;
  applicant_name: string;
  cgpa: number | null;
  target_country: string;
  loan_requirement_inr: number;
  risk_score: number;
  risk_label: RiskLabel;
  approval_probability: number;
  confidence_score: number;
  decision_flag: NbfcDecisionFlag;
  deterministic_explanation: string;
  status: LoanApplicationStatus;
  document_completion_level: number;
  last_activity_at: string;
  repayment_confidence: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function toRiskScore(item: NBFCApplicationListItem): number {
  const base = item.repayment_score ?? Math.round(item.placement_prob_6m * 100);
  return clamp(base, 0, 100);
}

export function toApprovalProbability(item: NBFCApplicationListItem): number {
  const placement = clamp(Math.round(item.placement_prob_6m * 100), 0, 100);
  const riskPenalty = item.risk_label === "high" ? 22 : item.risk_label === "medium" ? 10 : 0;
  const docsBoost = Math.round((item.document_completeness_pct / 100) * 12);
  return clamp(placement + docsBoost - riskPenalty, 0, 100);
}

export function toConfidenceScore(item: NBFCApplicationListItem): number {
  const approval = toApprovalProbability(item);
  const repayment = clamp(item.repayment_confidence_pct ?? 0, 0, 100);
  return clamp(Math.round(approval * 0.6 + repayment * 0.4), 0, 100);
}

export function toDecisionFlag(item: NBFCApplicationListItem): NbfcDecisionFlag {
  const confidence = toConfidenceScore(item);
  const docsReady = item.document_completeness_pct >= 72;
  const riskOk = item.risk_label !== "high";
  if (confidence >= 75 && docsReady && riskOk) {
    return "auto_approved";
  }
  return "human_review_required";
}

export function buildDeterministicExplanation(item: NBFCApplicationListItem): string {
  const placementPct = Math.round(item.placement_prob_6m * 100);
  const repayment = clamp(item.repayment_confidence_pct ?? 0, 0, 100);
  const riskScore = toRiskScore(item);
  const decision = toDecisionFlag(item);
  const trigger = decision === "auto_approved" ? "Auto Approved" : "Human Review Required";
  return `${trigger}: placement_6m=${placementPct}%, docs=${item.document_completeness_pct}%, risk_label=${item.risk_label}, risk_score=${riskScore}, repayment_confidence=${repayment}%. Rule: confidence>=75, docs>=72, and risk not high for automatic approval.`;
}

export function toMatchRecord(
  item: NBFCApplicationListItem,
  cgpa: number | null
): NbfcMatchRecord {
  const confidence = toConfidenceScore(item);
  return {
    id: item.id,
    applicant_name: item.applicant_name,
    cgpa,
    target_country: item.target_country,
    loan_requirement_inr: item.loan_amount_requested,
    risk_score: toRiskScore(item),
    risk_label: item.risk_label,
    approval_probability: toApprovalProbability(item),
    confidence_score: confidence,
    decision_flag: toDecisionFlag(item),
    deterministic_explanation: buildDeterministicExplanation(item),
    status: item.status,
    document_completion_level: item.document_completeness_pct,
    last_activity_at: item.submitted_at,
    repayment_confidence: clamp(item.repayment_confidence_pct ?? 0, 0, 100),
  };
}
