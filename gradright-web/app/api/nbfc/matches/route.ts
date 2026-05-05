import { getNBFCApplications } from "@/lib/db/queries/applications";
import { buildCockpitRecords, explainRecord } from "@/lib/nbfc/cockpit-data";
import { requireNbfcSupervisorApi } from "@/lib/nbfc/require-nbfc-api";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const auth = await requireNbfcSupervisorApi();
  if ("error" in auth) {
    return NextResponse.json(apiError(auth.error), { status: auth.status });
  }

  try {
    const items = await getNBFCApplications({ includeDrafts: false, limit: 250 });
    const matches = buildCockpitRecords(items)
      .filter((r) => r.approval_likelihood >= 55 || r.decision_flag === "auto_approved")
      .sort((a, b) => b.approval_likelihood - a.approval_likelihood)
      .map((r) => ({
        id: r.id,
        applicant_name: r.name,
        cgpa: r.cgpa,
        target_country: r.target_country,
        loan_requirement_inr: r.loan_requirement_inr,
        risk_score: r.risk_score,
        risk_label: r.risk_label,
        repayment_probability: r.repayment_probability,
        approval_probability: r.approval_likelihood,
        confidence_score: r.approval_likelihood,
        decision_flag: r.decision_flag,
        deterministic_explanation: explainRecord(r),
      }));
    return NextResponse.json(apiSuccess(matches));
  } catch (e) {
    console.error("[GET /api/nbfc/matches]", e);
    return NextResponse.json(apiError("Could not load matches"), { status: 500 });
  }
}
