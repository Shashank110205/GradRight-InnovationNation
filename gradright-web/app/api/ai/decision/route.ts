import { aggregateGapsAndActions } from "@/lib/decision/aggregate-gaps";
import {
  computeDecisionFingerprint,
  mergeDecisionCacheIntoMetadata,
} from "@/lib/decision/decision-cache";
import { computeScoringFromUserMetadata } from "@/lib/decision/compute-scoring";
import { explainDecisionWithGemini } from "@/lib/decision/explain-decision";
import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * Full decision object: Python scorer + grounded context adjustments + Gemini explanation only.
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
      console.error("[GET /api/ai/decision] decision_cache persist", cacheErr);
    }
  }

  const { gaps, actions } = aggregateGapsAndActions(scoring);
  const { explanation, source } = await explainDecisionWithGemini(scoring);

  return NextResponse.json(
    apiSuccess({
      grad_score: scoring.grad_score,
      roi: scoring.roi,
      universities: scoring.universities,
      gaps,
      actions,
      admission_scores: scoring.admission_scores,
      readiness: scoring.readiness,
      explanation,
      explanation_source: source,
      meta: scoring.meta,
    }),
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
