import type { RiskEngineRequestBody } from "@/lib/onboarding/map-risk-input";
import { weightedPlacementScoreFromBody } from "@/lib/onboarding/placement-intelligence-fallback";
import type { NormalizedRiskEngineResult } from "@/lib/onboarding/risk-engine-schema";
import type { OnboardingAnswers } from "@/lib/types";

function placementProbRule(score: number, months: 3 | 6 | 12): number {
  const caps: Record<number, number> = { 3: 0.6, 6: 0.85, 12: 0.95 };
  const floors: Record<number, number> = { 3: 0.05, 6: 0.2, 12: 0.4 };
  const cap = caps[months];
  const floor = floors[months];
  const normalized = (score - 50) / 20;
  const sigmoid = 1 / (1 + Math.exp(-normalized));
  return floor + (cap - floor) * sigmoid;
}

const DEFAULT_INTEL = {
  score_confidence: "medium" as const,
  score_data_coverage_percentage: 62,
  placement_intelligence_tier: "preliminary" as const,
  grad_score_display_title: "Your Preliminary GradScore",
  intelligence_source_note: "Using benchmark intelligence",
  score_confidence_user_message:
    "Confidence: Medium (benchmark data + profile heuristics)",
};

/** Rule-based score from engine-shaped input when the Python service is offline. */
export function computeFallbackRiskEngineResultFromBody(
  body: RiskEngineRequestBody
): NormalizedRiskEngineResult {
  const intel = weightedPlacementScoreFromBody(body);
  const total = intel.risk_score_raw;

  const risk_label: NormalizedRiskEngineResult["risk_label"] =
    total >= 66 ? "low" : total >= 41 ? "medium" : "high";

  const domestic = body.target_country === "domestic";
  let salaryLow = domestic ? 12 : 28;
  let salaryHigh = domestic ? 28 : 55;
  if (body.program_type === "CS") {
    salaryLow += domestic ? 4 : 8;
    salaryHigh += domestic ? 8 : 15;
  }

  const internPts =
    body.internship_months === 0
      ? 0
      : body.internship_months <= 3
        ? 5
        : body.internship_months <= 6
          ? 10
          : 15;

  const top_drivers: NormalizedRiskEngineResult["top_drivers"] = [
    {
      factor: "Weighted placement intelligence",
      direction:
        body.cgpa_normalized >= 0.75
          ? "positive"
          : body.cgpa_normalized >= 0.6
            ? "neutral"
            : "negative",
      weight: Math.min(1, total / 100),
      explanation: `Explainable weights across profile (${(0.65 * 100).toFixed(0)} pts scale) and market (${(0.35 * 100).toFixed(0)} pts scale); missing cohort feeds are redistributed.`,
      user_friendly_summary:
        "Your academic profile is influencing your projected outcomes in a transparent, explainable way — sharper inputs raise confidence without changing the philosophy.",
    },
    {
      factor: "Internship exposure",
      direction: internPts >= 10 ? "positive" : "negative",
      weight: internPts / 15,
      explanation: `${body.internship_months} months of internships shapes how quickly employers gain confidence in your experience.`,
      user_friendly_summary:
        internPts >= 10
          ? "Hands-on experience is helping employers read your readiness more quickly."
          : "A structured internship in your target sector would materially strengthen how employers perceive your readiness.",
    },
    {
      factor: "Target geography & sector",
      direction: "neutral",
      weight: 0.5,
      explanation: `Targeting ${body.target_country} in ${body.target_sector} sets benchmark demand and destination context (${intel.intelligence_source_note}).`,
      user_friendly_summary:
        "Your destination and field choice set the narrative for admits and financing — we benchmark responsibly until live feeds are connected.",
    },
  ];

  const next_best_actions: NormalizedRiskEngineResult["next_best_actions"] =
    [];
  if (body.internship_months < 4) {
    next_best_actions.push({
      action:
        "Complete at least one 3-month internship in your target sector before graduation",
      impact: "high",
      resource_url: "https://internshala.com",
    });
  }
  if (body.certification_count === 0) {
    next_best_actions.push({
      action:
        "Earn a field-relevant certification to strengthen your profile signal",
      impact: "medium",
      resource_url: "https://coursera.org",
    });
  }
  next_best_actions.push({
    action:
      "Align your resume and portfolio projects with job descriptions in your target sector",
    impact: "medium",
    resource_url: null,
  });

  return {
    placement_prob_3m: Math.round(placementProbRule(total, 3) * 100) / 100,
    placement_prob_6m: Math.round(placementProbRule(total, 6) * 100) / 100,
    placement_prob_12m: Math.round(placementProbRule(total, 12) * 100) / 100,
    salary_band_low_lpa: salaryLow,
    salary_band_high_lpa: salaryHigh,
    risk_label,
    risk_score_raw: total,
    top_drivers,
    next_best_actions: next_best_actions.slice(0, 3),
    score_confidence: intel.score_confidence,
    score_data_coverage_percentage: intel.score_data_coverage_percentage,
    placement_intelligence_tier: intel.placement_intelligence_tier,
    grad_score_display_title: intel.grad_score_display_title,
    intelligence_source_note: intel.intelligence_source_note,
    score_confidence_user_message: intel.score_confidence_user_message,
  };
}

/** Minimal rule-based score when RISK_ENGINE_URL is unavailable or errors. */
export function computeFallbackRiskEngineResult(
  answers: OnboardingAnswers
): NormalizedRiskEngineResult {
  let score = 48;

  if (answers.broad_field === "Computer Science / IT") score += 8;
  if (answers.broad_field === "Engineering") score += 5;
  if (answers.target_country === "United States") score += 4;
  if (answers.target_country === "India (Domestic)") score += 2;
  if (answers.current_academic_level.includes("3+")) score += 6;
  if (answers.current_academic_level.includes("1-3")) score += 4;
  if (answers.budget_band_usd.includes("Above")) score += 3;

  score = Math.min(100, Math.max(18, score));

  const risk_label =
    score >= 66 ? "low" : score >= 41 ? "medium" : "high";

  const p6 =
    risk_label === "low" ? 0.72 : risk_label === "medium" ? 0.55 : 0.38;
  const p3 = Math.max(0.08, p6 - 0.18);
  const p12 = Math.min(0.93, p6 + 0.22);

  const salaryLow =
    answers.target_country === "India (Domestic)" ? 12 : 28;
  const salaryHigh =
    answers.target_country === "India (Domestic)" ? 28 : 55;

  return {
    placement_prob_3m: Math.round(p3 * 100) / 100,
    placement_prob_6m: Math.round(p6 * 100) / 100,
    placement_prob_12m: Math.round(p12 * 100) / 100,
    salary_band_low_lpa: salaryLow,
    salary_band_high_lpa: salaryHigh,
    risk_label,
    risk_score_raw: score,
    top_drivers: [
      {
        factor: "Field & destination choice",
        direction: "neutral",
        weight: 0.5,
        explanation: `Your combination of ${answers.broad_field} and ${answers.target_country} sets a baseline employability signal.`,
        user_friendly_summary:
          "Your field and destination choices anchor a credible starting story — the dashboard will help you sharpen it with evidence-backed next moves.",
      },
    ],
    next_best_actions: [
      {
        action:
          "Add a structured internship or research project before you apply",
        impact: "high",
        resource_url: null,
      },
    ],
    ...DEFAULT_INTEL,
  };
}
