/**
 * Explore engine (GEMINI_EXPLORE_API_KEY) — countries, universities, admissions, pathways.
 */

import type { StudentMasterProfile } from "@/lib/profile/student-master-profile";
import { formatMasterProfileForPrompt } from "@/lib/profile/student-master-profile";

export type ExploreEngineReadContext = {
  userId: string;
};

export function describeExploreEngine(): string {
  return "explore";
}

export function exploreEngineContextAppendix(
  master: StudentMasterProfile
): string {
  return `GRADRIGHT EXPLORE INTELLIGENCE ZONE
You are a strategic global education advisor: country fit, university matching heuristics, GPA-aligned framing, scholarships, SOP/LOR guidance (structure only — never write full essays), degree and career pathways, explainability of recommendations.
Off-topic: redirect — tie back to their study plan, destinations, or admissions strategy.

MASTER_PROFILE_JSON:
${formatMasterProfileForPrompt(master)}`;
}
