import type { SupabaseClient } from "@supabase/supabase-js";

import { tryParseJsonObject, generateGeminiWithGoogleSearch } from "@/lib/ai/providers/gemini-grounded";
import { getGeminiApiKey } from "@/lib/ai/env";
import {
  GROUNDED_SEARCH_SYSTEM,
  buildGroundedSearchUserPrompt,
  extractProfileSignalsFromUserMetadata,
  finalizeGroundedContext,
  isGroundedContextFresh,
  type GroundedContextV1,
} from "@/lib/profile/grounded-context";
import { applyProfileHubPatch, getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

export type EnsureGroundedResult = {
  metadata: Record<string, unknown>;
  context: GroundedContextV1 | null;
  fromCache: boolean;
  refreshed: boolean;
  skip_reason?: string;
};

/**
 * Ensures `profile_hub.grounded_context` exists and is fresh (24h + fingerprint).
 * Persists via `supabase.auth.updateUser` when regenerated.
 */
export async function ensureGroundedProfileContext(
  supabase: SupabaseClient,
  prevUserMetadata: Record<string, unknown>,
  opts?: { force?: boolean }
): Promise<EnsureGroundedResult> {
  const hub = getProfileHubFromUserMetadata(prevUserMetadata);
  const signals = extractProfileSignalsFromUserMetadata(prevUserMetadata);

  if (!signals) {
    return {
      metadata: prevUserMetadata,
      context: hub.grounded_context ?? null,
      fromCache: true,
      refreshed: false,
      skip_reason: "insufficient_profile_data",
    };
  }

  const existing = hub.grounded_context ?? null;
  if (
    !opts?.force &&
    existing &&
    isGroundedContextFresh(existing, signals.fingerprint)
  ) {
    return {
      metadata: prevUserMetadata,
      context: existing,
      fromCache: true,
      refreshed: false,
    };
  }

  if (!getGeminiApiKey()) {
    return {
      metadata: prevUserMetadata,
      context: existing,
      fromCache: true,
      refreshed: false,
      skip_reason: "gemini_not_configured",
    };
  }

  const userPrompt = buildGroundedSearchUserPrompt(signals);

  let gm = await generateGeminiWithGoogleSearch({
    module: "grounded-profile-context",
    systemInstruction: GROUNDED_SEARCH_SYSTEM,
    prompt: userPrompt,
    maxTokens: 8192,
    temperature: 1,
    responseMimeType: "application/json",
  });

  if (!gm.ok) {
    return {
      metadata: prevUserMetadata,
      context: existing,
      fromCache: true,
      refreshed: false,
      skip_reason: gm.reason,
    };
  }

  let obj = tryParseJsonObject(gm.text);
  if (!obj) {
    gm = await generateGeminiWithGoogleSearch({
      module: "grounded-profile-context:retry",
      systemInstruction: GROUNDED_SEARCH_SYSTEM,
      prompt: userPrompt,
      maxTokens: 8192,
      temperature: 1,
      responseMimeType: "text/plain",
    });
    if (gm.ok) {
      obj = tryParseJsonObject(gm.text);
    }
  }

  if (!obj) {
    return {
      metadata: prevUserMetadata,
      context: existing,
      fromCache: true,
      refreshed: false,
      skip_reason: "invalid_model_json",
    };
  }

  const finalized = finalizeGroundedContext(obj, signals.fingerprint);
  if (!finalized) {
    return {
      metadata: prevUserMetadata,
      context: existing,
      fromCache: true,
      refreshed: false,
      skip_reason: "schema_validation_failed",
    };
  }

  const nextMeta = applyProfileHubPatch(prevUserMetadata, {
    grounded_context: finalized,
  });
  const { error } = await supabase.auth.updateUser({ data: nextMeta });
  if (error) {
    console.error("[ensureGroundedProfileContext] updateUser", error);
    return {
      metadata: prevUserMetadata,
      context: existing,
      fromCache: true,
      refreshed: false,
      skip_reason: error.message,
    };
  }

  return {
    metadata: nextMeta,
    context: finalized,
    fromCache: false,
    refreshed: true,
  };
}
