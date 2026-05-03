import { convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { MENTOR_SYSTEM_PROMPT } from "@/lib/ai/prompts/mentor";
import { resolveGeminiApiKey } from "@/lib/ai/resolve-gemini-api-key";
import { streamMentorConversation } from "@/lib/ai/gemini-chat";
import { createServerClient } from "@/lib/db/supabase";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import type { UserProfileContext } from "@/lib/types";

export const maxDuration = 60;

const chatPostBodySchema = z.object({
  messages: z.array(z.any()),
  user_id: z.string().uuid(),
});

function buildUserProfileContext(input: {
  appUser: NonNullable<Awaited<ReturnType<typeof getUserBySupabaseUID>>>;
  profile: Awaited<ReturnType<typeof getStudentProfileByUserId>>;
  risk: Awaited<ReturnType<typeof getLatestRiskScoreByUserId>>;
}): UserProfileContext {
  const first =
    input.appUser.full_name?.trim().split(/\s+/)[0] ?? "Student";

  const p = input.profile;
  return {
    first_name: first,
    target_country: p?.target_country?.trim() || "not set",
    degree_type: p?.degree_type?.trim() || "not set",
    broad_field: p?.broad_field?.trim() || "not set",
    target_intake: p?.target_intake?.trim() || "not set",
    current_academic_level:
      p?.current_academic_level?.trim() || "not set",
    journey_stage: input.appUser.journey_stage,
    risk_label: input.risk?.risk_label ?? null,
  };
}

export async function POST(req: Request): Promise<Response> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rate = await enforceAiChatRateLimit(appUser.id);
  if (!rate.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(rate.retryAfterSec),
      },
    });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = chatPostBodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(parsed.error.message, { status: 400 });
  }

  const { messages: uiMessagesRaw, user_id } = parsed.data;
  const uiMessages = uiMessagesRaw as UIMessage[];
  if (user_id !== appUser.id) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!resolveGeminiApiKey()) {
    return new Response(
      "Chat is not configured: set GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY / GOOGLE_API_KEY) in .env.local.",
      { status: 503 }
    );
  }

  const [profile, risk] = await Promise.all([
    getStudentProfileByUserId(appUser.id),
    getLatestRiskScoreByUserId(appUser.id),
  ]);

  const profileContext = buildUserProfileContext({
    appUser,
    profile,
    risk,
  });
  const system = MENTOR_SYSTEM_PROMPT(profileContext);

  const modelMessages = await convertToModelMessages(
    uiMessages.map(({ id: _id, ...rest }) => rest)
  );

  try {
    const result = streamMentorConversation(system, modelMessages);
    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error("[POST /api/ai/chat]", e);
    const message = e instanceof Error ? e.message : "Chat failed";
    return new Response(message, { status: 500 });
  }
}
