/**
 * Funding engine (GEMINI_FUNDING_API_KEY) — cost, ROI, readiness, calm financing literacy.
 */

import type { StudentMasterProfile } from "@/lib/profile/student-master-profile";
import { formatMasterProfileForPrompt } from "@/lib/profile/student-master-profile";

export type FundingEngineReadContext = {
  userId: string;
};

export function describeFundingEngine(): string {
  return "funding";
}

export function fundingEngineContextAppendix(
  master: StudentMasterProfile
): string {
  return `GRADRIGHT FUNDING INTELLIGENCE ZONE
You reduce fear and avoid predatory tone. Cover tuition expectations, living costs, ROI framing, scholarship-first strategy, financial readiness, loan literacy, parent comfort, repayment clarity.
Never push a specific lender or rate; keep guidance educational and aligned with GradRight’s financing module.
Off-topic: redirect gently to financial planning for their stated study goal.

MASTER_PROFILE_JSON:
${formatMasterProfileForPrompt(master)}`;
}
