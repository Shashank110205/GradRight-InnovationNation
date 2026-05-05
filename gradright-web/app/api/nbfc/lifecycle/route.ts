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
    const lifecycle = records.map((item) => ({
      id: item.id,
      applicant_name: item.name,
      stage: item.lifecycle_stage,
      risk_classification: item.risk_label,
      repayment_confidence: item.repayment_probability,
      emi_estimate: item.emi_estimate,
      decision_flag: item.decision_flag,
    }));
    const stageMap = new Map<string, number>();
    const health = { strong: 0, watch: 0, stressed: 0 };
    for (const row of lifecycle) {
      stageMap.set(row.stage, (stageMap.get(row.stage) ?? 0) + 1);
      if (row.repayment_confidence >= 75) health.strong += 1;
      else if (row.repayment_confidence >= 55) health.watch += 1;
      else health.stressed += 1;
    }
    const lifecycleStageBreakdown = Array.from(stageMap.entries()).map(([stage, count]) => ({
      stage,
      count,
    }));
    const repaymentHealthDistribution = [
      { band: "Strong", count: health.strong },
      { band: "Watch", count: health.watch },
      { band: "Stressed", count: health.stressed },
    ];

    return NextResponse.json(
      apiSuccess({
        lifecycle,
        analytics: { lifecycle_stage_breakdown: lifecycleStageBreakdown, repayment_health_distribution: repaymentHealthDistribution },
        updated_at: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[GET /api/nbfc/lifecycle]", e);
    return NextResponse.json(apiError("Could not load lifecycle"), { status: 500 });
  }
}
