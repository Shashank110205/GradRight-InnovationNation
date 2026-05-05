import { generateCareerRiskSummary } from "@/lib/ai/generate-career-risk-summary";
import { buildRiskEnginePayloadFromProfile } from "@/lib/career/build-risk-engine-payload";
import {
  countRiskScoresByUserId,
  insertRiskScoreRecord,
} from "@/lib/db/queries/risk_scores";
import {
  getStudentProfileByUserId,
  updateStudentProfileFromRiskForm,
} from "@/lib/db/queries/student_profiles";
import { ensureUserFromAuth, updateUserXP } from "@/lib/db/queries/users";
import {
  logUserEvent,
  recordGamificationReward,
} from "@/lib/db/queries/user_activity";
import { fetchRiskEngineScoreFromBody } from "@/lib/onboarding/call-risk-engine";
import type { RiskScorePostBody } from "@/lib/validations/risk-score-input";

export async function runCareerRiskScoreForUser(opts: {
  authUserId: string;
  authEmail: string | undefined;
  authMetadata: { full_name?: string };
  body: RiskScorePostBody;
}) {
  const appUser = await ensureUserFromAuth({
    id: opts.authUserId,
    email: opts.authEmail,
    user_metadata: opts.authMetadata,
  });

  let profile = await getStudentProfileByUserId(appUser.id);
  if (!profile) {
    const err = new Error("ONBOARDING_REQUIRED");
    (err as Error & { code?: string }).code = "ONBOARDING_REQUIRED";
    throw err;
  }

  await updateStudentProfileFromRiskForm(appUser.id, opts.body);
  profile = await getStudentProfileByUserId(appUser.id);
  if (!profile) {
    throw new Error("Profile missing after update");
  }

  const engineInput = buildRiskEnginePayloadFromProfile(profile, {});
  const risk = await fetchRiskEngineScoreFromBody(engineInput);

  const aiSummary = await generateCareerRiskSummary({
    risk,
    profile,
    engineInput,
  });

  const priorCount = await countRiskScoresByUserId(appUser.id);
  const isFirstEver = priorCount === 0;

  const inputSnapshot: Record<string, unknown> = {
    engine_input: engineInput,
    profile_snapshot: {
      broad_field: profile.broad_field,
      target_country: profile.target_country,
      degree_type: profile.degree_type,
      profile_completeness_score: profile.profile_completeness_score,
      risk_appetite: profile.risk_appetite ?? "medium",
      career_path_clarity: profile.career_path_clarity ?? "unknown",
    },
    form_overrides: opts.body,
    engine_readiness: {
      profile_completeness_score: risk.profile_completeness_score ?? 0,
      readiness_signals: risk.readiness_signals ?? {},
      strengths: risk.strengths ?? [],
      improvement_areas: risk.improvement_areas ?? [],
    },
  };

  const row = await insertRiskScoreRecord({
    userId: appUser.id,
    inputSnapshot,
    risk,
    aiSummary,
  });

  await logUserEvent(appUser.id, "risk_score_generated", {
    risk_score_id: row.id,
    risk_label: row.risk_label,
    first_ever: isFirstEver,
  });

  if (isFirstEver) {
    await updateUserXP(appUser.id, 60);
    await recordGamificationReward(appUser.id, "risk_score_generated", 60);
  }

  return row;
}
