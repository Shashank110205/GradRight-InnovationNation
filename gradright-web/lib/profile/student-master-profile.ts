/**
 * Single source of truth for student intelligence across engines (dashboard, explore,
 * funding, profile, dataops). Merges `users`, `student_profiles`, and latest risk digest.
 * Future live feeds (universities, scholarships, visas) can hydrate this layer without
 * changing consumer call sites.
 */

import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getUserById } from "@/lib/db/queries/users";
import type { JourneyStage, StudentProfile, User } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

const MAX_PROMPT_CHARS = 3200;

export type StudentMasterProfile = {
  user_id: string;
  identity: {
    full_name: string | null;
    journey_stage: JourneyStage;
    onboarding_complete: boolean;
    wow_completed: boolean;
  };
  /** Onboarding + explicit targets */
  pathway: {
    target_countries: string[];
    target_country_raw: string | null;
    target_intake: string | null;
    degree_type: string | null;
    broad_field: string | null;
    current_academic_level: string | null;
  };
  academic: {
    institute_name: string | null;
    institute_tier: string | null;
    cgpa: number | null;
    cgpa_scale: number;
    gre_score: number | null;
    ielts_score: number | null;
    toefl_score: number | null;
    internship_count: number;
    internship_months_total: number;
    certification_count: number;
    work_experience_years: number;
    target_universities: string[];
  };
  aspirations: {
    aspiration_text: string | null;
    five_year_goal: string | null;
    dream_role: string | null;
    scholarship_priority: string | null;
  };
  funding: {
    loan_needed: boolean;
    budget_band_usd: string | null;
    parent_contact_email: string | null;
    /** Soft signals — not persisted columns; heuristics for AI context only */
    inferred_funding_comfort: "unknown" | "cautious" | "balanced" | "aggressive";
    inferred_parent_comfort: "unknown" | "low" | "medium" | "high";
  };
  extracted: {
    skills: string[];
    projects: unknown[];
    internships: unknown[];
    resume_headline: string | null;
    parsed_resume_meta: Record<string, unknown>;
  };
  intelligence: {
    profile_completeness_score: number;
    enrichment_status: string | null;
    last_enriched_at: string | null;
    has_resume_attachment: boolean;
  };
  risk: {
    risk_label: LatestRiskScoreSummary["risk_label"] | null;
    placement_prob_6m: number | null;
    salary_band_low_lpa: number | null;
    salary_band_high_lpa: number | null;
    ai_summary: string | null;
  } | null;
};

function inferFundingComfort(p: StudentProfile): StudentMasterProfile["funding"]["inferred_funding_comfort"] {
  const blob = `${p.aspiration_text ?? ""} ${p.five_year_goal ?? ""} ${p.scholarship_priority ?? ""}`.toLowerCase();
  if (/\b(scared|fear|cannot afford|can't afford|minimal loan|avoid debt)\b/.test(blob)) {
    return "cautious";
  }
  if (/\b(roi|self fund|scholarship first|minimize loan)\b/.test(blob)) return "balanced";
  if (/\b(investment|leverage|loan ok|ready to borrow)\b/.test(blob)) return "aggressive";
  return "unknown";
}

function inferParentComfort(p: StudentProfile): StudentMasterProfile["funding"]["inferred_parent_comfort"] {
  const blob = `${p.aspiration_text ?? ""} ${p.five_year_goal ?? ""}`.toLowerCase();
  if (/\b(parents oppose|family pressure|no family support|parents worried)\b/.test(blob)) {
    return "low";
  }
  if (/\b(parents supportive|family backing|joint decision|discussed with parents)\b/.test(blob)) {
    return "high";
  }
  if (p.parent_contact_email?.trim()) return "medium";
  return "unknown";
}

function resumeHeadline(parsed: Record<string, unknown>): string | null {
  const pe = parsed.profile_engine;
  if (pe && typeof pe === "object" && pe !== null) {
    const h = (pe as { headline_summary?: unknown }).headline_summary;
    if (typeof h === "string" && h.trim()) return h.trim();
  }
  const h2 = parsed.headline_summary;
  if (typeof h2 === "string" && h2.trim()) return h2.trim();
  return null;
}

function buildFromRows(
  userId: string,
  user: User,
  profile: StudentProfile | null,
  risk: LatestRiskScoreSummary | null
): StudentMasterProfile {
  const p = profile;
  const countries = parseTargetCountries(String(p?.target_country ?? ""));

  return {
    user_id: userId,
    identity: {
      full_name: user.full_name,
      journey_stage: user.journey_stage,
      onboarding_complete: user.onboarding_complete,
      wow_completed: user.wow_completed,
    },
    pathway: {
      target_countries: countries,
      target_country_raw: p?.target_country ?? null,
      target_intake: p?.target_intake ?? null,
      degree_type: p?.degree_type ?? null,
      broad_field: p?.broad_field ?? null,
      current_academic_level: p?.current_academic_level ?? null,
    },
    academic: {
      institute_name: p?.institute_name ?? null,
      institute_tier: p?.institute_tier ?? null,
      cgpa: p?.cgpa ?? null,
      cgpa_scale: p?.cgpa_scale ?? 10,
      gre_score: p?.gre_score ?? null,
      ielts_score: p?.ielts_score ?? null,
      toefl_score: p?.toefl_score ?? null,
      internship_count: p?.internship_count ?? 0,
      internship_months_total: p?.internship_months_total ?? 0,
      certification_count: p?.certification_count ?? 0,
      work_experience_years: p?.work_experience_years ?? 0,
      target_universities: p?.target_universities ?? [],
    },
    aspirations: {
      aspiration_text: p?.aspiration_text ?? null,
      five_year_goal: p?.five_year_goal ?? null,
      dream_role: p?.dream_role ?? null,
      scholarship_priority: p?.scholarship_priority ?? null,
    },
    funding: {
      loan_needed: p?.loan_needed ?? true,
      budget_band_usd: p?.budget_band_usd ?? null,
      parent_contact_email: p?.parent_contact_email ?? null,
      inferred_funding_comfort: p ? inferFundingComfort(p) : "unknown",
      inferred_parent_comfort: p ? inferParentComfort(p) : "unknown",
    },
    extracted: {
      skills: p?.extracted_skills ?? [],
      projects: p?.extracted_projects ?? [],
      internships: p?.extracted_internships ?? [],
      resume_headline: p ? resumeHeadline(p.parsed_resume_json) : null,
      parsed_resume_meta: p?.parsed_resume_json ?? {},
    },
    intelligence: {
      profile_completeness_score: p?.profile_completeness_score ?? 0,
      enrichment_status: p?.enrichment_status ?? null,
      last_enriched_at: p?.last_enriched_at ?? null,
      has_resume_attachment: Boolean(p?.resume_file_url?.trim()),
    },
    risk: risk
      ? {
          risk_label: risk.risk_label,
          placement_prob_6m: risk.placement_prob_6m,
          salary_band_low_lpa: risk.salary_band_low_lpa,
          salary_band_high_lpa: risk.salary_band_high_lpa,
          ai_summary: risk.ai_summary,
        }
      : null,
  };
}

/**
 * Loads normalized master profile for a student `users.id` (internal UUID).
 */
export async function buildStudentMasterProfile(
  userId: string
): Promise<StudentMasterProfile | null> {
  const user = await getUserById(userId);
  if (!user || user.role !== "student") {
    return null;
  }

  const [profile, risk] = await Promise.all([
    getStudentProfileByUserId(userId),
    getLatestRiskScoreByUserId(userId),
  ]);

  return buildFromRows(userId, user, profile, risk);
}

/** Compact JSON for system prompts — deterministic, truncated. */
export function formatMasterProfileForPrompt(master: StudentMasterProfile): string {
  const slim = {
    identity: master.identity,
    pathway: master.pathway,
    academic: {
      ...master.academic,
      target_universities: master.academic.target_universities.slice(0, 8),
    },
    aspirations: {
      aspiration_text: truncate(master.aspirations.aspiration_text, 900),
      five_year_goal: truncate(master.aspirations.five_year_goal, 400),
      dream_role: master.aspirations.dream_role,
      scholarship_priority: master.aspirations.scholarship_priority,
    },
    funding: master.funding,
    extracted: {
      resume_headline: master.extracted.resume_headline,
      skills_preview: master.extracted.skills.slice(0, 24),
      project_count: master.extracted.projects.length,
      internship_count_extracted: master.extracted.internships.length,
    },
    intelligence: master.intelligence,
    risk: master.risk,
  };

  let text = JSON.stringify(slim, null, 0);
  if (text.length > MAX_PROMPT_CHARS) {
    text = text.slice(0, MAX_PROMPT_CHARS) + "…";
  }
  return text;
}

function truncate(s: string | null, max: number): string | null {
  if (!s?.trim()) return null;
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
