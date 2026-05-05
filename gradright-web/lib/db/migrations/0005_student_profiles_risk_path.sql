-- Profile intelligence extensions (additive; idempotent).
ALTER TABLE "student_profiles"
  ADD COLUMN IF NOT EXISTS "risk_appetite" text,
  ADD COLUMN IF NOT EXISTS "career_path_clarity" text,
  ADD COLUMN IF NOT EXISTS "experience_years" integer,
  ADD COLUMN IF NOT EXISTS "funding_value_focus" text;
