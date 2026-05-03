import type { OnboardingAnswers, GradRightScore, RiskLabel } from "@/lib/types";

export function deriveLoanEligibilityBand(
  riskLabel: RiskLabel,
  answers: OnboardingAnswers
): GradRightScore["loan_eligibility_band"] {
  if (!answers.loan_needed) {
    return "moderate";
  }
  if (riskLabel === "low") return "likely";
  if (riskLabel === "medium") return "moderate";
  return "unlikely";
}
