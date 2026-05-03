import { NextResponse } from "next/server";

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

const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

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

async function callAnthropicJson(input: CareerNavigatorPostBody): Promise<
  | { ok: true; text: string }
  | { ok: false }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false };
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: CAREER_NAVIGATOR_JSON_SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
      signal: AbortSignal.timeout(110_000),
    });

    if (!res.ok) {
      console.warn("[career-navigator] Anthropic error", await res.text());
      return { ok: false };
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) {
      return { ok: false };
    }
    return { ok: true, text };
  } catch (e) {
    console.warn("[career-navigator]", e);
    return { ok: false };
  }
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

  const anthropic = await callAnthropicJson(body);

  if (!anthropic.ok) {
    const data = normalizeToFive(buildCareerNavigatorFallback(body), body);
    return NextResponse.json({
      ...data,
      _meta: { source: "fallback" as const },
    });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(stripJsonFence(anthropic.text));
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
    _meta: { source: "anthropic" as const },
  });
}
