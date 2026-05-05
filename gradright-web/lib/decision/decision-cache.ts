import { createHash } from "node:crypto";

import type { UniversityDecisionRow } from "@/lib/decision/enrich-university-scores";
import { mapUserMetadataToScoreInput } from "@/lib/decision/map-profile-hub-to-risk";
import type { ScoringResult } from "@/lib/decision/types";
import { applyProfileHubPatch } from "@/lib/profile/user-profile-hub";
import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

export const DECISION_CACHE_MS = 12 * 60 * 60 * 1000;

export type DecisionCachePayload = {
  grad_score: number;
  admission_scores: Record<string, number>;
  readiness: ScoringResult["readiness"];
  universities: UniversityDecisionRow[];
  roi: ScoringResult["roi"];
  meta: ScoringResult["meta"];
  scorer_summary: {
    placement_prob_6m: number;
    risk_label: string;
    salary_band_low_lpa: number;
    salary_band_high_lpa: number;
  } | null;
};

export function computeDecisionFingerprint(meta: Record<string, unknown>): string {
  const hub = getProfileHubFromUserMetadata(meta);
  const scoreInput = mapUserMetadataToScoreInput(meta);
  const uniNames = (hub.grounded_context?.universities ?? [])
    .map((u) => u.name.trim())
    .sort()
    .join("|");
  const bundle = JSON.stringify({
    scoreInput,
    grounded_updated: hub.grounded_context?.last_updated ?? "",
    grounded_fp: hub.grounded_context?.search_fingerprint ?? "",
    uniNames,
  });
  return createHash("sha256").update(bundle).digest("base64url").slice(0, 96);
}

export function scoringResultFromPayload(
  p: DecisionCachePayload,
  cacheNote?: string
): ScoringResult {
  return {
    grad_score: p.grad_score,
    scorer: null,
    admission_scores: p.admission_scores,
    readiness: p.readiness,
    universities: p.universities,
    roi: p.roi,
    meta: {
      ...p.meta,
      from_cache: true,
      ...(cacheNote ? { note: cacheNote } : {}),
    },
  };
}

export function getValidDecisionCache(meta: Record<string, unknown>): ScoringResult | null {
  const hub = getProfileHubFromUserMetadata(meta);
  const dc = hub.decision_cache;
  if (!dc || typeof dc !== "object") return null;
  const fpExpected = computeDecisionFingerprint(meta);
  if (dc.fingerprint !== fpExpected) return null;
  const cachedAt =
    typeof dc.cached_at === "string" ? new Date(dc.cached_at).getTime() : NaN;
  if (!Number.isFinite(cachedAt)) return null;
  if (Date.now() - cachedAt > DECISION_CACHE_MS) return null;
  const payload = dc.payload as DecisionCachePayload | undefined;
  if (!payload) return null;
  return scoringResultFromPayload(payload, undefined);
}

/** Last cached snapshot even if TTL expired (risk-service outage safety). */
export function getStaleDecisionFallback(meta: Record<string, unknown>): ScoringResult | null {
  const hub = getProfileHubFromUserMetadata(meta);
  const dc = hub.decision_cache;
  if (!dc || typeof dc !== "object") return null;
  const payload = dc.payload as DecisionCachePayload | undefined;
  if (!payload) return null;
  return scoringResultFromPayload(payload, "stale_cache_fallback");
}

export function mergeDecisionCacheIntoMetadata(
  prevUserMetadata: Record<string, unknown>,
  fingerprint: string,
  result: ScoringResult
): Record<string, unknown> {
  return applyProfileHubPatch(prevUserMetadata, {
    decision_cache: {
      fingerprint,
      cached_at: new Date().toISOString(),
      payload: buildDecisionCachePayload(result),
    },
  });
}

export function buildDecisionCachePayload(result: ScoringResult): DecisionCachePayload {
  const scorer_summary = result.scorer
    ? {
        placement_prob_6m: result.scorer.placement_prob_6m,
        risk_label: result.scorer.risk_label,
        salary_band_low_lpa: result.scorer.salary_band_low_lpa,
        salary_band_high_lpa: result.scorer.salary_band_high_lpa,
      }
    : null;

  return {
    grad_score: result.grad_score,
    admission_scores: result.admission_scores,
    readiness: result.readiness,
    universities: result.universities,
    roi: result.roi,
    meta: { ...result.meta, from_cache: false },
    scorer_summary,
  };
}
