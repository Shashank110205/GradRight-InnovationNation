-- WOW gate: students must finish score reveal before hub routes.
-- Existing onboarded users are treated as having completed WOW.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wow_completed" boolean DEFAULT false NOT NULL;
UPDATE "users" SET "wow_completed" = true WHERE "onboarding_complete" = true;
