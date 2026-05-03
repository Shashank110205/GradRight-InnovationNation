import { z } from "zod";

export const riskEngineResponseSchema = z.object({
  placement_prob_3m: z.number(),
  placement_prob_6m: z.number(),
  placement_prob_12m: z.number(),
  salary_band_low_lpa: z.number(),
  salary_band_high_lpa: z.number(),
  risk_label: z.enum(["low", "medium", "high"]),
  risk_score_raw: z.number(),
  top_drivers: z.array(
    z.object({
      factor: z.string(),
      direction: z.enum(["positive", "negative", "neutral"]),
      weight: z.number(),
      explanation: z.string(),
      user_friendly_summary: z.string().optional().nullable(),
    })
  ),
  next_best_actions: z.array(
    z.object({
      action: z.string(),
      impact: z.enum(["high", "medium"]),
      resource_url: z.string().nullable(),
    })
  ),
  score_confidence: z.enum(["low", "medium", "high"]).optional(),
  score_data_coverage_percentage: z.number().optional(),
  placement_intelligence_tier: z
    .enum(["preliminary", "enhanced", "live_market"])
    .optional(),
  grad_score_display_title: z.string().optional(),
  intelligence_source_note: z.string().optional(),
  score_confidence_user_message: z.string().optional(),
  normalized_signal_snapshot: z.record(z.string(), z.number()).optional(),
});

export type NormalizedRiskEngineResult = z.infer<typeof riskEngineResponseSchema>;
