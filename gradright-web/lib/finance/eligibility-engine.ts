import { z } from "zod";

import type { LoanEligibilityEstimate } from "@/lib/types";

/** Mirrors risk-service `main.py` `_estimate_eligibility` (rule engine v1). */
export function computeEligibilityEstimateLocally(input: {
  loan_amount_requested: number;
  salary_band_low_lpa: number;
  salary_band_high_lpa: number;
  family_income_annual: number;
  collateral_available: boolean;
}): LoanEligibilityEstimate {
  const midLpa = (input.salary_band_low_lpa + input.salary_band_high_lpa) / 2;
  const monthlyGross = (midLpa * 100_000) / 12;
  const takehome = monthlyGross * 0.78;

  const annualRate = 0.115;
  const monthlyRate = annualRate / 12;
  const tenure = 120;

  function emiForPrincipal(principal: number): number {
    if (principal <= 0) return 0;
    const r = monthlyRate;
    return (principal * r * (1 + r) ** tenure) / ((1 + r) ** tenure - 1);
  }

  const emiRequested = emiForPrincipal(input.loan_amount_requested);
  const incomeToEmiRatio =
    takehome > 0
      ? Math.round((emiRequested / takehome) * 100 * 100) / 100
      : 100;

  const comfortLow = Math.round(takehome * 0.25 * 100) / 100;
  const comfortHigh = Math.round(takehome * 0.4 * 100) / 100;

  let emiCapFraction = input.collateral_available ? 0.38 : 0.3;
  if (input.family_income_annual >= 1_200_000) {
    emiCapFraction += 0.04;
  }

  const maxEmi = takehome * emiCapFraction;
  const r = monthlyRate;
  const maxLoan =
    maxEmi * ((1 + r) ** tenure - 1) / (r * (1 + r) ** tenure);
  let maxRecommended = Math.round(
    Math.min(maxLoan, input.loan_amount_requested * 1.15) * 100
  ) / 100;
  maxRecommended = Math.max(0, maxRecommended);

  let band: LoanEligibilityEstimate["eligibility_band"];
  if (
    incomeToEmiRatio <= 28 &&
    (input.collateral_available || input.family_income_annual >= 800_000)
  ) {
    band = "likely";
  } else if (incomeToEmiRatio <= 42) {
    band = "moderate";
  } else {
    band = "unlikely";
  }

  return {
    eligibility_band: band,
    max_recommended_loan: maxRecommended,
    comfort_emi_range: { low: comfortLow, high: comfortHigh },
    income_to_emi_ratio: incomeToEmiRatio,
  };
}

const eligibilityOutputSchema = z.object({
  eligibility_band: z.enum(["likely", "moderate", "unlikely"]),
  max_recommended_loan: z.number(),
  comfort_emi_range: z.object({
    low: z.number(),
    high: z.number(),
  }),
  income_to_emi_ratio: z.number(),
});

export async function fetchRiskEngineEligibility(input: {
  loan_amount_requested: number;
  salary_band_low_lpa: number;
  salary_band_high_lpa: number;
  family_income_annual: number;
  collateral_available: boolean;
}): Promise<LoanEligibilityEstimate> {
  const baseUrl = process.env.RISK_ENGINE_URL?.trim();
  if (!baseUrl) {
    return computeEligibilityEstimateLocally(input);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/eligibility`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loan_amount_requested: input.loan_amount_requested,
        salary_band_low_lpa: input.salary_band_low_lpa,
        salary_band_high_lpa: input.salary_band_high_lpa,
        family_income_annual: input.family_income_annual,
        collateral_available: input.collateral_available,
      }),
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) {
      console.warn(
        "[fetchRiskEngineEligibility] HTTP",
        res.status,
        await res.text()
      );
      return computeEligibilityEstimateLocally(input);
    }

    const json: unknown = await res.json();
    const parsed = eligibilityOutputSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[fetchRiskEngineEligibility] invalid payload", parsed.error);
      return computeEligibilityEstimateLocally(input);
    }

    return parsed.data;
  } catch (e) {
    console.warn("[fetchRiskEngineEligibility]", e);
    return computeEligibilityEstimateLocally(input);
  }
}

export const LOAN_ELIGIBILITY_DISCLAIMER =
  "This is a non-binding estimate. Actual eligibility is determined by lender review.";
