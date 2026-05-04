import { convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import type { GeminiEngineId } from "@/lib/ai/env";
import { getGeminiApiKeyForEngine } from "@/lib/ai/env";
import type { MentorMode } from "@/lib/ai/mentor-mode";
import { buildMentorSystemPrompt } from "@/lib/ai/prompts/mentor";
import { streamMentorConversation } from "@/lib/ai/gemini-chat";
import { createServerClient } from "@/lib/db/supabase";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import type { UserProfileContext } from "@/lib/types";

export const maxDuration = 60;

const mentorModeSchema = z.enum(["dashboard", "discover", "result", "profile"]);

function mentorModeToEngine(mode: MentorMode): GeminiEngineId {
  if (mode === "discover") return "explore";
  if (mode === "result") return "funding";
  if (mode === "profile") return "profile";
  return "dashboard";
}

const chatPostBodySchema = z.object({
  messages: z.array(z.any()),
  user_id: z.string().uuid(),
  mentor_mode: mentorModeSchema.optional(),
});

function buildUserProfileContext(input: {
  appUser: NonNullable<Awaited<ReturnType<typeof getUserBySupabaseUID>>>;
  profile: Awaited<ReturnType<typeof getStudentProfileByUserId>>;
  risk: Awaited<ReturnType<typeof getLatestRiskScoreByUserId>>;
}): UserProfileContext {
  const first =
    input.appUser.full_name?.trim().split(/\s+/)[0] ?? "Student";

  const p = input.profile;
  const aspiration_summary =
    p?.aspiration_text?.trim() ||
    p?.five_year_goal?.trim() ||
    null;
  const top_skills_preview =
    p?.extracted_skills?.length && p.extracted_skills.length > 0
      ? p.extracted_skills.slice(0, 6).join(", ")
      : null;
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
    aspiration_summary,
    dream_role: p?.dream_role?.trim() || null,
    career_priority: p?.scholarship_priority?.trim() || null,
    profile_completeness_score: p?.profile_completeness_score ?? null,
    top_skills_preview,
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

  const { messages: uiMessagesRaw, user_id, mentor_mode: mentorModeRaw } =
    parsed.data;
  const mentor_mode: MentorMode = mentorModeRaw ?? "dashboard";
  const uiMessages = uiMessagesRaw as UIMessage[];
  if (user_id !== appUser.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const engine = mentorModeToEngine(mentor_mode);
  if (!getGeminiApiKeyForEngine(engine)) {
    return new Response(
      "Chat is not configured: set GEMINI_DASHBOARD_API_KEY (or the engine-specific key, or legacy GEMINI_API_KEY) in .env.local.",
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
  const system = buildMentorSystemPrompt(profileContext, mentor_mode);

  const modelMessages = await convertToModelMessages(
    uiMessages.map(({ id: _id, ...rest }) => rest)
  );

  try {
    const result = streamMentorConversation(system, modelMessages, {
      engine,
    });
    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error("[POST /api/ai/chat]", e);
    const message = e instanceof Error ? e.message : "Chat failed";
    return new Response(message, { status: 500 });
  }
}
