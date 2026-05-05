import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

import { callRiskServiceAdmission, callRiskServiceScore, riskEngineConfigured } from "./call-risk-service";
import {
  getStaleDecisionFallback,
  getValidDecisionCache,
} from "./decision-cache";
import { enrichUniversities } from "./enrich-university-scores";
import {
  buildAdmissionBodyForUniversity,
  mapUserMetadataToScoreInput,
} from "./map-profile-hub-to-risk";
import type { ScoringResult } from "./types";

export type { ScoringResult } from "./types";

function resumeSkillsFromMeta(meta: Record<string, unknown>): string[] {
  const hub = getProfileHubFromUserMetadata(meta);
  const piRaw = meta.profile_intelligence;
  const pi = piRaw && typeof piRaw === "object" && !Array.isArray(piRaw) ? piRaw : {};
  const resume =
    pi &&
    typeof pi === "object" &&
    "resume" in pi &&
    pi.resume &&
    typeof pi.resume === "object"
      ? (pi.resume as { skills?: unknown })
      : null;
  const skills =
    resume && Array.isArray(resume.skills)
      ? resume.skills
      : hub.resume_snapshot?.skills;
  if (!Array.isArray(skills)) return [];
  return skills.filter((s): s is string => typeof s === "string").slice(0, 80);
}

async function computeScoringFresh(meta: Record<string, unknown>): Promise<ScoringResult> {
  const hub = getProfileHubFromUserMetadata(meta);
  const ctx = hub.grounded_context ?? null;

  const configured = riskEngineConfigured();
  const scoreInput = mapUserMetadataToScoreInput(meta);

  if (!scoreInput) {
    return {
      grad_score: 0,
      scorer: null,
      admission_scores: {},
      readiness: { signals: null, strengths: [], improvement_areas: [] },
      universities: [],
      roi: {
        salary_mid_lpa: null,
        aggregate_fee_index: null,
        ratio: null,
      },
      meta: {
        risk_engine_configured: configured,
        insufficient_data: true,
        note: "Missing onboarding resume signals for scorer input.",
      },
    };
  }

  if (!configured) {
    return {
      grad_score: 0,
      scorer: null,
      admission_scores: {},
      readiness: { signals: null, strengths: [], improvement_areas: [] },
      universities: [],
      roi: {
        salary_mid_lpa: null,
        aggregate_fee_index: null,
        ratio: null,
      },
      meta: {
        risk_engine_configured: false,
        insufficient_data: false,
        note: "RISK_ENGINE_URL not set — scorer unavailable.",
      },
    };
  }

  const scorer = await callRiskServiceScore(scoreInput);
  const grad_score = scorer ? Math.round(scorer.risk_score_raw * 10) / 10 : 0;

  const admissionProbByName = new Map<string, number>();
  const admission_scores: Record<string, number> = {};
  const unis = ctx?.universities ?? [];

  const admissionRows = await Promise.all(
    unis.map(async (u) => {
      const body = buildAdmissionBodyForUniversity({
        meta,
        universityCountryName: u.country,
        groundedTier: u.tier,
      });
      if (!body) {
        return { name: u.name.trim(), pct: 0 };
      }
      const adm = await callRiskServiceAdmission(body);
      const pct = adm ? Math.round(adm.admission_prob * 1000) / 10 : 0;
      return { name: u.name.trim(), pct };
    })
  );

  for (const row of admissionRows) {
    admission_scores[row.name] = row.pct;
    admissionProbByName.set(row.name, row.pct);
    admissionProbByName.set(row.name.toLowerCase(), row.pct);
  }

  const resumeSkills = resumeSkillsFromMeta(meta);
  const { rows, roi_summary } = enrichUniversities({
    context: ctx,
    admissionProbByName,
    resumeSkills,
  });

  const fresh: ScoringResult = {
    grad_score,
    scorer,
    admission_scores,
    readiness: {
      signals: scorer?.readiness_signals ?? null,
      strengths: scorer?.strengths ?? [],
      improvement_areas: scorer?.improvement_areas ?? [],
    },
    universities: rows,
    roi: roi_summary,
    meta: {
      risk_engine_configured: true,
      insufficient_data: false,
      from_cache: false,
    },
  };

  if (!scorer) {
    const stale = getStaleDecisionFallback(meta);
    if (stale) {
      return {
        ...stale,
        meta: {
          ...stale.meta,
          note: "risk_engine_unreachable_used_cached_snapshot",
        },
      };
    }
  }

  return fresh;
}

export async function computeScoringFromUserMetadata(
  meta: Record<string, unknown>
): Promise<ScoringResult> {
  const cached = getValidDecisionCache(meta);
  if (cached) return cached;

  return computeScoringFresh(meta);
}
