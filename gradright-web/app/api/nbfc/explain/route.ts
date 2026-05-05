import { getNBFCApplications } from "@/lib/db/queries/applications";
import { buildCockpitRecords, explainRecord } from "@/lib/nbfc/cockpit-data";
import { requireNbfcSupervisorApi } from "@/lib/nbfc/require-nbfc-api";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

type ExplainRequest = {
  candidate_id?: string;
  query?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireNbfcSupervisorApi();
  if ("error" in auth) {
    return NextResponse.json(apiError(auth.error), { status: auth.status });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ExplainRequest;
    const items = await getNBFCApplications({ includeDrafts: false, limit: 250 });
    const records = buildCockpitRecords(items);
    const q = (body.query ?? "").toLowerCase();
    const target =
      records.find((r) => r.id === body.candidate_id) ??
      records.find((r) => q && r.name.toLowerCase().includes(q)) ??
      records[0];

    if (!target) {
      return NextResponse.json(apiError("No records available for explainability"), { status: 404 });
    }

    const structured = {
      candidate: target.name,
      decision_flag: target.decision_flag,
      risk_label: target.risk_label,
      risk_score: target.risk_score,
      repayment_probability: target.repayment_probability,
      approval_likelihood: target.approval_likelihood,
      doc_completion: target.doc_completion,
      explanation: explainRecord(target),
      recommended_action:
        target.decision_flag === "auto_approved"
          ? "Proceed to onboarding and offer generation."
          : "Route to underwriter for manual review and additional document checks.",
    };
    return NextResponse.json(apiSuccess(structured));
  } catch (e) {
    console.error("[POST /api/nbfc/explain]", e);
    return NextResponse.json(apiError("Could not generate explanation"), { status: 500 });
  }
}
