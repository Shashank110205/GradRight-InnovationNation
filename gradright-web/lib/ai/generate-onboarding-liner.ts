import { ONBOARDING_RISK_ONE_LINER_SYSTEM } from "@/lib/ai/prompts/risk-narrator";
import type { GradRightScore, OnboardingAnswers, RiskLabel } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

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

export async function generateOnboardingRiskOneLiner(input: {
  answers: OnboardingAnswers;
  riskLabel: RiskLabel;
  salaryLow: number;
  salaryHigh: number;
  loanEligibilityBand: GradRightScore["loan_eligibility_band"];
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return fallbackOneLiner(
      input.riskLabel,
      input.salaryLow,
      input.salaryHigh
    );
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

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

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 120,
        system: ONBOARDING_RISK_ONE_LINER_SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      console.warn("[generateOnboardingRiskOneLiner]", await res.text());
      return fallbackOneLiner(
        input.riskLabel,
        input.salaryLow,
        input.salaryHigh
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) {
      return fallbackOneLiner(
        input.riskLabel,
        input.salaryLow,
        input.salaryHigh
      );
    }
    return text.replace(/^["']|["']$/g, "").slice(0, 400);
  } catch (e) {
    console.warn("[generateOnboardingRiskOneLiner]", e);
    return fallbackOneLiner(
      input.riskLabel,
      input.salaryLow,
      input.salaryHigh
    );
  }
}
