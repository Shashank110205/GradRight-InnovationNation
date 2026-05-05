import { NextResponse } from "next/server";

import { generateGeminiText } from "@/lib/ai/gemini-text-client";
import { CAREER_NAVIGATOR_JSON_SYSTEM } from "@/lib/ai/prompts/career-navigator";
import { buildCareerNavigatorFallback } from "@/lib/ai/career-navigator-fallback";
import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiRateLimiters } from "@/lib/rate-limit/api-rate-limiters";
import {
  careerNavigatorPostBodySchema,
  careerNavigatorResponseSchema,
  type CareerNavigatorPostBody,
  type CareerNavigatorResponse,
} from "@/lib/validations/career-navigator";

export const maxDuration = 120;

function stripJsonFence(text: string): string {
  return text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "").trim();
}

function normalizeToFive(
  parsed: CareerNavigatorResponse,
  input: CareerNavigatorPostBody
): CareerNavigatorResponse {
  const fb = buildCareerNavigatorFallback(input);
  const sorted = [...parsed.topRecommendations].sort(
    (a, b) => a.rank - b.rank
  );
  let recs = sorted.slice(0, 5);
  let guard = 0;
  while (recs.length < 5 && guard < 8) {
    guard += 1;
    const pad = fb.topRecommendations[recs.length];
    if (pad) {
      recs.push({ ...pad, rank: recs.length + 1 });
    }
  }
  recs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  return {
    ...parsed,
    topRecommendations: recs,
    alternativePaths:
      parsed.alternativePaths.length > 0
        ? parsed.alternativePaths
        : fb.alternativePaths,
    nextSteps:
      parsed.nextSteps.length > 0 ? parsed.nextSteps : fb.nextSteps,
    reasoning: parsed.reasoning?.trim() || fb.reasoning,
    bestCountryForYou:
      parsed.bestCountryForYou?.trim() || fb.bestCountryForYou,
    bestFieldForYou: parsed.bestFieldForYou?.trim() || fb.bestFieldForYou,
  };
}

/** C-003: Career navigator JSON — Gemini `explore` (DISCOVER) key. */
async function callGeminiNavigatorJson(input: CareerNavigatorPostBody): Promise<
  | { ok: true; text: string }
  | { ok: false }
> {
  const res = await generateGeminiText({
    module: "career-navigator",
    systemInstruction: CAREER_NAVIGATOR_JSON_SYSTEM,
    userText: JSON.stringify(input),
    maxOutputTokens: 4096,
    responseMimeType: "application/json",
    temperature: 0.25,
    signal: AbortSignal.timeout(110_000),
  });
  if (!res.ok) {
    console.warn("[career-navigator] Gemini error", res.error);
    return { ok: false };
  }
  return { ok: true, text: res.text };
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

  const rate = await apiRateLimiters.ai(appUser.id);
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

  const parsedBody = careerNavigatorPostBodySchema.safeParse(json);
  if (!parsedBody.success) {
    return new Response(parsedBody.error.message, { status: 400 });
  }

  const body = parsedBody.data;

  const gemini = await callGeminiNavigatorJson(body);

  if (!gemini.ok) {
    const data = normalizeToFive(buildCareerNavigatorFallback(body), body);
    return NextResponse.json({
      ...data,
      _meta: { source: "fallback" as const },
    });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(stripJsonFence(gemini.text));
  } catch {
    const data = normalizeToFive(buildCareerNavigatorFallback(body), body);
    return NextResponse.json({
      ...data,
      _meta: { source: "fallback" as const },
    });
  }

  const validated = careerNavigatorResponseSchema.safeParse(raw);
  if (!validated.success) {
    const data = normalizeToFive(buildCareerNavigatorFallback(body), body);
    return NextResponse.json({
      ...data,
      _meta: { source: "fallback" as const },
    });
  }

  const data = normalizeToFive(validated.data, body);
  return NextResponse.json({
    ...data,
    _meta: { source: "gemini" as const },
  });
}
