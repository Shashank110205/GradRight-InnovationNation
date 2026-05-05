/**
 * Gemini generateContent with Google Search grounding (REST v1beta `google_search` tool).
 * @see https://ai.google.dev/gemini-api/docs/google-search
 */
import { getGeminiApiKey } from "@/lib/ai/env";
import { logGeminiError, logGeminiRequest } from "@/lib/ai/gemini-forensic-log";
import { getGeminiModelId } from "@/lib/ai/providers/gemini";

const DEFAULT_TIMEOUT_MS = 90_000;

type GenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: unknown;
  }>;
  error?: { message?: string; code?: number };
};

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export type GeminiGroundedResult =
  | {
      ok: true;
      text: string;
      groundingMetadata?: unknown;
    }
  | { ok: false; reason: string };

/**
 * Single Gemini call with Google Search enabled; returns model text (expect JSON in prompt).
 */
export async function generateGeminiWithGoogleSearch(opts: {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  /** Prefer JSON-shaped answers; search responses may still include prose — validate downstream. */
  responseMimeType?: "application/json" | "text/plain";
  timeoutMs?: number;
  module?: string;
}): Promise<GeminiGroundedResult> {
  const apiKey = getGeminiApiKey();
  const label = opts.module ?? "generateGeminiWithGoogleSearch";
  if (!apiKey) {
    return { ok: false, reason: "key_missing" };
  }

  const model = getGeminiModelId();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const maxTokens = opts.maxTokens ?? 8192;
  const temperature = opts.temperature ?? 1;

  logGeminiRequest(label, apiKey, opts.prompt.length + (opts.systemInstruction?.length ?? 0));

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
    },
  };

  if (opts.systemInstruction?.trim()) {
    body.systemInstruction = {
      parts: [{ text: opts.systemInstruction.trim() }],
    };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    });

    const rawJson = (await res.json()) as GenerateContentResponse;

    if (!res.ok) {
      const msg =
        rawJson.error?.message ??
        `http_${res.status}`;
      console.error(`[${label}] grounded_generate_failed`, msg);
      return { ok: false, reason: msg };
    }

    const parts = rawJson.candidates?.[0]?.content?.parts;
    const text =
      parts?.map((p) => (typeof p.text === "string" ? p.text : "")).join("") ?? "";

    const trimmed = stripJsonFence(text).trim();
    if (!trimmed) {
      return { ok: false, reason: "empty_response" };
    }

    const groundingMetadata = rawJson.candidates?.[0]?.groundingMetadata;

    return {
      ok: true,
      text: trimmed,
      groundingMetadata,
    };
  } catch (e) {
    logGeminiError(label, e);
    const msg = e instanceof Error ? e.message : String(e);
    const reason = /timeout|aborted/i.test(msg) ? "timeout" : "api_error";
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

/** Parse JSON object from grounded model output. */
export function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = stripJsonFence(text);
  try {
    const v = JSON.parse(cleaned) as unknown;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
