import { z } from "zod";

export const careerNavigatorPostBodySchema = z.object({
  currentDegree: z.string().trim().min(1).max(240),
  currentCGPA: z.number().min(5).max(10),
  targetField: z.enum([
    "Software/Tech",
    "Data Science",
    "Finance/MBA",
    "Healthcare",
    "Engineering",
    "Other",
  ]),
  budgetRange: z.enum(["Under 20L", "20-40L", "40-60L", "60L+"]),
  preferredCountries: z
    .array(z.enum(["USA", "UK", "Canada", "Germany", "Australia"]))
    .min(1)
    .transform((a) => [...new Set(a)]),
  careerGoal: z.string().trim().max(200),
  workExperienceYears: z.number().min(0).max(10),
});

const estimatedCostSchema = z.object({
  tuition: z.string(),
  living: z.string(),
  currency: z.string(),
});

const recommendationSchema = z.object({
  rank: z.coerce.number().int().min(1).max(10),
  country: z.string(),
  university: z.string(),
  program: z.string(),
  whyThisFits: z.string(),
  estimatedCost: estimatedCostSchema,
  avgStartingSalary: z.string(),
  roiScore: z.coerce.number(),
  admissionDifficulty: z.enum(["safety", "match", "reach"]),
  employmentRate: z.coerce.number(),
  visaFriendliness: z.enum(["high", "medium", "low"]),
});

export const careerNavigatorResponseSchema = z.object({
  topRecommendations: z.array(recommendationSchema).min(1).max(12),
  bestCountryForYou: z.string(),
  bestFieldForYou: z.string(),
  reasoning: z.string(),
  alternativePaths: z.array(
    z.object({
      path: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    })
  ),
  nextSteps: z.array(z.string()),
});

export type CareerNavigatorPostBody = z.infer<typeof careerNavigatorPostBodySchema>;
export type CareerNavigatorResponse = z.infer<typeof careerNavigatorResponseSchema>;
