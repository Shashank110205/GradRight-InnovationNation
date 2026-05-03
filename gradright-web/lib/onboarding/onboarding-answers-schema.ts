import { z } from "zod";

export const onboardingAnswersSchema = z.object({
  target_country: z.string().min(1),
  degree_type: z.string().min(1),
  broad_field: z.string().min(1),
  target_intake: z.string().min(1),
  current_academic_level: z.string().min(1),
  budget_band_usd: z.string().min(1),
  loan_needed: z.boolean(),
});

/** Stored snapshot may include server-written placement intelligence metadata. */
export const placementIntelMetaSchema = z.object({
  score_confidence: z.enum(["low", "medium", "high"]),
  score_data_coverage_percentage: z.number(),
  placement_intelligence_tier: z.enum([
    "preliminary",
    "enhanced",
    "live_market",
  ]),
  grad_score_display_title: z.string(),
  intelligence_source_note: z.string(),
  score_confidence_user_message: z.string(),
});

export const storedOnboardingSnapshotSchema = onboardingAnswersSchema.extend({
  _placement_intel: placementIntelMetaSchema.optional(),
});
