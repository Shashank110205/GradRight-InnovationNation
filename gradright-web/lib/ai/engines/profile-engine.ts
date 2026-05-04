/**
 * Profile engine (GEMINI_PROFILE_API_KEY) — resume parse, completeness, enrichment writes.
 * Heavy logic lives in `@/lib/ai/profile-engine`; this module is the stable orchestration hook.
 */
export type ProfileEngineWriteContext = {
  userId: string;
};

export function describeProfileEngine(): string {
  return "profile";
}
