import {
  computeDecisionFingerprint,
  mergeDecisionCacheIntoMetadata,
} from "@/lib/decision/decision-cache";
import { computeScoringFromUserMetadata } from "@/lib/decision/compute-scoring";
import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * Deterministic placement + admission scores: Python `risk-service` (scorer.py) + grounded_context enrichment.
 * Input is the signed-in user’s profile hub (`user_metadata`).
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role === "nbfc_supervisor") {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const scoring = await computeScoringFromUserMetadata(meta);

  if (
    !scoring.meta.from_cache &&
    scoring.meta.risk_engine_configured &&
    !scoring.meta.insufficient_data &&
    scoring.scorer != null
  ) {
    const fp = computeDecisionFingerprint(meta);
    const nextMeta = mergeDecisionCacheIntoMetadata(meta, fp, scoring);
    const { error: cacheErr } = await supabase.auth.updateUser({ data: nextMeta });
    if (cacheErr) {
      console.error("[GET /api/ai/scoring] decision_cache persist", cacheErr);
    }
  }

  const scorer_summary = scoring.scorer
    ? {
        placement_prob_6m: scoring.scorer.placement_prob_6m,
        placement_prob_12m: scoring.scorer.placement_prob_12m,
        risk_label: scoring.scorer.risk_label,
        salary_band_low_lpa: scoring.scorer.salary_band_low_lpa,
        salary_band_high_lpa: scoring.scorer.salary_band_high_lpa,
        score_confidence: scoring.scorer.score_confidence,
        score_data_coverage_percentage: scoring.scorer.score_data_coverage_percentage,
        grad_score_display_title: scoring.scorer.grad_score_display_title,
      }
    : null;

  return NextResponse.json(
    apiSuccess({
      grad_score: scoring.grad_score,
      admission_scores: scoring.admission_scores,
      readiness: scoring.readiness,
      universities: scoring.universities,
      roi: scoring.roi,
      scorer_summary,
      meta: scoring.meta,
    }),
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
