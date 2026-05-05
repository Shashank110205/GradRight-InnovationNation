import { NextResponse } from "next/server";

import { buildProfileHubApiPayload } from "@/lib/profile/profile-hub-bundle";
import { moduleMetaFromHub } from "@/lib/features/module-contract";
import { apiSuccessMeta } from "@/lib/types";

import type { StudentFeatureContext } from "@/lib/features/student-auth";

function metaFromPayload(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || !("profile_hub" in data)) {
    return {};
  }
  const ph = (data as { profile_hub: unknown }).profile_hub;
  const bundle = buildProfileHubApiPayload({ profile_hub: ph } as Record<string, unknown>);
  const completeness = bundle.profile_hub.system.profile_completeness ?? undefined;
  const mm = moduleMetaFromHub(completeness);
  return {
    profile_completeness: bundle.profile_hub.system.profile_completeness ?? null,
    grounded_last_updated:
      bundle.profile_hub.grounded_context?.last_updated ?? null,
    confidence: mm.confidence,
    completeness: mm.completeness,
  };
}

/** Standard `{ success, data, meta }` envelope for `/api/features/*`. */
export function jsonFeatureResponse<T>(
  ctx: StudentFeatureContext,
  data: T,
  extraMeta?: Record<string, unknown>
): NextResponse {
  const hubFields = metaFromPayload(data);
  return NextResponse.json(
    apiSuccessMeta(data, {
      user_id: ctx.appUser.id,
      ...hubFields,
      ...extraMeta,
    }),
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
