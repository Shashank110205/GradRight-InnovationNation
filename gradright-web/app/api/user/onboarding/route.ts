/**
 * C-004: Placement probabilities and risk labels live only in `risk_scores` — not duplicated on `student_profiles`.
 * C-005: Onboarding answers → profile column map is documented on `upsertStudentProfileFromOnboarding`.
 */
import { generateOnboardingRiskOneLiner } from "@/lib/ai/generate-onboarding-liner";
import { createServerClient } from "@/lib/db/supabase";
import { insertRiskScoreFromOnboarding } from "@/lib/db/queries/risk_scores";
import { upsertStudentProfileFromOnboarding } from "@/lib/db/queries/student_profiles";
import {
  ensureUserFromAuth,
  setUserOnboardingAndConsentComplete,
  updateUserXP,
} from "@/lib/db/queries/users";
import {
  logUserEvent,
  recordGamificationReward,
} from "@/lib/db/queries/user_activity";
import { fetchRiskEngineScore } from "@/lib/onboarding/call-risk-engine";
import { onboardingAnswersSchema } from "@/lib/onboarding/onboarding-answers-schema";
import { deriveLoanEligibilityBand } from "@/lib/onboarding/loan-eligibility";
import { buildUniversityMatches } from "@/lib/onboarding/university-matches";
import { mergeProfileCompletenessIntoMetadata } from "@/lib/profile/calculate-profile-completeness";
import { applyProfileHubPatch } from "@/lib/profile/user-profile-hub";
import {
  apiError,
  apiSuccess,
  type GradRightScore,
} from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  answers: onboardingAnswersSchema,
  consentAccepted: z.literal(true),
});

function buildGradRightScore(input: {
  answers: z.infer<typeof onboardingAnswersSchema>;
  risk: Awaited<ReturnType<typeof fetchRiskEngineScore>>;
  oneLiner: string;
}): GradRightScore {
  const loan_eligibility_band = deriveLoanEligibilityBand(
    input.risk.risk_label,
    input.answers
  );

  return {
    university_matches: buildUniversityMatches(
      input.answers,
      input.risk.placement_prob_6m
    ),
    salary_band_low_lpa: input.risk.salary_band_low_lpa,
    salary_band_high_lpa: input.risk.salary_band_high_lpa,
    loan_eligibility_band,
    risk_label: input.risk.risk_label,
    risk_one_liner: input.oneLiner,
    placement_intelligence_tier:
      input.risk.placement_intelligence_tier ?? "preliminary",
    grad_score_display_title:
      input.risk.grad_score_display_title ?? "Your Preliminary GradScore",
    score_confidence: input.risk.score_confidence ?? "medium",
    score_confidence_user_message:
      input.risk.score_confidence_user_message ??
      "Confidence: Medium (benchmark data + profile data)",
    score_data_coverage_percentage:
      input.risk.score_data_coverage_percentage ?? 72,
    intelligence_source_note:
      input.risk.intelligence_source_note ?? "Using benchmark intelligence",
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(parsed.error.flatten().formErrors.join("; ") || "Invalid body"),
      { status: 400 }
    );
  }

  const { answers } = parsed.data;

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  try {
    const appUser = await ensureUserFromAuth({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata as { full_name?: string },
    });

    const [risk, _profile] = await Promise.all([
      fetchRiskEngineScore(answers),
      upsertStudentProfileFromOnboarding(appUser.id, answers),
    ]);

    const loan_eligibility_band = deriveLoanEligibilityBand(
      risk.risk_label,
      answers
    );

    const oneLiner = await generateOnboardingRiskOneLiner({
      answers,
      riskLabel: risk.risk_label,
      salaryLow: risk.salary_band_low_lpa,
      salaryHigh: risk.salary_band_high_lpa,
      loanEligibilityBand: loan_eligibility_band,
    });

    await insertRiskScoreFromOnboarding({
      userId: appUser.id,
      answers: {
        ...answers,
        _placement_intel: {
          score_confidence: risk.score_confidence ?? "medium",
          score_data_coverage_percentage:
            risk.score_data_coverage_percentage ?? 72,
          placement_intelligence_tier:
            risk.placement_intelligence_tier ?? "preliminary",
          grad_score_display_title:
            risk.grad_score_display_title ?? "Your Preliminary GradScore",
          intelligence_source_note:
            risk.intelligence_source_note ?? "Using benchmark intelligence",
          score_confidence_user_message:
            risk.score_confidence_user_message ??
            "Confidence: Medium (benchmark data + profile data)",
        },
      },
      risk,
      aiSummary: oneLiner,
    });

    await setUserOnboardingAndConsentComplete(appUser.id);

    await updateUserXP(appUser.id, 50);
    await recordGamificationReward(appUser.id, "onboarding_complete", 50);
    await logUserEvent(appUser.id, "onboarding_complete", {
      risk_label: risk.risk_label,
      salary_band_low_lpa: risk.salary_band_low_lpa,
      salary_band_high_lpa: risk.salary_band_high_lpa,
    });

    const score = buildGradRightScore({ answers, risk, oneLiner });

    const prevMeta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const withHub = applyProfileHubPatch(prevMeta, {
      onboarding: {
        submitted_at: new Date().toISOString(),
        answers: { ...answers } as Record<string, unknown>,
      },
    });
    const nextMeta = mergeProfileCompletenessIntoMetadata(withHub);
    const { error: hubErr } = await supabase.auth.updateUser({ data: nextMeta });
    if (hubErr) {
      console.error("[POST /api/user/onboarding] profile_hub", hubErr);
    }

    return NextResponse.json(apiSuccess(score));
  } catch (e) {
    console.error("[POST /api/user/onboarding]", e);
    const message =
      e instanceof Error ? e.message : "Onboarding submission failed";
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
