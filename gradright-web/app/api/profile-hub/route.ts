import { ensureGroundedProfileContext } from "@/lib/profile/ensure-grounded-context";
import { buildProfileHubApiPayload } from "@/lib/profile/profile-hub-bundle";
import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * Unified profile hub + grounded web context (single access layer for clients).
 * GET ?refresh=1 forces regeneration of `profile_hub.grounded_context` (Gemini + Search).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role === "nbfc_supervisor") {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "1";

  let meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const ensured = await ensureGroundedProfileContext(supabase, meta, { force });

  meta = ensured.metadata;

  const payload = buildProfileHubApiPayload(meta);

  return NextResponse.json(
    apiSuccess({
      ...payload,
      context_build: {
        from_cache: ensured.fromCache,
        refreshed: ensured.refreshed,
        skip_reason: ensured.skip_reason,
      },
    }),
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
