import type { NBFCApplicationListItem, RiskLabel } from "@/lib/types";
import { toApprovalProbability, toConfidenceScore, toDecisionFlag, toRiskScore } from "@/lib/nbfc/cockpit-model";

export type NbfcCockpitRecord = {
  id: string;
  name: string;
  cgpa: number;
  target_country: string;
  loan_requirement_inr: number;
  family_income_lpa: number;
  risk_score: number;
  risk_label: RiskLabel;
  repayment_probability: number;
  approval_likelihood: number;
  decision_flag: "auto_approved" | "human_review_required";
  status: "approved" | "rejected" | "under_review" | "manual_review" | "submitted";
  doc_completion: number;
  last_activity: string;
  lifecycle_stage: "Disbursed" | "In Study" | "Grace Period" | "Repayment Started";
  emi_estimate: number;
  onboarding_state:
    | "Onboarding Started"
    | "In Progress"
    | "Paused"
    | "Awaiting Documents"
    | "Completed"
    | "Rejected";
  onboarding_progress: number;
  approval_reason: string;
  rejection_reason: string;
};

const DEMO: NbfcCockpitRecord[] = [
  {
    id: "demo-01",
    name: "Aarav Sharma",
    cgpa: 8.9,
    target_country: "United States",
    loan_requirement_inr: 3200000,
    family_income_lpa: 18,
    risk_score: 78,
    risk_label: "low",
    repayment_probability: 82,
    approval_likelihood: 86,
    decision_flag: "auto_approved",
    status: "approved",
    doc_completion: 94,
    last_activity: "2026-05-05T15:10:00.000Z",
    lifecycle_stage: "Disbursed",
    emi_estimate: 41200,
    onboarding_state: "Completed",
    onboarding_progress: 100,
    approval_reason:
      "Strong academics (CGPA 8.9), low risk label, and high document completeness support fast approval.",
    rejection_reason: "",
  },
  {
    id: "demo-02",
    name: "Ishita Verma",
    cgpa: 8.4,
    target_country: "United Kingdom",
    loan_requirement_inr: 2650000,
    family_income_lpa: 14,
    risk_score: 71,
    risk_label: "medium",
    repayment_probability: 74,
    approval_likelihood: 76,
    decision_flag: "auto_approved",
    status: "approved",
    doc_completion: 88,
    last_activity: "2026-05-05T14:20:00.000Z",
    lifecycle_stage: "In Study",
    emi_estimate: 33800,
    onboarding_state: "Completed",
    onboarding_progress: 100,
    approval_reason:
      "Balanced profile with repayment probability above threshold and verified income documentation.",
    rejection_reason: "",
  },
  {
    id: "demo-03",
    name: "Rohan Kulkarni",
    cgpa: 7.8,
    target_country: "Canada",
    loan_requirement_inr: 2800000,
    family_income_lpa: 11,
    risk_score: 59,
    risk_label: "medium",
    repayment_probability: 63,
    approval_likelihood: 61,
    decision_flag: "human_review_required",
    status: "under_review",
    doc_completion: 70,
    last_activity: "2026-05-05T12:45:00.000Z",
    lifecycle_stage: "In Study",
    emi_estimate: 35500,
    onboarding_state: "In Progress",
    onboarding_progress: 64,
    approval_reason: "",
    rejection_reason: "",
  },
  {
    id: "demo-04",
    name: "Sneha Reddy",
    cgpa: 9.1,
    target_country: "Germany",
    loan_requirement_inr: 2100000,
    family_income_lpa: 20,
    risk_score: 84,
    risk_label: "low",
    repayment_probability: 87,
    approval_likelihood: 89,
    decision_flag: "auto_approved",
    status: "approved",
    doc_completion: 96,
    last_activity: "2026-05-05T11:10:00.000Z",
    lifecycle_stage: "Repayment Started",
    emi_estimate: 26700,
    onboarding_state: "Completed",
    onboarding_progress: 100,
    approval_reason:
      "Top-tier profile with excellent academic performance and high repayment confidence from scoring signals.",
    rejection_reason: "",
  },
  {
    id: "demo-05",
    name: "Pranav Mehta",
    cgpa: 7.2,
    target_country: "Australia",
    loan_requirement_inr: 3600000,
    family_income_lpa: 8,
    risk_score: 44,
    risk_label: "high",
    repayment_probability: 49,
    approval_likelihood: 42,
    decision_flag: "human_review_required",
    status: "rejected",
    doc_completion: 62,
    last_activity: "2026-05-05T10:30:00.000Z",
    lifecycle_stage: "Grace Period",
    emi_estimate: 45500,
    onboarding_state: "Rejected",
    onboarding_progress: 100,
    approval_reason: "",
    rejection_reason:
      "High risk score with weak repayment confidence and incomplete documentation below policy thresholds.",
  },
  {
    id: "demo-06",
    name: "Nikita Rao",
    cgpa: 8.0,
    target_country: "United States",
    loan_requirement_inr: 2950000,
    family_income_lpa: 10,
    risk_score: 66,
    risk_label: "medium",
    repayment_probability: 69,
    approval_likelihood: 68,
    decision_flag: "human_review_required",
    status: "manual_review",
    doc_completion: 73,
    last_activity: "2026-05-05T09:40:00.000Z",
    lifecycle_stage: "In Study",
    emi_estimate: 37400,
    onboarding_state: "Awaiting Documents",
    onboarding_progress: 78,
    approval_reason: "",
    rejection_reason: "",
  },
  {
    id: "demo-07",
    name: "Aditya Nair",
    cgpa: 8.6,
    target_country: "Canada",
    loan_requirement_inr: 2450000,
    family_income_lpa: 17,
    risk_score: 75,
    risk_label: "low",
    repayment_probability: 79,
    approval_likelihood: 81,
    decision_flag: "auto_approved",
    status: "approved",
    doc_completion: 90,
    last_activity: "2026-05-04T18:20:00.000Z",
    lifecycle_stage: "Disbursed",
    emi_estimate: 31100,
    onboarding_state: "Completed",
    onboarding_progress: 100,
    approval_reason:
      "Low risk and strong income-supporting financial profile with complete compliance documentation.",
    rejection_reason: "",
  },
  {
    id: "demo-08",
    name: "Kavya Iyer",
    cgpa: 7.6,
    target_country: "United Kingdom",
    loan_requirement_inr: 3000000,
    family_income_lpa: 9,
    risk_score: 52,
    risk_label: "medium",
    repayment_probability: 58,
    approval_likelihood: 57,
    decision_flag: "human_review_required",
    status: "submitted",
    doc_completion: 68,
    last_activity: "2026-05-04T17:05:00.000Z",
    lifecycle_stage: "Grace Period",
    emi_estimate: 38100,
    onboarding_state: "Onboarding Started",
    onboarding_progress: 25,
    approval_reason: "",
    rejection_reason: "",
  },
  {
    id: "demo-09",
    name: "Rahul Chatterjee",
    cgpa: 8.3,
    target_country: "Germany",
    loan_requirement_inr: 1900000,
    family_income_lpa: 16,
    risk_score: 73,
    risk_label: "low",
    repayment_probability: 77,
    approval_likelihood: 80,
    decision_flag: "auto_approved",
    status: "approved",
    doc_completion: 92,
    last_activity: "2026-05-04T16:10:00.000Z",
    lifecycle_stage: "Repayment Started",
    emi_estimate: 24100,
    onboarding_state: "Completed",
    onboarding_progress: 100,
    approval_reason: "Policy aligned ticket size and high-quality academic/financial consistency.",
    rejection_reason: "",
  },
  {
    id: "demo-10",
    name: "Priya Deshpande",
    cgpa: 7.1,
    target_country: "Australia",
    loan_requirement_inr: 3400000,
    family_income_lpa: 7,
    risk_score: 41,
    risk_label: "high",
    repayment_probability: 45,
    approval_likelihood: 39,
    decision_flag: "human_review_required",
    status: "rejected",
    doc_completion: 59,
    last_activity: "2026-05-04T15:25:00.000Z",
    lifecycle_stage: "Grace Period",
    emi_estimate: 43100,
    onboarding_state: "Paused",
    onboarding_progress: 56,
    approval_reason: "",
    rejection_reason:
      "Income-to-loan ratio and repayment confidence did not meet minimum lending policy for requested ticket size.",
  },
];

function normalizedName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length ? trimmed : "Unnamed Applicant";
}

export function explainRecord(record: NbfcCockpitRecord): string {
  return `Signals: cgpa=${record.cgpa.toFixed(1)}, risk_score=${record.risk_score}, repayment_probability=${record.repayment_probability}%, doc_completion=${record.doc_completion}%, loan_requirement=INR ${Math.round(record.loan_requirement_inr).toLocaleString()}. Decision=${record.decision_flag === "auto_approved" ? "Auto Approved" : "Human Review Required"} by threshold checks on confidence, risk band, and documentation readiness.`;
}

function fromLive(item: NBFCApplicationListItem): NbfcCockpitRecord {
  const riskScore = toRiskScore(item);
  const approval = toApprovalProbability(item);
  const confidence = toConfidenceScore(item);
  const decision = toDecisionFlag(item);
  const emi = Math.round((item.loan_amount_requested * 1.11) / 120);
  return {
    id: item.id,
    name: normalizedName(item.applicant_name),
    cgpa: item.cgpa ?? 7.8,
    target_country: item.target_country || "United States",
    loan_requirement_inr: item.loan_amount_requested,
    family_income_lpa: 12,
    risk_score: riskScore,
    risk_label: item.risk_label,
    repayment_probability: Math.round(item.placement_prob_6m * 100),
    approval_likelihood: approval,
    decision_flag: decision,
    status:
      item.status === "approved" || item.status === "rejected" || item.status === "under_review" || item.status === "manual_review"
        ? item.status
        : "submitted",
    doc_completion: item.document_completeness_pct,
    last_activity: item.submitted_at,
    lifecycle_stage: item.status === "approved" ? "Disbursed" : "In Study",
    emi_estimate: emi,
    onboarding_state: decision === "auto_approved" ? "Completed" : "In Progress",
    onboarding_progress: decision === "auto_approved" ? 100 : Math.max(35, Math.round(confidence)),
    approval_reason:
      decision === "auto_approved"
        ? "Deterministic approval: confidence/risk/doc thresholds satisfied."
        : "",
    rejection_reason:
      item.status === "rejected"
        ? "Rejected due to risk-confidence mismatch and insufficient policy comfort."
        : "",
  };
}

export function buildCockpitRecords(live: NBFCApplicationListItem[]): NbfcCockpitRecord[] {
  const mapped = live.map(fromLive);
  if (mapped.length >= 10) return mapped;
  const needed = Math.max(0, 12 - mapped.length);
  return [...mapped, ...DEMO.slice(0, needed)];
}

