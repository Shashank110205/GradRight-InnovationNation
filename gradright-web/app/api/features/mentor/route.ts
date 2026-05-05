import { NextResponse } from "next/server";
import { z } from "zod";

import { explainMentorReplyWithGemini } from "@/lib/features/gemini-feature-explain";
import { requireStudentFeatureAuth } from "@/lib/features/student-auth";
import { jsonFeatureResponse } from "@/lib/features/json-feature-response";
import { ensureGroundedProfileContext } from "@/lib/profile/ensure-grounded-context";
import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";
import { buildProfileHubApiPayload } from "@/lib/profile/profile-hub-bundle";
import { apiError } from "@/lib/types";

const bodySchema = z.object({
  message: z.string().min(1).max(8000),
});

/**
 * AI mentor: profile_hub + grounded_context only (no direct student_profiles DB in this path).
 */
export async function POST(req: Request): Promise<NextResponse> {
  const auth = await requireStudentFeatureAuth();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    body = bodySchema.parse(json);
  } catch {
    return NextResponse.json(apiError("Invalid body: { message: string }"), { status: 400 });
  }

  const ensured = await ensureGroundedProfileContext(auth.ctx.supabase, auth.ctx.meta, {
    force: false,
  });
  const meta = ensured.metadata;
  const grounded = getProfileHubFromUserMetadata(meta).grounded_context ?? null;

  const { text, source } = await explainMentorReplyWithGemini({
    userMessage: body.message,
    meta,
    grounded,
  });

  const bundle = buildProfileHubApiPayload(meta);

  return jsonFeatureResponse(auth.ctx, {
    profile_hub: bundle.profile_hub,
    response: text,
    source,
    context_build: {
      from_cache: ensured.fromCache,
      refreshed: ensured.refreshed,
      skip_reason: ensured.skip_reason,
    },
  });
}
