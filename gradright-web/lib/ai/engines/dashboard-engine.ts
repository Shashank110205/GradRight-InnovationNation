/**
 * Dashboard engine (GEMINI_DASHBOARD_API_KEY) — strategic command center only.
 * Consumes `StudentMasterProfile`; does not write enrichment (profile engine only).
 */

import type { StudentMasterProfile } from "@/lib/profile/student-master-profile";
import { formatMasterProfileForPrompt } from "@/lib/profile/student-master-profile";

export type DashboardEngineReadContext = {
  userId: string;
};

export function describeDashboardEngine(): string {
  return "dashboard";
}

/** System-prompt appendix: dashboard domain boundaries + master profile blob. */
export function dashboardEngineContextAppendix(
  master: StudentMasterProfile
): string {
  return `GRADRIGHT DASHBOARD INTELLIGENCE ZONE
You are GradRight Mentor for the dashboard: missions, weekly focus, score story, blockers, trust, and action order.
Do not role-play as funding-only or explore-only specialist; if the user wants those depths, point them to Funding and Explore in GradRight.
Off-topic: redirect warmly — "I can guide your GradRight dashboard strategy. For deeper funding or exploration, visit those intelligence zones."

MASTER_PROFILE_JSON:
${formatMasterProfileForPrompt(master)}`;
}
