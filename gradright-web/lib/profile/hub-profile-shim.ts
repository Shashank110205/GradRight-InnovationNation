import type { StudentProfile } from "@/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Minimal `StudentProfile` built only from `user_metadata` (hub + profile_intelligence). Server-side only. */
export function shimStudentProfileFromUserMetadata(
  meta: Record<string, unknown>,
  userId: string
): StudentProfile | null {
  const hubRaw = meta.profile_hub;
  const hub = isRecord(hubRaw) ? hubRaw : null;
  const answers =
    hub?.onboarding && isRecord(hub.onboarding) && isRecord(hub.onboarding.answers)
      ? hub.onboarding.answers
      : {};

  const piRaw = meta.profile_intelligence;
  const pi = isRecord(piRaw) ? piRaw : {};
  const resume =
    isRecord(pi.resume) ? pi.resume : hub?.resume_snapshot && isRecord(hub.resume_snapshot)
      ? hub.resume_snapshot
      : null;
  const goals =
    isRecord(pi.goals) ? pi.goals : hub?.goals_snapshot && isRecord(hub.goals_snapshot)
      ? hub.goals_snapshot
      : null;

  const target_country =
    typeof answers.target_country === "string" ? answers.target_country.trim() || null : null;
  const degree_type =
    typeof answers.degree_type === "string" ? answers.degree_type.trim() || null : null;
  const broad_field =
    typeof answers.broad_field === "string"
      ? answers.broad_field.trim() || null
      : typeof goals?.domain === "string"
        ? goals.domain.trim() || null
        : null;

  const cgpa = resume && typeof resume.cgpa === "number" ? resume.cgpa : null;
  const cgpa_scale =
    resume && typeof resume.cgpa_scale === "number" ? resume.cgpa_scale : 10;

  const sysPc = hub?.system && isRecord(hub.system) ? hub.system.profile_completeness : undefined;
  const pc =
    typeof sysPc === "number"
      ? sysPc
      : typeof pi.profile_completeness_score === "number"
        ? pi.profile_completeness_score
        : 0;

  const skills =
    resume && Array.isArray(resume.skills)
      ? resume.skills.filter((s): s is string => typeof s === "string")
      : [];

  const now = new Date().toISOString();

  return {
    id: "hub-shim",
    user_id: userId,
    target_country,
    target_intake:
      typeof answers.target_intake === "string" ? answers.target_intake.trim() || null : null,
    degree_type,
    broad_field,
    current_academic_level:
      typeof answers.current_academic_level === "string"
        ? answers.current_academic_level.trim() || null
        : null,
    work_experience_years:
      typeof resume?.estimated_total_experience_years === "number"
        ? resume.estimated_total_experience_years
        : 0,
    loan_needed:
      typeof answers.loan_needed === "boolean"
        ? answers.loan_needed
        : typeof answers.loan_needed === "string"
          ? answers.loan_needed === "true"
          : false,
    budget_band_usd:
      typeof answers.budget_band_usd === "string" ? answers.budget_band_usd.trim() || null : null,
    institute_name: typeof resume?.institute === "string" ? resume.institute : null,
    institute_tier: null,
    cgpa,
    cgpa_scale: cgpa_scale > 0 ? cgpa_scale : 10,
    internship_count: Array.isArray(resume?.internships) ? resume.internships.length : 0,
    internship_months_total: 0,
    certification_count: 0,
    target_universities: [],
    gre_score: typeof resume?.gre_score === "number" ? resume.gre_score : null,
    ielts_score: null,
    toefl_score: null,
    parent_contact_email: null,
    resume_file_url: null,
    aspiration_text:
      typeof goals?.five_year_goal === "string"
        ? goals.five_year_goal
        : typeof goals?.target_role === "string"
          ? goals.target_role
          : null,
    five_year_goal: typeof goals?.five_year_goal === "string" ? goals.five_year_goal : null,
    dream_role: typeof goals?.target_role === "string" ? goals.target_role : null,
    parsed_resume_json: resume ? { ...resume } : {},
    extracted_skills: skills,
    extracted_projects: Array.isArray(resume?.projects) ? resume.projects : [],
    extracted_internships: Array.isArray(resume?.internships) ? resume.internships : [],
    scholarship_priority: typeof answers.scholarship_priority === "string"
      ? answers.scholarship_priority
      : null,
    profile_completeness_score: Math.min(100, Math.max(0, Math.round(pc))),
    funding_value_focus: "balanced",
    career_path_clarity: broad_field ? "emerging" : "exploring",
    risk_appetite: "moderate",
    experience_years:
      typeof resume?.estimated_total_experience_years === "number"
        ? resume.estimated_total_experience_years
        : 0,
    enrichment_status: null,
    last_enriched_at: null,
    created_at: now,
    updated_at: now,
  };
}
