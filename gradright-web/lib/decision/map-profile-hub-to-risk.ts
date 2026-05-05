/**
 * Maps `user_metadata` (profile_hub + profile_intelligence) to risk-service payloads.
 * Scoring math stays in Python — this is input shaping only.
 */
import {
  primaryCountryCodeFromTargetCountry,
  programTypeFromBroadField,
} from "@/lib/onboarding/map-risk-input";
import type { RiskEngineRequestBody } from "@/lib/onboarding/map-risk-input";
import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function programTypeToTargetSector(
  pt: string
): "IT" | "BFSI" | "Healthcare" | "Manufacturing" | "Other" {
  if (pt === "CS") return "IT";
  if (pt === "Business") return "BFSI";
  if (pt === "Life Sciences") return "Healthcare";
  if (pt === "Engineering") return "Manufacturing";
  return "Other";
}

export type AdmissionRequestBody = {
  cgpa_normalized: number;
  gre_score: number | null;
  ielts_score: number | null;
  work_experience_years: number;
  target_program: string;
  target_university_tier: "Top10" | "Top50" | "Top100" | "Other";
  target_country: string;
};

/** Map grounded tier → admission endpoint selectivity band (Python scorer). */
export function groundedTierToUniversityTier(
  tier: "safe" | "moderate" | "ambitious"
): "Top10" | "Top50" | "Top100" | "Other" {
  switch (tier) {
    case "ambitious":
      return "Top10";
    case "moderate":
      return "Top50";
    case "safe":
      return "Top100";
    default:
      return "Other";
  }
}

export function mapUserMetadataToScoreInput(
  meta: Record<string, unknown>
): RiskEngineRequestBody | null {
  const hub = getProfileHubFromUserMetadata(meta);
  const answers =
    hub.onboarding?.answers && isRecord(hub.onboarding.answers)
      ? hub.onboarding.answers
      : null;
  if (!answers) return null;

  const piRaw = meta.profile_intelligence;
  const pi = isRecord(piRaw) ? piRaw : {};
  const resume =
    isRecord(pi.resume) ? pi.resume : hub.resume_snapshot && isRecord(hub.resume_snapshot)
      ? hub.resume_snapshot
      : null;

  const broadField =
    typeof answers.broad_field === "string" ? answers.broad_field : "";
  const programType = programTypeFromBroadField(broadField || undefined);
  const targetCountry = primaryCountryCodeFromTargetCountry(
    typeof answers.target_country === "string" ? answers.target_country : ""
  );

  const cgpaRaw =
    resume && typeof resume.cgpa === "number" ? resume.cgpa / 10 : 0;
  const cgpa_normalized = Math.min(1, Math.max(0, cgpaRaw));

  let internship_months = 0;
  if (resume && Array.isArray(resume.internships)) {
    internship_months = Math.min(24, resume.internships.length * 4);
  }

  let work_experience_years = 0;
  if (
    hub.resume_gemini?.estimated_total_experience_years != null &&
    typeof hub.resume_gemini.estimated_total_experience_years === "number"
  ) {
    work_experience_years = Math.min(
      12,
      Math.max(0, Math.round(hub.resume_gemini.estimated_total_experience_years))
    );
  } else if (
    typeof answers.current_academic_level === "string" &&
    answers.current_academic_level.includes("3+")
  ) {
    work_experience_years = 2;
  }

  const certification_count =
    resume && Array.isArray(resume.skills) && resume.skills.length >= 8 ? 1 : 0;

  return {
    institute_tier: "Other",
    program_type: programType,
    cgpa_normalized,
    internship_months,
    certification_count,
    target_country: targetCountry,
    target_sector: programTypeToTargetSector(programType),
    work_experience_years,
  };
}

export function buildAdmissionBodyForUniversity(input: {
  meta: Record<string, unknown>;
  universityCountryName: string;
  groundedTier: "safe" | "moderate" | "ambitious";
}): AdmissionRequestBody | null {
  const scoreLike = mapUserMetadataToScoreInput(input.meta);
  if (!scoreLike) return null;

  const hub = getProfileHubFromUserMetadata(input.meta);
  const answers =
    hub.onboarding?.answers && isRecord(hub.onboarding.answers)
      ? hub.onboarding.answers
      : {};
  const degree =
    typeof answers.degree_type === "string" ? answers.degree_type : "Graduate";
  const field =
    typeof answers.broad_field === "string" ? answers.broad_field : "General";

  const gre =
    typeof (answers as { gre_score?: unknown }).gre_score === "number"
      ? (answers as { gre_score: number }).gre_score
      : null;
  const ielts =
    typeof (answers as { ielts_score?: unknown }).ielts_score === "number"
      ? (answers as { ielts_score: number }).ielts_score
      : null;

  return {
    cgpa_normalized: scoreLike.cgpa_normalized,
    gre_score: gre,
    ielts_score: ielts,
    work_experience_years: scoreLike.work_experience_years,
    target_program: `${degree} — ${field}`.slice(0, 200),
    target_university_tier: groundedTierToUniversityTier(input.groundedTier),
    target_country: primaryCountryCodeFromTargetCountry(input.universityCountryName),
  };
}
