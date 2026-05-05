import { z } from "zod";

import type { RiskEngineRequestBody } from "@/lib/onboarding/map-risk-input";
import type { NormalizedRiskEngineResult } from "@/lib/onboarding/risk-engine-schema";
import { riskEngineResponseSchema } from "@/lib/onboarding/risk-engine-schema";

import type { AdmissionRequestBody } from "./map-profile-hub-to-risk";

const DEFAULT_TIMEOUT_MS = 12_000;

const admissionOutputSchema = z.object({
  admission_prob: z.number(),
  admit_band: z.enum(["low", "medium", "high"]),
  safer_alternatives: z.array(z.string()),
  ambitious_alternatives: z.array(z.string()),
  key_factors: z.array(z.string()),
});

export type AdmissionEngineResult = z.infer<typeof admissionOutputSchema>;

function baseUrl(): string | null {
  const u = process.env.RISK_ENGINE_URL?.trim();
  return u && u.length > 0 ? u.replace(/\/$/, "") : null;
}

export async function callRiskServiceScore(
  body: RiskEngineRequestBody
): Promise<NormalizedRiskEngineResult | null> {
  const base = baseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/score`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn("[callRiskServiceScore] HTTP", res.status);
      return null;
    }
    const json: unknown = await res.json();
    const parsed = riskEngineResponseSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch (e) {
    console.warn("[callRiskServiceScore]", e);
    return null;
  }
}

export async function callRiskServiceAdmission(
  body: AdmissionRequestBody
): Promise<AdmissionEngineResult | null> {
  const base = baseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/admission`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn("[callRiskServiceAdmission] HTTP", res.status);
      return null;
    }
    const json: unknown = await res.json();
    const parsed = admissionOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch (e) {
    console.warn("[callRiskServiceAdmission]", e);
    return null;
  }
}

export function riskEngineConfigured(): boolean {
  return Boolean(baseUrl());
}
