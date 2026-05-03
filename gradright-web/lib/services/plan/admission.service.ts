import { generateAdmissionSummary } from "@/lib/ai/generate-admission-summary";
import {
  buildRiskEngineAdmissionBody,
  computeFallbackAdmissionProbability,
  deriveStrengthsWeaknesses,
  mapEngineToLists,
  mapFallbackToLists,
  primaryUniversityFromPayload,
  riskEngineAdmissionOutputSchema,
  type RiskEngineAdmissionOutput,
} from "@/lib/plan/admission-predictor-logic";
import type {
  AdmissionPredictorPostBody,
  AdmissionPredictorResponse,
} from "@/lib/validations/plan";

async function fetchRiskEngineAdmission(
  body: AdmissionPredictorPostBody
): Promise<RiskEngineAdmissionOutput | null> {
  const baseUrl = process.env.RISK_ENGINE_URL?.trim();
  if (!baseUrl) return null;

  const payload = buildRiskEngineAdmissionBody(body);
  const url = `${baseUrl.replace(/\/$/, "")}/admission`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn("[planAdmissionService] engine HTTP", res.status);
      return null;
    }

    const json: unknown = await res.json();
    const parsed = riskEngineAdmissionOutputSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[planAdmissionService] invalid engine payload", parsed.error);
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.warn("[planAdmissionService] engine fetch", e);
    return null;
  }
}

export async function runPlanAdmissionPrediction(
  body: AdmissionPredictorPostBody
): Promise<AdmissionPredictorResponse> {
  const engine = await fetchRiskEngineAdmission(body);

  let admissionProbability: number;
  let lists: {
    safetySchools: string[];
    matchSchools: string[];
    reachSchools: string[];
  };
  let swSource: "engine" | "fallback";
  let engineSnapshot: RiskEngineAdmissionOutput | null;

  if (engine) {
    admissionProbability = Math.round(engine.admission_prob * 10000) / 100;
    lists = mapEngineToLists(body, engine);
    swSource = "engine";
    engineSnapshot = engine;
  } else {
    admissionProbability = computeFallbackAdmissionProbability(body);
    lists = mapFallbackToLists(body);
    swSource = "fallback";
    engineSnapshot = null;
  }

  const { strengths, weaknesses } = deriveStrengthsWeaknesses(body, {
    source: swSource,
    engine: engineSnapshot,
    admissionProbability,
  });

  const primaryLabel = primaryUniversityFromPayload(body.targetUniversity);

  const aiSummary = await generateAdmissionSummary({
    admissionProbability,
    country: body.country,
    degree: body.degree,
    targetCourse: body.targetCourse,
    primaryUniversityLabel: primaryLabel,
    keyStrengths: strengths,
    keyWeaknesses: weaknesses,
    cgpa: body.cgpa,
  });

  return {
    admissionProbability,
    safetySchools: lists.safetySchools,
    matchSchools: lists.matchSchools,
    reachSchools: lists.reachSchools,
    keyStrengths: strengths,
    keyWeaknesses: weaknesses,
    aiSummary,
  };
}
