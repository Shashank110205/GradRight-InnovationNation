import type { SupabaseClient } from "@supabase/supabase-js";

import { ensureGroundedProfileContext } from "@/lib/profile/ensure-grounded-context";

/**
 * Non-blocking: runs after metadata save (e.g. profile-builder). Never throws.
 * Uses existing fingerprint + 24h TTL inside `ensureGroundedProfileContext`.
 */
export function scheduleEnsureGroundedProfileContext(
  supabase: SupabaseClient,
  metadataAfterSave: Record<string, unknown>
): void {
  setTimeout(() => {
    void (async () => {
      try {
        await ensureGroundedProfileContext(supabase, metadataAfterSave, { force: false });
      } catch (e) {
        console.error("[scheduleEnsureGroundedProfileContext]", e);
      }
    })();
  }, 0);
}
