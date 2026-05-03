-- Forward-only: align public.users with application expectations (no drops, no data loss).
-- Safe to re-run: uses IF NOT EXISTS / null-safe UPDATEs.

-- WOW + progression columns (older DBs may predate app code)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wow_completed" boolean DEFAULT false NOT NULL;

-- Defensive: if a fork omitted columns from the baseline migration
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "consent_given" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "consent_timestamp" timestamptz;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_complete" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "journey_stage" "journey_stage" DEFAULT 'discover'::"journey_stage" NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp_points" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "streak_days" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active_date" date;

-- Backfill nulls (backward compatibility)
UPDATE "users" SET "onboarding_complete" = false WHERE "onboarding_complete" IS NULL;
UPDATE "users" SET "wow_completed" = false WHERE "wow_completed" IS NULL;
UPDATE "users" SET "xp_points" = 0 WHERE "xp_points" IS NULL;
UPDATE "users" SET "streak_days" = 0 WHERE "streak_days" IS NULL;
UPDATE "users" SET "consent_given" = false WHERE "consent_given" IS NULL;
UPDATE "users" SET "journey_stage" = 'discover'::"journey_stage" WHERE "journey_stage" IS NULL;

-- Existing onboarded students: treat as WOW-complete (matches 0002 intent)
UPDATE "users" SET "wow_completed" = true WHERE "onboarding_complete" = true AND "wow_completed" = false;
