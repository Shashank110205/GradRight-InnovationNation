import { db } from "@/lib/db/client";
import { student_profiles } from "@/lib/db/schema";
import {
  mergeStudentProfile,
  onboardingAnswersToIncomingPatch,
  type ProfileIncomingPatch,
} from "@/lib/profile/merge-student-profile";
import type { OnboardingAnswers, StudentProfile } from "@/lib/types";
import type { RiskScorePostBody } from "@/lib/validations/risk-score-input";
import { eq } from "drizzle-orm";

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

/** Maps a DB row to `StudentProfile` with safe defaults when columns are null or absent. */
function mapProfileRow(row: typeof student_profiles.$inferSelect): StudentProfile {
  const r = row as typeof row & {
    risk_appetite?: string | null;
    career_path_clarity?: string | null;
    experience_years?: number | null;
    funding_value_focus?: string | null;
  };

  return {
    id: row.id,
    user_id: row.user_id,
    target_country: row.target_country ?? null,
    target_intake: row.target_intake ?? null,
    degree_type: row.degree_type ?? null,
    broad_field: row.broad_field ?? null,
    current_academic_level: row.current_academic_level ?? null,
    work_experience_years: row.work_experience_years ?? 0,
    loan_needed: row.loan_needed ?? true,
    budget_band_usd: row.budget_band_usd ?? null,
    institute_name: row.institute_name ?? null,
    institute_tier: (row.institute_tier as StudentProfile["institute_tier"]) ?? null,
    cgpa: (() => {
      if (row.cgpa == null) return null;
      const n = Number(row.cgpa);
      return Number.isFinite(n) ? n : null;
    })(),
    cgpa_scale: row.cgpa_scale != null ? Number(row.cgpa_scale) : 10,
    internship_count: row.internship_count ?? 0,
    internship_months_total: row.internship_months_total ?? 0,
    certification_count: row.certification_count ?? 0,
    target_universities: (row.target_universities as string[]) ?? [],
    gre_score: row.gre_score ?? null,
    ielts_score: row.ielts_score != null ? Number(row.ielts_score) : null,
    toefl_score: row.toefl_score ?? null,
    parent_contact_email: row.parent_contact_email ?? null,
    resume_file_url: row.resume_file_url ?? null,
    aspiration_text: row.aspiration_text ?? null,
    five_year_goal: row.five_year_goal ?? null,
    dream_role: row.dream_role ?? null,
    parsed_resume_json: asRecord(row.parsed_resume_json ?? {}),
    extracted_skills: asStringArray(row.extracted_skills ?? []),
    extracted_projects: Array.isArray(row.extracted_projects)
      ? row.extracted_projects
      : [],
    extracted_internships: Array.isArray(row.extracted_internships)
      ? row.extracted_internships
      : [],
    scholarship_priority: row.scholarship_priority ?? null,
    profile_completeness_score: row.profile_completeness_score ?? 0,
    risk_appetite: r.risk_appetite ?? "medium",
    career_path_clarity: r.career_path_clarity ?? "unknown",
    experience_years: r.experience_years ?? 0,
    funding_value_focus: r.funding_value_focus ?? "balanced",
    enrichment_status: row.enrichment_status ?? null,
    last_enriched_at: row.last_enriched_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * C-005: Onboarding question keys (`ONBOARDING_QUESTIONS` in `lib/types/index.ts`) → `student_profiles` columns:
 * | UI key                    | DB column                 |
 * |--------------------------|---------------------------|
 * | target_country           | target_country            |
 * | degree_type              | degree_type               |
 * | broad_field              | broad_field               |
 * | target_intake            | target_intake             |
 * | current_academic_level   | current_academic_level    |
 * | budget_band_usd          | budget_band_usd           |
 * | loan_needed              | loan_needed               |
 *
 * All writes go through C-007 `mergeStudentProfile(..., "onboarding")` so resume/chatbot fields are not wiped.
 */
export async function upsertStudentProfileFromOnboarding(
  userId: string,
  answers: OnboardingAnswers
): Promise<StudentProfile> {
  const now = new Date().toISOString();
  const existing = await getStudentProfileByUserId(userId);
  const incoming = onboardingAnswersToIncomingPatch(answers);
  const { values, debugLines } = mergeStudentProfile({
    existing,
    incoming,
    source: "onboarding",
  });
  for (const line of debugLines) {
    console.debug(`[upsertStudentProfileFromOnboarding] ${line}`);
  }

  const merged = {
    ...values,
    updated_at: now,
    loan_needed: values.loan_needed ?? answers.loan_needed,
  };
  const clean = Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== undefined)
  ) as typeof merged;

  const inserted = await db
    .insert(student_profiles)
    .values({
      user_id: userId,
      ...clean,
    })
    .onConflictDoUpdate({
      target: [student_profiles.user_id],
      set: clean,
    })
    .returning();

  const row = inserted[0];
  if (!row) {
    throw new Error("upsertStudentProfileFromOnboarding: no row returned");
  }
  return mapProfileRow(row);
}

export async function getStudentProfileByUserId(
  userId: string
): Promise<StudentProfile | null> {
  try {
    const rows = await db
      .select()
      .from(student_profiles)
      .where(eq(student_profiles.user_id, userId))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return null;
    }
    try {
      return mapProfileRow(row);
    } catch (mapErr) {
      console.error("[getStudentProfileByUserId] mapProfileRow failed", {
        userId,
        error: mapErr instanceof Error ? mapErr.message : String(mapErr),
      });
      return null;
    }
  } catch (e) {
    console.error("[getStudentProfileByUserId] query failed", {
      userId,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/** C-007: Career risk form → profile via merge (`risk_form` beats resume for overlapping scalars). */
export async function updateStudentProfileFromRiskForm(
  userId: string,
  body: RiskScorePostBody
): Promise<void> {
  const existing = await getStudentProfileByUserId(userId);
  if (!existing) {
    return;
  }

  const now = new Date().toISOString();
  const incoming: ProfileIncomingPatch = {};
  if (body.cgpa !== undefined) incoming.cgpa = String(body.cgpa);
  if (body.cgpa_scale !== undefined) incoming.cgpa_scale = String(body.cgpa_scale);
  if (body.internship_months_total !== undefined) {
    incoming.internship_months_total = body.internship_months_total;
  }
  if (body.certification_count !== undefined) {
    incoming.certification_count = body.certification_count;
  }
  if (body.institute_tier !== undefined) incoming.institute_tier = body.institute_tier;
  if (body.work_experience_years !== undefined) {
    incoming.work_experience_years = body.work_experience_years;
  }

  const { values, debugLines } = mergeStudentProfile({
    existing,
    incoming,
    source: "risk_form",
  });
  for (const line of debugLines) {
    console.debug(`[updateStudentProfileFromRiskForm] ${line}`);
  }

  if (Object.keys(values).length === 0) {
    return;
  }

  await db
    .update(student_profiles)
    .set({ ...values, updated_at: now })
    .where(eq(student_profiles.user_id, userId));
}

export type ProfileIntelligencePatch = {
  aspiration_text: string | null;
  five_year_goal: string | null;
  dream_role: string | null;
  scholarship_priority: string | null;
  target_country: string | null;
  broad_field?: string | null;
  resume_file_url: string | null;
  parsed_resume_json: Record<string, unknown>;
  extracted_skills: string[];
  extracted_projects: unknown[];
  extracted_internships: unknown[];
  /** C-006: certifications also mirrored under parsed_resume_json.extracted_certifications */
  extracted_certifications?: unknown[];
  certification_count?: number;
  profile_completeness_score: number;
  enrichment_status: string;
  last_enriched_at: string;
  risk_appetite?: string | null;
  career_path_clarity?: string | null;
  experience_years?: number | null;
  funding_value_focus?: string | null;
  /** C-006: resume-derived scalars merged on full enrich when DB gaps exist. */
  cgpa?: string | null;
  cgpa_scale?: string | null;
  institute_name?: string | null;
};

/** C-007: Resume parse-only path — merges extraction arrays without clobbering higher-priority scalars. */
export async function patchStudentProfileResumeExtraction(
  userId: string,
  patch: {
    resume_file_url: string | null;
    parsed_resume_json: Record<string, unknown>;
    extracted_skills: string[];
    extracted_projects: unknown[];
    extracted_internships: unknown[];
    extracted_certifications?: unknown[];
    experience_years: number | null;
    profile_completeness_score: number;
    enrichment_status: string;
    last_enriched_at: string;
    cgpa?: string | null;
    cgpa_scale?: string | null;
    institute_name?: string | null;
    certification_count?: number;
  }
): Promise<StudentProfile> {
  const existing = await getStudentProfileByUserId(userId);
  if (!existing) {
    throw new Error("patchStudentProfileResumeExtraction: profile row not found");
  }

  const incoming: ProfileIncomingPatch = {
    resume_file_url: patch.resume_file_url,
    parsed_resume_json: patch.parsed_resume_json,
    extracted_skills: patch.extracted_skills,
    extracted_projects: patch.extracted_projects,
    extracted_internships: patch.extracted_internships,
    experience_years: patch.experience_years,
    profile_completeness_score: patch.profile_completeness_score,
    enrichment_status: patch.enrichment_status,
    last_enriched_at: patch.last_enriched_at,
  };
  if (patch.cgpa !== undefined) incoming.cgpa = patch.cgpa;
  if (patch.cgpa_scale !== undefined) incoming.cgpa_scale = patch.cgpa_scale;
  if (patch.institute_name !== undefined) incoming.institute_name = patch.institute_name;
  if (patch.certification_count !== undefined) {
    incoming.certification_count = patch.certification_count;
  }
  if (patch.extracted_certifications !== undefined) {
    incoming.extracted_certifications = patch.extracted_certifications;
  }

  const now = new Date().toISOString();
  const { values, debugLines } = mergeStudentProfile({
    existing,
    incoming,
    source: "resume",
  });
  for (const line of debugLines) {
    console.debug(`[patchStudentProfileResumeExtraction] ${line}`);
  }

  const rows = await db
    .update(student_profiles)
    .set({ ...values, updated_at: now })
    .where(eq(student_profiles.user_id, userId))
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error("patchStudentProfileResumeExtraction: profile row not found");
  }
  return mapProfileRow(row);
}

/** C-007: PROFILE engine + UI enrichment — `chatbot` source wins over resume for same scalar. */
export async function applyProfileIntelligenceEnrichment(
  userId: string,
  patch: ProfileIntelligencePatch
): Promise<StudentProfile> {
  const existing = await getStudentProfileByUserId(userId);
  if (!existing) {
    throw new Error("applyProfileIntelligenceEnrichment: profile row not found");
  }

  const incoming: ProfileIncomingPatch = {
    aspiration_text: patch.aspiration_text,
    five_year_goal: patch.five_year_goal,
    dream_role: patch.dream_role,
    scholarship_priority: patch.scholarship_priority,
    target_country: patch.target_country,
    resume_file_url: patch.resume_file_url,
    parsed_resume_json: patch.parsed_resume_json,
    extracted_skills: patch.extracted_skills,
    extracted_projects: patch.extracted_projects,
    extracted_internships: patch.extracted_internships,
    profile_completeness_score: patch.profile_completeness_score,
    enrichment_status: patch.enrichment_status,
    last_enriched_at: patch.last_enriched_at,
    risk_appetite: patch.risk_appetite,
    career_path_clarity: patch.career_path_clarity,
    experience_years: patch.experience_years,
    funding_value_focus: patch.funding_value_focus,
  };
  if (patch.broad_field !== undefined) {
    incoming.broad_field = patch.broad_field;
  }
  if (patch.extracted_certifications !== undefined) {
    incoming.extracted_certifications = patch.extracted_certifications;
  }
  if (patch.certification_count !== undefined) {
    incoming.certification_count = patch.certification_count;
  }
  if (patch.cgpa !== undefined) incoming.cgpa = patch.cgpa;
  if (patch.cgpa_scale !== undefined) incoming.cgpa_scale = patch.cgpa_scale;
  if (patch.institute_name !== undefined) incoming.institute_name = patch.institute_name;

  const now = new Date().toISOString();
  const { values, debugLines } = mergeStudentProfile({
    existing,
    incoming,
    source: "chatbot",
  });
  for (const line of debugLines) {
    console.debug(`[applyProfileIntelligenceEnrichment] ${line}`);
  }

  const rows = await db
    .update(student_profiles)
    .set({ ...values, updated_at: now })
    .where(eq(student_profiles.user_id, userId))
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error("applyProfileIntelligenceEnrichment: profile row not found");
  }
  return mapProfileRow(row);
}

/** Legacy score-upgrade free-form fields → aspiration trail (additive). C-007: merged via chatbot tier. */
export async function appendProfileNotesBlock(
  userId: string,
  block: string
): Promise<void> {
  const now = new Date().toISOString();
  const rows = await db
    .select({ aspiration_text: student_profiles.aspiration_text })
    .from(student_profiles)
    .where(eq(student_profiles.user_id, userId))
    .limit(1);
  const prior = rows[0]?.aspiration_text?.trim() ?? "";
  const next = prior
    ? `${prior}\n\n— Earlier profile notes —\n\n${block}`
    : block;

  const existing = await getStudentProfileByUserId(userId);
  if (!existing) {
    return;
  }
  const { values, debugLines } = mergeStudentProfile({
    existing,
    incoming: { aspiration_text: next },
    source: "chatbot",
  });
  for (const line of debugLines) {
    console.debug(`[appendProfileNotesBlock] ${line}`);
  }

  await db
    .update(student_profiles)
    .set({ ...values, updated_at: now })
    .where(eq(student_profiles.user_id, userId));
}
