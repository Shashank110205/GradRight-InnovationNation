import { getNBFCApplications } from "@/lib/db/queries/applications";
import { buildCockpitRecords } from "@/lib/nbfc/cockpit-data";
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
    const records = buildCockpitRecords(items);
    const approved = records
      .filter((item) => item.status === "approved")
      .map((item) => ({
        id: item.id,
        applicant_name: item.name,
        cgpa: item.cgpa,
        target_country: item.target_country,
        current_status: item.status,
        document_completion_level: item.doc_completion,
        last_activity_timestamp: item.last_activity,
        reason: item.approval_reason,
      }));
    const rejected = records
      .filter((item) => item.status === "rejected")
      .map((item) => ({
        id: item.id,
        applicant_name: item.name,
        cgpa: item.cgpa,
        target_country: item.target_country,
        current_status: item.status,
        document_completion_level: item.doc_completion,
        last_activity_timestamp: item.last_activity,
        reason: item.rejection_reason,
      }));
    const rejectionReasonDistribution = [
      { reason: "Low repayment confidence", count: rejected.filter((r) => r.reason.toLowerCase().includes("repayment")).length },
      { reason: "High risk profile", count: rejected.filter((r) => r.reason.toLowerCase().includes("risk")).length },
      { reason: "Low documentation", count: rejected.filter((r) => r.document_completion_level < 70).length },
    ];
    const approvalRatio = {
      approved: approved.length,
      rejected: rejected.length,
    };

    return NextResponse.json(
      apiSuccess({
        approved,
        rejected,
        analytics: { approval_ratio: approvalRatio, rejection_reason_distribution: rejectionReasonDistribution },
        updated_at: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[GET /api/nbfc/applications-overview]", e);
    return NextResponse.json(apiError("Could not load applications overview"), { status: 500 });
  }
}
