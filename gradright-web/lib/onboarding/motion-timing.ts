/** Minimum dwell on post-answer insight cards so users can read both lines (ms). */
export const ONBOARDING_INSIGHT_DWELL_MS = 3800;

/** WOW carousel auto-advance when user does not tap dots (ms). */
export const SCORE_REVEAL_AUTO_ADVANCE_MS = 4000;

/** Premium handoff after WOW unlock before navigating to dashboard (ms). */
export const DASHBOARD_ENTRY_TRANSITION_MS = 2800;

/** Shared easing for onboarding transitions (premium, not sluggish). */
export const ONBOARDING_EASE = [0.22, 1, 0.36, 1] as const;

/** Option list stagger (seconds). */
export const ONBOARDING_OPTION_STAGGER_CHILD = 0.058;
export const ONBOARDING_OPTION_STAGGER_DELAY = 0.048;
