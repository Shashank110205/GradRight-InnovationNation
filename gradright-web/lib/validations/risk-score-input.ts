import { z } from "zod";

export const instituteTierSchema = z.enum(["IIT/IIM", "NIT/Tier2", "Other"]);
const programTypeSchema = z.enum([
  "CS",
  "Engineering",
  "Business",
  "Life Sciences",
  "Other",
]);

/** Payload validated before calling the Python rule engine (FEATURE_SPECS ScoreInput). */
export const RiskScoreInputSchema = z.object({
  institute_tier: instituteTierSchema,
  program_type: programTypeSchema,
  cgpa_normalized: z.number().min(0).max(1),
  internship_months: z.number().int().min(0),
  certification_count: z.number().int().min(0),
  target_country: z.string().min(1),
  target_sector: z.string().min(1),
  work_experience_years: z.number().int().min(0),
});

export type RiskScoreInputValidated = z.infer<typeof RiskScoreInputSchema>;

/** Optional overrides from POST /api/career/risk-score (merged with student_profiles server-side). */
export const RiskScorePostBodySchema = z
  .object({
    cgpa: z.number().min(0).optional(),
    cgpa_scale: z.number().positive().optional(),
    internship_months_total: z.number().int().min(0).optional(),
    certification_count: z.number().int().min(0).optional(),
    institute_tier: instituteTierSchema.optional(),
    work_experience_years: z.number().int().min(0).optional(),
  })
  .strict();

export type RiskScorePostBody = z.infer<typeof RiskScorePostBodySchema>;
