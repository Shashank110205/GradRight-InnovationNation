/**
 * Progress psychology: stage names for questions 1–7 (0-based step index 0–6).
 * Review (7) and consent (8) use closing-stage labels.
 */

export function onboardingJourneyStageLabel(currentStep: number): string {
  if (currentStep >= 8) return "Unlocking";
  if (currentStep >= 7) return "Reflecting";
  if (currentStep >= 6) return "Revealing";
  if (currentStep >= 4) return "Predicting";
  if (currentStep >= 2) return "Evaluating";
  return "Discovering";
}

export function onboardingFoundationHint(currentStep: number): string | null {
  if (currentStep >= 8) return null;
  if (currentStep >= 7)
    return "You're building your GradRight foundation — one last look, then your score.";
  return "You're building your GradRight foundation.";
}
