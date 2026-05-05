import { parseTargetCountries } from "@/lib/types";

import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Deterministic 0–100 completeness from `user_metadata` (profile_hub + profile_intelligence).
 * Same inputs → same score everywhere.
 */
export function calculateProfileCompleteness(meta: Record<string, unknown>): number {
  const hub = getProfileHubFromUserMetadata(meta);
  const piRaw = meta.profile_intelligence;
  const pi = isRecord(piRaw) ? piRaw : {};

  const resumePi = isRecord(pi.resume) ? pi.resume : null;
  const resumeHub = hub.resume_snapshot && isRecord(hub.resume_snapshot as object)
    ? (hub.resume_snapshot as Record<string, unknown>)
    : null;
  const resumeGem = hub.resume_gemini;

  const resume = resumePi ?? resumeHub ?? {};

  const goalsPi = isRecord(pi.goals) ? pi.goals : null;
  const goalsHub = hub.goals_snapshot && isRecord(hub.goals_snapshot as object)
    ? (hub.goals_snapshot as Record<string, unknown>)
    : null;
  const goals = goalsPi ?? goalsHub ?? {};

  const answers =
    hub.onboarding?.answers && isRecord(hub.onboarding.answers)
      ? hub.onboarding.answers
      : {};

  let score = 0;

  const countries = parseTargetCountries(
    typeof answers.target_country === "string" ? answers.target_country : ""
  );
  if (countries.length > 0) score += 20;

  if (typeof answers.broad_field === "string" && answers.broad_field.trim()) {
    score += 10;
  }

  if (typeof answers.budget_band_usd === "string" && answers.budget_band_usd.trim()) {
    score += 10;
  }

  const cgpa = typeof resume.cgpa === "number" ? resume.cgpa : 0;
  if (cgpa > 0) score += 10;

  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const projectsGem =
    resumeGem && Array.isArray(resumeGem.projects) ? resumeGem.projects : [];
  const projectCount = Math.max(projects.length, projectsGem.length);
  if (projectCount >= 2) score += 10;

  const internships = Array.isArray(resume.internships) ? resume.internships : [];
  const internshipsGem =
    resumeGem && Array.isArray(resumeGem.internships) ? resumeGem.internships : [];
  if (internships.length >= 1 || internshipsGem.length >= 1) score += 10;

  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const skillsGem =
    resumeGem && Array.isArray(resumeGem.skills) ? resumeGem.skills : [];
  const skillCount = Math.max(skills.length, skillsGem.length);
  if (skillCount >= 3) score += 10;

  let extracurricularItems = 0;
  const ex = resume.extracurricular;
  if (ex && isRecord(ex)) {
    for (const v of Object.values(ex)) {
      if (Array.isArray(v)) extracurricularItems += v.length;
    }
  }
  if (extracurricularItems >= 2) score += 5;

  if (typeof goals.target_role === "string" && goals.target_role.trim()) score += 5;
  if (typeof goals.domain === "string" && goals.domain.trim()) score += 5;
  if (typeof goals.five_year_goal === "string" && goals.five_year_goal.trim()) {
    score += 5;
  }

  return Math.min(100, score);
}

/** Stamp `profile_hub.system` without dropping other hub fields. */
export function mergeProfileCompletenessIntoMetadata(
  prevUserMetadata: Record<string, unknown>
): Record<string, unknown> {
  const completeness = calculateProfileCompleteness(prevUserMetadata);
  const hub = getProfileHubFromUserMetadata(prevUserMetadata);

  return {
    ...prevUserMetadata,
    profile_hub: {
      ...hub,
      system: {
        ...(hub.system ?? {}),
        profile_completeness: completeness,
        last_updated: new Date().toISOString(),
      },
    },
  };
}
