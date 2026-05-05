import { db } from "@/lib/db/client";
import { student_profiles } from "@/lib/db/schema";
import type { StudentProfile } from "@/lib/types";
import { sql } from "drizzle-orm";

const PROBE_COLUMNS = [
  "risk_appetite",
  "career_path_clarity",
  "experience_years",
  "funding_value_focus",
] as const;

let lastSchemaProbeAt = 0;

/**
 * Zero-row probe: validates that expected columns exist on `student_profiles`.
 * Throttled (~10 min) to avoid log noise on every dashboard load.
 */
export async function warnIfStudentProfileSchemaDrift(): Promise<void> {
  const now = Date.now();
  if (now - lastSchemaProbeAt < 600_000) {
    return;
  }
  lastSchemaProbeAt = now;
  try {
    await db
      .select({
        risk_appetite: student_profiles.risk_appetite,
        career_path_clarity: student_profiles.career_path_clarity,
        experience_years: student_profiles.experience_years,
        funding_value_focus: student_profiles.funding_value_focus,
      })
      .from(student_profiles)
      .where(sql`false`)
      .limit(1);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      "[student_profiles schema] Expected columns may be missing from Postgres.",
      { expected: [...PROBE_COLUMNS], error: msg },
      "Run `pnpm db:push` from gradright-web or apply `lib/db/migrations/0005_student_profiles_risk_path.sql`."
    );
  }
}

/**
 * Synthetic profile so dashboard + data helpers always receive a consistent shape
 * when no row exists or the profile query failed (returns null upstream).
 */
export function createDashboardStudentProfileFallback(
  userId: string
): StudentProfile {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: userId,
    target_country: null,
    target_intake: null,
    degree_type: null,
    broad_field: null,
    current_academic_level: null,
    work_experience_years: 0,
    loan_needed: true,
    budget_band_usd: null,
    institute_name: null,
    institute_tier: null,
    cgpa: null,
    cgpa_scale: 10,
    internship_count: 0,
    internship_months_total: 0,
    certification_count: 0,
    target_universities: [],
    gre_score: null,
    ielts_score: null,
    toefl_score: null,
    parent_contact_email: null,
    resume_file_url: null,
    aspiration_text: null,
    five_year_goal: null,
    dream_role: null,
    parsed_resume_json: {},
    extracted_skills: [],
    extracted_projects: [],
    extracted_internships: [],
    scholarship_priority: null,
    profile_completeness_score: 0,
    risk_appetite: "medium",
    career_path_clarity: "unknown",
    experience_years: 0,
    funding_value_focus: "balanced",
    enrichment_status: "none",
    last_enriched_at: null,
    created_at: now,
    updated_at: now,
  };
}
