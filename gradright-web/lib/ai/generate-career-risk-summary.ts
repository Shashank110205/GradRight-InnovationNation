import { CAREER_RISK_SUMMARY_SYSTEM } from "@/lib/ai/prompts/risk-narrator";
import type { NormalizedRiskEngineResult } from "@/lib/onboarding/risk-engine-schema";
import type { RiskEngineRequestBody } from "@/lib/onboarding/map-risk-input";
import type { RiskLabel, StudentProfile } from "@/lib/types";

const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

function fallbackSummary(
  riskLabel: RiskLabel,
  low: number,
  high: number,
  p6: number
): string {
  const pct = Math.round(p6 * 100);
  if (riskLabel === "low") {
    return `Your profile currently points to a stronger placement outlook, with roughly ${pct}% modeled placement within six months in typical cycles. The estimated salary band near ₹${low}–₹${high} LPA reflects market benchmarks for your pathway. Keep deepening internships and projects so interviews convert into offers.`;
  }
  if (riskLabel === "medium") {
    return `Your placement outlook is moderate: about ${pct}% within six months in our model, with salaries often landing around ₹${low}–₹${high} LPA depending on offers. Timing and role quality will depend on how clearly you signal skills to employers. Prioritize one standout internship or portfolio project aligned with your target roles.`;
  }
  return `Your profile reads higher-risk on placement timing—near ${pct}% within six months in this model—so job search discipline matters more than average. The ₹${low}–₹${high} LPA band is achievable but may take more cycles or geography flexibility. Focus on closing skill gaps employers screen for and expanding proof of work beyond coursework.`;
}

export async function generateCareerRiskSummary(input: {
  risk: NormalizedRiskEngineResult;
  profile: StudentProfile;
  engineInput: RiskEngineRequestBody;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return fallbackSummary(
      input.risk.risk_label,
      input.risk.salary_band_low_lpa,
      input.risk.salary_band_high_lpa,
      input.risk.placement_prob_6m
    );
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  const userPayload = {
    risk_score_raw: input.risk.risk_score_raw,
    risk_label: input.risk.risk_label,
    placement_prob_3m: input.risk.placement_prob_3m,
    placement_prob_6m: input.risk.placement_prob_6m,
    placement_prob_12m: input.risk.placement_prob_12m,
    salary_band_low_lpa: input.risk.salary_band_low_lpa,
    salary_band_high_lpa: input.risk.salary_band_high_lpa,
    top_drivers: input.risk.top_drivers.map((d) => ({
      factor: d.factor,
      direction: d.direction,
    })),
    target_country: input.profile.target_country,
    broad_field: input.profile.broad_field,
    engine_input: {
      institute_tier: input.engineInput.institute_tier,
      internship_months: input.engineInput.internship_months,
      cgpa_normalized: input.engineInput.cgpa_normalized,
    },
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
        max_tokens: 220,
        system: CAREER_RISK_SUMMARY_SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.warn("[generateCareerRiskSummary]", await res.text());
      return fallbackSummary(
        input.risk.risk_label,
        input.risk.salary_band_low_lpa,
        input.risk.salary_band_high_lpa,
        input.risk.placement_prob_6m
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) {
      return fallbackSummary(
        input.risk.risk_label,
        input.risk.salary_band_low_lpa,
        input.risk.salary_band_high_lpa,
        input.risk.placement_prob_6m
      );
    }
    return text.replace(/^["']|["']$/g, "").slice(0, 800);
  } catch (e) {
    console.warn("[generateCareerRiskSummary]", e);
    return fallbackSummary(
      input.risk.risk_label,
      input.risk.salary_band_low_lpa,
      input.risk.salary_band_high_lpa,
      input.risk.placement_prob_6m
    );
  }
}
