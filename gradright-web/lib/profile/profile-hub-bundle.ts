import { MAX_GROUNDED_SEARCHES_PER_USER } from "@/lib/profile/grounded-context";
import { PROFILE_HUB_VERSION, getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

/**
 * Single JSON shape for clients and server modules — all intelligence paths should
 * consume this instead of ad-hoc `user_metadata` field reads.
 */
export function buildProfileHubApiPayload(userMetadata: Record<string, unknown>) {
  const hub = getProfileHubFromUserMetadata(userMetadata);
  return {
    profile_hub: {
      version: hub.version,
      updated_at: hub.updated_at,
      onboarding: hub.onboarding ?? null,
      profile_intelligence: userMetadata.profile_intelligence ?? null,
      grounded_context: hub.grounded_context ?? null,
      system: {
        profile_hub_version: PROFILE_HUB_VERSION,
        context_cache_ttl_hours: 24,
        profile_completeness:
          typeof hub.system?.profile_completeness === "number"
            ? hub.system.profile_completeness
            : null,
        last_updated: hub.system?.last_updated ?? null,
        grounded_search_count:
          typeof hub.system?.grounded_search_count === "number"
            ? hub.system.grounded_search_count
            : 0,
        grounded_search_cap: MAX_GROUNDED_SEARCHES_PER_USER,
      },
      resume_gemini: hub.resume_gemini ?? null,
      coach_turns: hub.coach_turns ?? [],
      goals_snapshot: hub.goals_snapshot ?? null,
      resume_snapshot: hub.resume_snapshot ?? null,
    },
  };
}
