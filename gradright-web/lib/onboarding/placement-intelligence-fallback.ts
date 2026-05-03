/**
 * Offline mirror of the Python placement-intelligence weights (benchmark-only market data).
 */

import type { RiskEngineRequestBody } from "@/lib/onboarding/map-risk-input";

const PROFILE_WEIGHTS: Record<string, number> = {
  institute_tier_score: 0.15,
  cgpa_score: 0.15,
  internship_score: 0.15,
  certification_score: 0.1,
  work_experience_score: 0.1,
};

const MARKET_WEIGHTS: Record<string, number> = {
  sector_demand_score: 0.1,
  country_opportunity_score: 0.1,
  historical_admission_score: 0.05,
  historical_placement_score: 0.05,
  live_market_score: 0.05,
};

const PROFILE_MASS = Object.values(PROFILE_WEIGHTS).reduce((a, b) => a + b, 0);
const MARKET_MASS = Object.values(MARKET_WEIGHTS).reduce((a, b) => a + b, 0);

function redistribute(
  weights: Record<string, number>,
  values: Record<string, number | undefined>
): { adj: Record<string, number>; coverage: number } {
  const totalMass = Object.values(weights).reduce((a, b) => a + b, 0);
  const present: Record<string, boolean> = {};
  for (const k of Object.keys(weights)) {
    present[k] = values[k] !== undefined && values[k] !== null && !Number.isNaN(values[k]!);
  }
  if (!Object.values(present).some(Boolean)) {
    return { adj: Object.fromEntries(Object.keys(weights).map((k) => [k, 0])), coverage: 0 };
  }
  const missingMass = Object.keys(weights)
    .filter((k) => !present[k])
    .reduce((s, k) => s + weights[k]!, 0);
  const activeSum = Object.keys(weights)
    .filter((k) => present[k])
    .reduce((s, k) => s + weights[k]!, 0);
  const adj: Record<string, number> = {};
  for (const k of Object.keys(weights)) {
    const w = weights[k]!;
    if (present[k] && activeSum > 0) {
      adj[k] = w + missingMass * (w / activeSum);
    } else {
      adj[k] = 0;
    }
  }
  const s = Object.values(adj).reduce((a, b) => a + b, 0);
  if (s > 0 && Math.abs(s - totalMass) > 1e-6) {
    const scale = totalMass / s;
    for (const k of Object.keys(adj)) {
      adj[k]! *= scale;
    }
  }
  const coveredMass = Object.keys(weights)
    .filter((k) => present[k])
    .reduce((s, k) => s + weights[k]!, 0);
  const coverage = totalMass > 0 ? coveredMass / totalMass : 0;
  return { adj, coverage };
}

function blockScore(
  weights: Record<string, number>,
  values: Record<string, number | undefined>
): { score: number; coverage: number } {
  const { adj, coverage } = redistribute(weights, values);
  let score = 0;
  for (const k of Object.keys(adj)) {
    const w = adj[k]!;
    const v = values[k];
    if (v === undefined || w <= 0) continue;
    score += w * v;
  }
  return { score, coverage };
}

function profileSignals(body: RiskEngineRequestBody): Record<string, number | undefined> {
  const tierMap: Record<string, number> = { "IIT/IIM": 90, "NIT/Tier2": 72, Other: 55 };
  const institute = tierMap[body.institute_tier] ?? 55;
  const cgpa = Math.round(body.cgpa_normalized * 10000) / 100;
  let intern = 22;
  if (body.internship_months === 0) intern = 22;
  else if (body.internship_months <= 3) intern = 52;
  else if (body.internship_months <= 6) intern = 78;
  else intern = 92;
  const cert = Math.min(body.certification_count * 25, 95);
  const work = Math.min(body.work_experience_years * 18, 95);
  return {
    institute_tier_score: institute,
    cgpa_score: cgpa,
    internship_score: intern,
    certification_score: cert,
    work_experience_score: work,
  };
}

/** Neutral benchmark demand when JSON packs are unavailable in the web bundle. */
function benchmarkMarket(body: RiskEngineRequestBody): Record<string, number | undefined> {
  const demandIndex = 0.55;
  const sectorBase = Math.round(demandIndex * 10000) / 100;
  const macroMap: Record<string, number> = {
    US: 88,
    UK: 68,
    Germany: 76,
    Canada: 78,
    Australia: 70,
    domestic: 58,
  };
  const macro = macroMap[body.target_country] ?? 60;
  const sector = Math.round((0.82 * sectorBase + 0.18 * macro) * 100) / 100;
  const countryMap: Record<string, number> = {
    US: 88,
    UK: 68,
    Germany: 76,
    Canada: 78,
    Australia: 70,
    domestic: 58,
  };
  const country = countryMap[body.target_country] ?? 60;
  return {
    sector_demand_score: sector,
    country_opportunity_score: country,
    macro_employability_score: macro,
  };
}

export function weightedPlacementScoreFromBody(body: RiskEngineRequestBody): {
  risk_score_raw: number;
  score_data_coverage_percentage: number;
  score_confidence: "low" | "medium" | "high";
  placement_intelligence_tier: "preliminary" | "enhanced" | "live_market";
  grad_score_display_title: string;
  intelligence_source_note: string;
  score_confidence_user_message: string;
} {
  const profile = profileSignals(body);
  const market = benchmarkMarket(body);
  const vals: Record<string, number | undefined> = { ...profile, ...market };
  const { score: profileBlock, coverage: profileCov } = blockScore(PROFILE_WEIGHTS, vals);
  const { score: marketBlock, coverage: marketCov } = blockScore(MARKET_WEIGHTS, vals);
  const risk_score_raw = Math.round(Math.min(100, Math.max(0, profileBlock + marketBlock)) * 100) / 100;
  const score_data_coverage_percentage =
    Math.round(1000 * (PROFILE_MASS * profileCov + MARKET_MASS * marketCov)) / 10;
  const hasLive = vals.live_market_score !== undefined;
  const hasHist =
    vals.historical_placement_score !== undefined ||
    vals.historical_admission_score !== undefined;
  let placement_intelligence_tier: "preliminary" | "enhanced" | "live_market" = "preliminary";
  let grad_score_display_title = "Your Preliminary GradScore";
  let intelligence_source_note = "Using benchmark intelligence";
  if (hasLive) {
    placement_intelligence_tier = "live_market";
    grad_score_display_title = "Your Live Market GradScore";
    intelligence_source_note = "Live market feed is contributing to this score.";
  } else if (hasHist) {
    placement_intelligence_tier = "enhanced";
    grad_score_display_title = "Your Enhanced GradScore";
    intelligence_source_note =
      "Historical outcomes data is layered on benchmark intelligence.";
  }
  let score_confidence: "low" | "medium" | "high" = "low";
  if (score_data_coverage_percentage >= 82 || hasLive) score_confidence = "high";
  else if (score_data_coverage_percentage >= 58 || hasHist) score_confidence = "medium";
  const parts = ["benchmark data", "profile data"];
  if (hasHist) parts.push("historical outcomes");
  if (hasLive) parts.push("live market signal");
  const cap =
    score_confidence === "low"
      ? "Low"
      : score_confidence === "medium"
        ? "Medium"
        : "High";
  const score_confidence_user_message = `Confidence: ${cap} (${parts.join(" + ")})`;
  return {
    risk_score_raw,
    score_data_coverage_percentage,
    score_confidence,
    placement_intelligence_tier,
    grad_score_display_title,
    intelligence_source_note,
    score_confidence_user_message,
  };
}
