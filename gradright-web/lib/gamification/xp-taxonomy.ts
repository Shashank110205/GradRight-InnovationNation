import { z } from "zod";

import type { GamificationAction } from "@/lib/types";

/** Matches ARCHITECTURE.md §9 — do not change values without DB/product review. */
export const GAMIFICATION_XP_AND_BADGES: Record<
  GamificationAction,
  { xp: number; badge: string | null }
> = {
  onboarding_complete: { xp: 50, badge: "First Step" },
  profile_academic_complete: { xp: 75, badge: "Scholar" },
  predictor_first_run: { xp: 40, badge: "Calculated" },
  career_risk_first_view: { xp: 60, badge: "Risk-Aware" },
  financing_first_view: { xp: 30, badge: null },
  loan_tab_opened: { xp: 20, badge: null },
  document_first_upload: { xp: 50, badge: "Prepared" },
  streak_7_days: { xp: 100, badge: "Consistent" },
  streak_30_days: { xp: 300, badge: "Dedicated" },
  referral_signup: { xp: 150, badge: "Champion" },
  loan_application_submitted: { xp: 200, badge: "Ready" },
};

export const GAMIFICATION_ACTION_VALUES = [
  "onboarding_complete",
  "profile_academic_complete",
  "predictor_first_run",
  "career_risk_first_view",
  "financing_first_view",
  "loan_tab_opened",
  "document_first_upload",
  "streak_7_days",
  "streak_30_days",
  "referral_signup",
  "loan_application_submitted",
] as const satisfies readonly GamificationAction[];

export const gamificationActionSchema = z.enum(GAMIFICATION_ACTION_VALUES);

/** Awarded only server-side from `/api/user/streak-check`. */
export const STREAK_MILESTONE_ACTIONS: GamificationAction[] = [
  "streak_7_days",
  "streak_30_days",
];

export function isStreakMilestoneAction(
  action: string
): action is GamificationAction {
  return STREAK_MILESTONE_ACTIONS.includes(action as GamificationAction);
}

export function getRewardForAction(action: GamificationAction): {
  xp: number;
  badge: string | null;
} {
  return GAMIFICATION_XP_AND_BADGES[action];
}
