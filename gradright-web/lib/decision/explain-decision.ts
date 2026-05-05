import { safeGenerate } from "@/lib/ai/orchestrator";
import { getGeminiApiKey } from "@/lib/ai/env";

import type { ScoringResult } from "./types";

/**
 * AI only: natural-language packaging of deterministic scorer + enrichment outputs.
 */
export async function explainDecisionWithGemini(
  scoring: ScoringResult
): Promise<{ explanation: string; source: "gemini" | "unavailable" }> {
  if (!getGeminiApiKey()) {
    return {
      explanation:
        "AI explanation requires GEMINI_API_KEY. Scores above come from the Python scorer and grounded profile hub only.",
      source: "unavailable",
    };
  }

  const uniLite = scoring.universities.slice(0, 14).map((u) => ({
    name: u.name,
    tier: u.tier,
    base_score: u.base_score,
    final_score: u.final_score,
    gaps: u.gaps.slice(0, 6),
    actions: u.actions.slice(0, 6),
  }));

  const userPrompt = `Structured placement summary (do not contradict):

GradScore (risk_score_raw from Python scorer): ${scoring.grad_score}

Readiness (from scorer): strengths=${JSON.stringify(scoring.readiness.strengths ?? [])}
Improvement areas (from scorer)=${JSON.stringify(scoring.readiness.improvement_areas ?? [])}

ROI heuristic (context-derived): ${JSON.stringify(scoring.roi)}

Universities ranked by final_score (Python admission_prob ×100 as base_score, then context-aware adjustments): ${JSON.stringify(uniLite)}

Meta: ${JSON.stringify(scoring.meta)}

Write:
1) Best-fit universities for this student and why (use tiers + scores).
2) Strengths to lean on.
3) Realistic weaknesses / gaps.
4) Exact next steps (from actions where present; add 1–2 if list is thin).
Do not invent admission rates or salary numbers not implied by the JSON.`;

  const r = await safeGenerate({
    module: "decision-engine-explanation",
    systemInstruction:
      "You are GradRight’s expert study-abroad + career advisor. Be confident, encouraging, and trustworthy. Ground every claim in the provided JSON. No provider or model talk.",
    userPrompt,
    maxTokens: 2048,
    temperature: 0.35,
    expectJson: false,
  });

  if (r.ok && typeof r.data === "string" && r.data.trim()) {
    return { explanation: r.data.trim(), source: "gemini" };
  }

  return {
    explanation:
      "Could not generate an explanation right now. Refer to the structured scores and university rows in the response.",
    source: "unavailable",
  };
}
