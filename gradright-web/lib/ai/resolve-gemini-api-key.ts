import { getPrimaryGeminiApiKey } from "@/lib/ai/env";

/** @deprecated Import from `@/lib/ai/env` — kept for backward compatibility. */
export function resolveGeminiApiKey(): string | undefined {
  return getPrimaryGeminiApiKey();
}
