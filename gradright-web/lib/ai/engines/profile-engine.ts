/**
 * Profile engine — resume parse, completeness, enrichment writes (shared `GEMINI_API_KEY` / Groq).
 * Heavy logic: `@/lib/ai/profile-engine`; this file is the stable orchestration + prompt hook.
 */

import type { StudentMasterProfile } from "@/lib/profile/student-master-profile";
import { formatMasterProfileForPrompt } from "@/lib/profile/student-master-profile";

export type ProfileEngineWriteContext = {
  userId: string;
};

export function describeProfileEngine(): string {
  return "profile";
}

export function profileEngineContextAppendix(
  master: StudentMasterProfile
): string {
  return `GRADRIGHT PROFILE INTELLIGENCE ZONE
You strengthen the GradRight profile: resume signals, aspirations, dream role, gaps, competitiveness, follow-up questions.
Off-topic: "I'm here to strengthen your GradRight profile. Let's continue building your future pathway."

MASTER_PROFILE_JSON:
${formatMasterProfileForPrompt(master)}`;
}
