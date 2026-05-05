import { createServerClient } from "@/lib/db/supabase";
import { appendProfileNotesBlock } from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { applyProfileHubPatch } from "@/lib/profile/user-profile-hub";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  block: z.string().min(1).max(8000),
});

/** Append a chat exchange to `aspiration_text` trail (C-007 chatbot merge). */
export async function POST(request: Request): Promise<NextResponse> {
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

  const rate = await enforceAiChatRateLimit(appUser.id);
  if (!rate.allowed) {
    return NextResponse.json(apiError("Too many requests — try again shortly."), {
      status: 429,
    });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(apiError("Invalid body"), { status: 400 });
  }

  try {
    await appendProfileNotesBlock(appUser.id, parsed.data.block.trim());

    const prevMeta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const nextMeta = applyProfileHubPatch(prevMeta, {
      appendCoachTurn: {
        kind: "profile_coach_notes",
        text: parsed.data.block.trim(),
      },
    });
    const { error: hubErr } = await supabase.auth.updateUser({ data: nextMeta });
    if (hubErr) {
      console.error("[profile-chat-notes] profile_hub", hubErr);
    }

    return NextResponse.json(apiSuccess({ ok: true, profile_hub_synced: !hubErr }));
  } catch (e) {
    console.error("[profile-chat-notes]", e);
    return NextResponse.json(apiError("Could not append notes."), { status: 500 });
  }
}
