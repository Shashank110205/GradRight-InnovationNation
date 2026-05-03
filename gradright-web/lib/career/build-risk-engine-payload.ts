import type { RiskEngineRequestBody } from "@/lib/onboarding/map-risk-input";
import {
  primaryCountryCodeFromTargetCountry,
  programTypeFromBroadField,
} from "@/lib/onboarding/map-risk-input";
import type { StudentProfile } from "@/lib/types";
import type { RiskScorePostBody } from "@/lib/validations/risk-score-input";
import {
  instituteTierSchema,
  RiskScoreInputSchema,
} from "@/lib/validations/risk-score-input";

function normalizeCgpa(profile: StudentProfile, overrides: RiskScorePostBody): number {
  const scale =
    overrides.cgpa_scale ??
    (profile.cgpa_scale > 0 ? profile.cgpa_scale : 10);
  const cgpa =
    overrides.cgpa ??
    profile.cgpa ??
    0.72 * scale;
  const ratio = cgpa / scale;
  return Math.min(1, Math.max(0, ratio));
}

export function buildRiskEnginePayloadFromProfile(
  profile: StudentProfile,
  overrides: RiskScorePostBody
): RiskEngineRequestBody {
  const programType = programTypeFromBroadField(profile.broad_field);
  const tierCandidate =
    overrides.institute_tier ?? profile.institute_tier ?? "Other";
  const tierParsed = instituteTierSchema.safeParse(tierCandidate);
  const tier = tierParsed.success ? tierParsed.data : "Other";

  const raw: RiskEngineRequestBody = {
    institute_tier: tier,
    program_type: programType,
    cgpa_normalized: normalizeCgpa(profile, overrides),
    internship_months:
      overrides.internship_months_total ??
      profile.internship_months_total ??
      0,
    certification_count:
      overrides.certification_count ?? profile.certification_count ?? 0,
    target_country: primaryCountryCodeFromTargetCountry(profile.target_country),
    target_sector: programType,
    work_experience_years:
      overrides.work_experience_years ?? profile.work_experience_years ?? 0,
  };

  return RiskScoreInputSchema.parse(raw);
}
