-- Unified student intelligence layer (additive only; safe to re-run).
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "resume_file_url" text;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "aspiration_text" text;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "five_year_goal" text;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "dream_role" text;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "parsed_resume_json" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "extracted_skills" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "extracted_projects" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "extracted_internships" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "scholarship_priority" text;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "profile_completeness_score" integer DEFAULT 0;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "enrichment_status" text DEFAULT 'none';
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "last_enriched_at" timestamptz;

UPDATE "student_profiles" SET "parsed_resume_json" = '{}'::jsonb WHERE "parsed_resume_json" IS NULL;
UPDATE "student_profiles" SET "extracted_skills" = '[]'::jsonb WHERE "extracted_skills" IS NULL;
UPDATE "student_profiles" SET "extracted_projects" = '[]'::jsonb WHERE "extracted_projects" IS NULL;
UPDATE "student_profiles" SET "extracted_internships" = '[]'::jsonb WHERE "extracted_internships" IS NULL;
UPDATE "student_profiles" SET "profile_completeness_score" = 0 WHERE "profile_completeness_score" IS NULL;
UPDATE "student_profiles" SET "enrichment_status" = 'none' WHERE "enrichment_status" IS NULL;
