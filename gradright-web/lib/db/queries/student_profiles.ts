import { db } from "@/lib/db/client";
import { student_profiles } from "@/lib/db/schema";
import type { OnboardingAnswers, StudentProfile } from "@/lib/types";
import type { RiskScorePostBody } from "@/lib/validations/risk-score-input";
import { eq } from "drizzle-orm";

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
