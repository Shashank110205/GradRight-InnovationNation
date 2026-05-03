import type { GradRightScore, OnboardingAnswers } from "@/lib/types";

const ASPIRATION_LINES = [
  "You may be positioned for stronger admits and smarter financing pathways.",
  "Your profile shows meaningful potential — sharper inputs can unlock higher-confidence opportunities.",
  "You are building toward competitive outcomes. Precision improves as your profile intelligence deepens.",
] as const;

function hashPick(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)!;
    h |= 0;
  }
  return Math.abs(h) % mod;
}

export function pickAspirationHeadline(score: GradRightScore, answers: OnboardingAnswers): string {
  const seed = `${answers.broad_field ?? ""}|${answers.target_country ?? ""}|${score.university_matches[0]?.cluster ?? ""}`;
  return ASPIRATION_LINES[hashPick(seed, ASPIRATION_LINES.length)]!;
}

export function admissionOutlookLabel(score: GradRightScore): string {
  const fits = score.university_matches.map((m) => m.fit_percentage);
  if (!fits.length) return "Promising — refine targets to sharpen";
  const avg = fits.reduce((a, b) => a + b, 0) / fits.length;
  if (avg >= 78) return "Strong directional fit";
  if (avg >= 62) return "Solid potential with room to refine";
  return "Early signal — shortlist work will lift clarity";
}

export function placementOutlookLabel(score: GradRightScore): string {
  if (score.risk_label === "low") return "Constructive placement outlook";
  if (score.risk_label === "medium") return "Balanced outlook — execution matters";
  return "Higher variance — positioning and proof points help";
}

export function salaryPotentialLine(score: GradRightScore): string {
  const mid = Math.round((score.salary_band_low_lpa + score.salary_band_high_lpa) / 2);
  return `Indicative salary band center ~₹${mid} LPA (not a guarantee)`;
}

export function financingReadinessLabel(score: GradRightScore): string {
  if (score.loan_eligibility_band === "likely") return "Financing readiness looks supportive";
  if (score.loan_eligibility_band === "moderate") return "Financing readiness is workable with planning";
  return "Financing may need stronger signals or co-support";
}
