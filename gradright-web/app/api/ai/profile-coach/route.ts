import { getGeminiApiKeyForEngine } from "@/lib/ai/env";
import { GRADRIGHT_AI_FALLBACK_MESSAGE } from "@/lib/ai/psychology-layer";
import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import { apiError, apiSuccess } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  step: z.enum([
    "greet",
    "resume",
    "aspiration",
    "country",
    "priority",
    "dream",
  ]),
  prior_question: z.string().max(2000),
  user_message: z.string().max(4000),
});

const coachOutSchema = z.object({
  advance: z.boolean(),
  assistant_message: z.string().max(800).optional(),
});

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

  const { step, prior_question, user_message } = parsed.data;
  const trimmed = user_message.trim();

  if (!trimmed) {
    return NextResponse.json(
      apiSuccess({ advance: true, assistant_message: undefined })
    );
  }

  const hi = /^(hi|hello|hey|good\s+(morning|afternoon|evening)|namaste)\b/i;
  if (hi.test(trimmed) && trimmed.length < 48) {
    return NextResponse.json(
      apiSuccess({
        advance: true,
        assistant_message: "Hi — excited to learn more about you.",
      })
    );
  }

  const apiKey = getGeminiApiKeyForEngine("profile");
  if (!apiKey) {
    return NextResponse.json(
      apiSuccess({
        advance: true,
        assistant_message: GRADRIGHT_AI_FALLBACK_MESSAGE,
      })
    );
  }

  const modelId = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = `You are GradRight Profile Intelligence coach. Tone: warm, never shaming; redirect off-topic with premium calm.
The student is in a structured profile flow.
Current step id: ${step}
The official question we need answered:
"""${prior_question}"""

Student message:
"""${trimmed}"""

Return ONLY JSON: { "advance": boolean, "assistant_message"?: string }
Rules:
- advance=true if the message reasonably answers the question OR is a short greeting/small-talk that we can acknowledge and still move on.
- advance=false if the message is clearly unrelated (movies, games, random trivia) — then assistant_message must redirect: you're here to strengthen their GradRight profile; one short warm paragraph, back to the question.
- If advance=false, assistant_message is required.
- Never ask a new unrelated question; keep them on the current step.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.response.text();
    const raw = JSON.parse(text) as unknown;
    const out = coachOutSchema.safeParse(raw);
    if (!out.success) {
      return NextResponse.json(apiSuccess({ advance: true }));
    }
    return NextResponse.json(apiSuccess(out.data));
  } catch (e) {
    console.error("[profile-coach]", e);
    return NextResponse.json(apiSuccess({ advance: true }));
  }
}
