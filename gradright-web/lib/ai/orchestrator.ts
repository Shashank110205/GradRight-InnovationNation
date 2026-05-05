import { generateGemini } from "@/lib/ai/providers/gemini";

export type AiModule = string;

export type SafeGenerateInput = {
  module: AiModule;
  /** User-facing / primary instruction body */
  userPrompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  /** When true, request JSON from Gemini and parse */
  expectJson?: boolean;
};

export type SafeGenerateOk = {
  ok: true;
  /** Parsed JSON when expectJson; otherwise string trimmed */
  data: unknown;
  source: "gemini";
};

export type SafeGenerateFallback = {
  ok: false;
  data: Record<string, unknown>;
  source: "fallback";
  detail?: string;
};

export type SafeGenerateResult = SafeGenerateOk | SafeGenerateFallback;

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function tryParseJson(text: string): unknown | null {
  const cleaned = stripJsonFence(text);
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    return null;
  }
}

const EMPTY_FALLBACK: Record<string, unknown> = {};

/**
 * Central AI entry: Gemini only (`GEMINI_API_KEY`). Never throws.
 */
export async function safeGenerate(input: SafeGenerateInput): Promise<SafeGenerateResult> {
  const sys = input.systemInstruction?.trim();
  const sysForJson = input.expectJson
    ? [
        sys,
        "You must respond with a single valid JSON object only. No markdown fences, no commentary.",
      ]
        .filter(Boolean)
        .join("\n\n")
    : sys;

  const user = input.expectJson
    ? `${input.userPrompt}\n\nReturn only minified JSON.`
    : input.userPrompt;

  const gm = await generateGemini({
    module: input.module,
    systemInstruction: sysForJson,
    prompt: user,
    maxTokens: input.maxTokens,
    temperature: input.temperature,
    responseMimeType: input.expectJson ? "application/json" : "text/plain",
  });

  if (gm.ok) {
    if (input.expectJson) {
      const parsed = tryParseJson(gm.text);
      if (parsed !== null) {
        return { ok: true, data: parsed, source: "gemini" };
      }
      return {
        ok: false,
        data: EMPTY_FALLBACK,
        source: "fallback",
        detail: "gemini_invalid_json",
      };
    }
    return { ok: true, data: gm.text, source: "gemini" };
  }

  return {
    ok: false,
    data: EMPTY_FALLBACK,
    source: "fallback",
    detail: `gemini:${gm.reason}`,
  };
}
