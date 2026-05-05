import { generateGeminiText } from "@/lib/ai/gemini-text-client";
import { ONBOARDING_RISK_ONE_LINER_SYSTEM } from "@/lib/ai/prompts/risk-narrator";
import type { GradRightScore, OnboardingAnswers, RiskLabel } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

function fallbackOneLiner(
  riskLabel: RiskLabel,
  low: number,
  high: number
): string {
  if (riskLabel === "low") {
    return `Your early profile suggests a solid placement outlook, with estimated salaries around ₹${low}–₹${high} LPA depending on offers and location.`;
  }
  if (riskLabel === "medium") {
    return `Your profile shows a moderate placement outlook; internships and test scores will matter most for pushing into the ₹${low}–₹${high} LPA range.`;
  }
  return `Your profile reads higher-risk on placement timing; focus on internships and strengthening academics to improve outcomes in the ₹${low}–₹${high} LPA band.`;
}

/** C-003: Post-onboarding GradScore one-liner — Gemini `dashboard` key (first-touch journey copy). */
export async function generateOnboardingRiskOneLiner(input: {
  answers: OnboardingAnswers;
  riskLabel: RiskLabel;
  salaryLow: number;
  salaryHigh: number;
  loanEligibilityBand: GradRightScore["loan_eligibility_band"];
}): Promise<string> {
  const userPayload = {
    risk_label: input.riskLabel,
    salary_band_low_lpa: input.salaryLow,
    salary_band_high_lpa: input.salaryHigh,
    loan_eligibility_band: input.loanEligibilityBand,
    target_country: input.answers.target_country,
    target_countries: parseTargetCountries(input.answers.target_country),
    degree_type: input.answers.degree_type,
    broad_field: input.answers.broad_field,
    budget_band_usd: input.answers.budget_band_usd,
    loan_needed: input.answers.loan_needed,
  };

  const res = await generateGeminiText({
    module: "onboarding-liner",
    systemInstruction: ONBOARDING_RISK_ONE_LINER_SYSTEM,
    userText: JSON.stringify(userPayload),
    maxOutputTokens: 200,
    responseMimeType: "text/plain",
    temperature: 0.45,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.warn("[generateOnboardingRiskOneLiner]", res.error);
    return fallbackOneLiner(
      input.riskLabel,
      input.salaryLow,
      input.salaryHigh
    );
  }

  const text = res.text.replace(/^["']|["']$/g, "").trim().slice(0, 400);
  if (!text) {
    return fallbackOneLiner(
      input.riskLabel,
      input.salaryLow,
      input.salaryHigh
    );
  }
  return text;
}
