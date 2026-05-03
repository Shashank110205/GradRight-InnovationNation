import type { OnboardingAnswers } from "@/lib/types";

import {
  computeFallbackRiskEngineResult,
  computeFallbackRiskEngineResultFromBody,
} from "./fallback-risk";
import { mapAnswersToRiskEngineBody, type RiskEngineRequestBody } from "./map-risk-input";
import {
  riskEngineResponseSchema,
  type NormalizedRiskEngineResult,
} from "./risk-engine-schema";

export type { NormalizedRiskEngineResult };

export async function fetchRiskEngineScoreFromBody(
  body: RiskEngineRequestBody
): Promise<NormalizedRiskEngineResult> {
  const baseUrl = process.env.RISK_ENGINE_URL?.trim();

  if (!baseUrl) {
    return computeFallbackRiskEngineResultFromBody(body);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/score`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) {
      console.warn(
        "[fetchRiskEngineScoreFromBody] HTTP",
        res.status,
        await res.text()
      );
      return computeFallbackRiskEngineResultFromBody(body);
    }

    const json: unknown = await res.json();
    const parsed = riskEngineResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.warn(
        "[fetchRiskEngineScoreFromBody] invalid payload",
        parsed.error
      );
      return computeFallbackRiskEngineResultFromBody(body);
    }
    return parsed.data;
  } catch (e) {
    console.warn("[fetchRiskEngineScoreFromBody]", e);
    return computeFallbackRiskEngineResultFromBody(body);
  }
}

export async function fetchRiskEngineScore(
  answers: OnboardingAnswers
): Promise<NormalizedRiskEngineResult> {
  const baseUrl = process.env.RISK_ENGINE_URL?.trim();
  const payload = mapAnswersToRiskEngineBody(answers);

  if (!baseUrl) {
    return computeFallbackRiskEngineResult(answers);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/score`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) {
      console.warn("[fetchRiskEngineScore] HTTP", res.status, await res.text());
      return computeFallbackRiskEngineResult(answers);
    }

    const json: unknown = await res.json();
    const parsed = riskEngineResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[fetchRiskEngineScore] invalid payload", parsed.error);
      return computeFallbackRiskEngineResult(answers);
    }
    return parsed.data;
  } catch (e) {
    console.warn("[fetchRiskEngineScore]", e);
    return computeFallbackRiskEngineResult(answers);
  }
}
