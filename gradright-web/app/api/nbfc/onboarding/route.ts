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

  const items = await getNBFCApplications({ includeDrafts: false, limit: 250 });
  const records = buildCockpitRecords(items).slice(0, 10);

  return NextResponse.json(
    apiSuccess({
      students: records.map((r) => ({
        id: r.id,
        name: r.name,
        onboarding_state: r.onboarding_state,
        onboarding_progress: r.onboarding_progress,
        checklist: {
          kyc: r.doc_completion >= 70 ? "complete" : "pending",
          income_proof: r.doc_completion >= 80 ? "complete" : "pending",
          admission_proof: r.doc_completion >= 65 ? "complete" : "pending",
          consent_recording: r.onboarding_progress >= 60 ? "complete" : "pending",
        },
      })),
      flow: [
        {
          step: 1,
          title: "Session Initiated",
          detail:
            "Approved student receives NBFC video onboarding link. Session captures video, audio, geo-location, and device metadata.",
        },
        {
          step: 2,
          title: "Speech Intelligence",
          detail:
            "Speech-to-text extracts structured declarations for income, employment, loan purpose, and consent acknowledgements.",
        },
        {
          step: 3,
          title: "Vision + Identity Signals",
          detail:
            "Computer vision estimates age band, validates liveness, and cross-checks ID signal consistency against submitted records.",
        },
        {
          step: 4,
          title: "Auto-Fill + Risk Policy",
          detail:
            "Application fields are auto-filled with extracted attributes and evaluated against deterministic policy and score thresholds.",
        },
        {
          step: 5,
          title: "Offer Generation",
          detail:
            "Context engine classifies borrower profile and generates personalized offer terms aligned to NBFC underwriting policy.",
        },
        {
          step: 6,
          title: "Audit Trail",
          detail:
            "Every interaction, model output, and policy decision is stored for compliance, dispute review, and regulator-ready audits.",
        },
      ],
      outcomes: [
        "Fraud reduction with identity and liveness checks",
        "Higher data accuracy via AI-assisted auto-fill",
        "Faster loan turnaround with policy-first automation",
      ],
      controls: ["Send Reminder", "Resume Onboarding", "Verify Documents"],
      updated_at: new Date().toISOString(),
    })
  );
}
