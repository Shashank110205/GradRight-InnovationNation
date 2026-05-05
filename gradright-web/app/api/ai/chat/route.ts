import { convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { getGeminiApiKey } from "@/lib/ai/env";
import type { MentorMode } from "@/lib/ai/mentor-mode";
import { buildMentorSystemPrompt } from "@/lib/ai/prompts/mentor";
import { streamMentorConversation } from "@/lib/ai/gemini-chat";
import { ensureGroundedProfileContext } from "@/lib/profile/ensure-grounded-context";
import { formatGroundedContextForPrompt } from "@/lib/profile/grounded-context";
import { buildStudentIntelligence } from "@/lib/profile/student-intelligence";
import { buildStudentMasterProfile } from "@/lib/profile/student-master-profile";
import { createServerClient } from "@/lib/db/supabase";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { GRADRIGHT_AI_FALLBACK_MESSAGE } from "@/lib/ai/psychology-layer";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import type { UserProfileContext } from "@/lib/types";

export const maxDuration = 60;

const mentorModeSchema = z.enum(["dashboard", "discover", "result", "profile"]);

const chatPostBodySchema = z.object({
  messages: z.array(z.any()),
  user_id: z.string().uuid(),
  mentor_mode: mentorModeSchema.optional(),
  explore_context: z.string().max(8000).optional(),
});

function lastUserTextFromUiMessages(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== "user") continue;
    const parts = (m as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) continue;
    const chunks: string[] = [];
    for (const p of parts) {
      if (
        p &&
        typeof p === "object" &&
        (p as { type?: string }).type === "text" &&
        typeof (p as { text?: string }).text === "string"
      ) {
        chunks.push((p as { text: string }).text);
      }
    }
    const joined = chunks.join(" ").trim();
    if (joined) return joined;
  }
  return null;
}

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
  let cgpa_display: string | null = null;
  if (p?.cgpa != null && Number.isFinite(p.cgpa)) {
    const scale = p.cgpa_scale ?? 10;
    cgpa_display = `${p.cgpa} / ${scale}`;
  }
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
    cgpa_display,
    budget_band_display: p?.budget_band_usd?.trim() || null,
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

  const {
    messages: uiMessagesRaw,
    user_id,
    mentor_mode: mentorModeRaw,
    explore_context: exploreContextRaw,
  } = parsed.data;
  const mentor_mode: MentorMode = mentorModeRaw ?? "dashboard";
  const uiMessages = uiMessagesRaw as UIMessage[];
  if (user_id !== appUser.id) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!getGeminiApiKey()) {
    return new Response(GRADRIGHT_AI_FALLBACK_MESSAGE, { status: 503 });
  }

  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const [profile, risk, master, grounded] = await Promise.all([
    getStudentProfileByUserId(appUser.id),
    getLatestRiskScoreByUserId(appUser.id),
    buildStudentMasterProfile(appUser.id),
    ensureGroundedProfileContext(supabase, meta, { force: false }),
  ]);

  const profileContext = buildUserProfileContext({
    appUser,
    profile,
    risk,
  });
  const lastUserMessage = lastUserTextFromUiMessages(uiMessages);
  const intelligence = buildStudentIntelligence(profile);
  const intelligence_digest = [
    `cgpa_band: ${intelligence.cgpa_band}`,
    `risk_level: ${intelligence.risk_level}`,
    `financial_capacity: ${intelligence.financial_capacity}`,
    `scholarship_need: ${intelligence.scholarship_need}`,
    `career_direction: ${intelligence.career_direction}`,
    `ambition_level: ${intelligence.ambition_level}`,
    `profile_summary: ${intelligence.profile_summary}`,
  ].join("\n");
  const explore_context = exploreContextRaw?.trim() || null;
  const grounded_web_context =
    formatGroundedContextForPrompt(grounded.context) || null;

  const system = buildMentorSystemPrompt(profileContext, mentor_mode, master, {
    lastUserMessage,
    explore_context,
    intelligence_digest,
    grounded_web_context,
  });

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
