import { createServerClient } from "@/lib/db/supabase";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { storedOnboardingSnapshotSchema } from "@/lib/onboarding/onboarding-answers-schema";
import { deriveLoanEligibilityBand } from "@/lib/onboarding/loan-eligibility";
import { buildUniversityMatches } from "@/lib/onboarding/university-matches";
import { apiError, apiSuccess, type GradRightScore } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role === "nbfc_supervisor") {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  if (!appUser.onboarding_complete) {
    return NextResponse.json(apiError("Not ready"), { status: 400 });
  }

  const latest = await getLatestRiskScoreByUserId(appUser.id);
  if (!latest) {
    return NextResponse.json(apiError("No score on file"), { status: 404 });
  }

  const parsed = storedOnboardingSnapshotSchema.safeParse(latest.input_snapshot);
  if (!parsed.success) {
    return NextResponse.json(apiError("Invalid stored answers"), { status: 422 });
  }

  const { _placement_intel, ...answers } = parsed.data;
  const loan_eligibility_band = deriveLoanEligibilityBand(
    latest.risk_label,
    answers
  );

  const score: GradRightScore = {
    university_matches: buildUniversityMatches(answers, latest.placement_prob_6m),
    salary_band_low_lpa: latest.salary_band_low_lpa,
    salary_band_high_lpa: latest.salary_band_high_lpa,
    loan_eligibility_band,
    risk_label: latest.risk_label,
    risk_one_liner: latest.ai_summary ?? "",
    placement_intelligence_tier:
      _placement_intel?.placement_intelligence_tier ?? "preliminary",
    grad_score_display_title:
      _placement_intel?.grad_score_display_title ?? "Your Preliminary GradScore",
    score_confidence: _placement_intel?.score_confidence ?? "medium",
    score_confidence_user_message:
      _placement_intel?.score_confidence_user_message ??
      "Confidence: Medium (benchmark data + profile data)",
    score_data_coverage_percentage:
      _placement_intel?.score_data_coverage_percentage ?? 72,
    intelligence_source_note:
      _placement_intel?.intelligence_source_note ?? "Using benchmark intelligence",
  };

  return NextResponse.json(apiSuccess(score));
}
