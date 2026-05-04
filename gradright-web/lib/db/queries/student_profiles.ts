import { db } from "@/lib/db/client";
import { student_profiles } from "@/lib/db/schema";
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

function mapProfileRow(row: typeof student_profiles.$inferSelect): StudentProfile {
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
    cgpa: row.cgpa != null ? Number(row.cgpa) : null,
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
    parsed_resume_json: asRecord(row.parsed_resume_json),
    extracted_skills: asStringArray(row.extracted_skills),
    extracted_projects: Array.isArray(row.extracted_projects)
      ? row.extracted_projects
      : [],
    extracted_internships: Array.isArray(row.extracted_internships)
      ? row.extracted_internships
      : [],
    scholarship_priority: row.scholarship_priority ?? null,
    profile_completeness_score: row.profile_completeness_score ?? 0,
    enrichment_status: row.enrichment_status ?? null,
    last_enriched_at: row.last_enriched_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function upsertStudentProfileFromOnboarding(
  userId: string,
  answers: OnboardingAnswers
): Promise<StudentProfile> {
  const now = new Date().toISOString();

  const inserted = await db
    .insert(student_profiles)
    .values({
      user_id: userId,
      target_country: answers.target_country,
      target_intake: answers.target_intake,
      degree_type: answers.degree_type,
      broad_field: answers.broad_field,
      current_academic_level: answers.current_academic_level,
      budget_band_usd: answers.budget_band_usd,
      loan_needed: answers.loan_needed,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: [student_profiles.user_id],
      set: {
        target_country: answers.target_country,
        target_intake: answers.target_intake,
        degree_type: answers.degree_type,
        broad_field: answers.broad_field,
        current_academic_level: answers.current_academic_level,
        budget_band_usd: answers.budget_band_usd,
        loan_needed: answers.loan_needed,
        updated_at: now,
      },
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
  const rows = await db
    .select()
    .from(student_profiles)
    .where(eq(student_profiles.user_id, userId))
    .limit(1);
  const row = rows[0];
  return row ? mapProfileRow(row) : null;
}

/** Persist career risk form fields that the student supplied or confirmed. */
export async function updateStudentProfileFromRiskForm(
  userId: string,
  body: RiskScorePostBody
): Promise<void> {
  const now = new Date().toISOString();
  const patch: Partial<typeof student_profiles.$inferInsert> = {
    updated_at: now,
  };

  if (body.cgpa !== undefined) {
    patch.cgpa = String(body.cgpa);
  }
  if (body.cgpa_scale !== undefined) {
    patch.cgpa_scale = String(body.cgpa_scale);
  }
  if (body.internship_months_total !== undefined) {
    patch.internship_months_total = body.internship_months_total;
  }
  if (body.certification_count !== undefined) {
    patch.certification_count = body.certification_count;
  }
  if (body.institute_tier !== undefined) {
    patch.institute_tier = body.institute_tier;
  }
  if (body.work_experience_years !== undefined) {
    patch.work_experience_years = body.work_experience_years;
  }

  if (Object.keys(patch).length <= 1) {
    return;
  }

  await db
    .update(student_profiles)
    .set(patch)
    .where(eq(student_profiles.user_id, userId));
}

export type ProfileIntelligencePatch = {
  aspiration_text: string | null;
  five_year_goal: string | null;
  dream_role: string | null;
  scholarship_priority: string | null;
  target_country: string | null;
  resume_file_url: string | null;
  parsed_resume_json: Record<string, unknown>;
  extracted_skills: string[];
  extracted_projects: unknown[];
  extracted_internships: unknown[];
  profile_completeness_score: number;
  enrichment_status: string;
  last_enriched_at: string;
};

/** PROFILE engine writes — merges structured enrichment into `student_profiles`. */
export async function applyProfileIntelligenceEnrichment(
  userId: string,
  patch: ProfileIntelligencePatch
): Promise<StudentProfile> {
  const now = new Date().toISOString();
  const rows = await db
    .update(student_profiles)
    .set({
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
      updated_at: now,
    })
    .where(eq(student_profiles.user_id, userId))
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error("applyProfileIntelligenceEnrichment: profile row not found");
  }
  return mapProfileRow(row);
}

/** Legacy score-upgrade free-form fields → aspiration trail (additive). */
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

  await db
    .update(student_profiles)
    .set({ aspiration_text: next, updated_at: now })
    .where(eq(student_profiles.user_id, userId));
}
