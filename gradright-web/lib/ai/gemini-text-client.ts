/**
 * Shared non-streaming AI text/JSON generation via Gemini (`GEMINI_API_KEY`).
 */
import { safeGenerate } from "@/lib/ai/orchestrator";
import { logGeminiError, logGeminiRequest } from "@/lib/ai/gemini-forensic-log";
import { getGeminiApiKey } from "@/lib/ai/env";

export type GeminiTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function generateGeminiText(input: {
  /** Rate-limit / trace label */
  module: string;
  systemInstruction: string;
  userText: string;
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
  temperature?: number;
  signal?: AbortSignal;
  /** @deprecated use `module` — kept for one release of call-site compatibility */
  forensicModule?: string;
}): Promise<GeminiTextResult> {
  const moduleName = input.forensicModule ?? input.module;
  const promptLength =
    input.systemInstruction.length + input.userText.length;

  if (!getGeminiApiKey()) {
    logGeminiRequest(moduleName, undefined, promptLength);
    return { ok: false, error: "GEMINI_API_KEY is not configured" };
  }

  logGeminiRequest(moduleName, getGeminiApiKey(), promptLength);

  if (input.signal?.aborted) {
    return { ok: false, error: "Aborted" };
  }

  try {
    const res = await safeGenerate({
      module: moduleName,
      systemInstruction: input.systemInstruction,
      userPrompt: input.userText,
      maxTokens: input.maxOutputTokens ?? 2048,
      temperature: input.temperature ?? 0.35,
      expectJson: input.responseMimeType === "application/json",
    });

    if (!res.ok) {
      return {
        ok: false,
        error: res.detail ?? "AI fallback — no structured output",
      };
    }

    const text =
      typeof res.data === "string"
        ? res.data.trim()
        : JSON.stringify(res.data);
    if (!text) {
      logGeminiError(moduleName, new Error("Empty AI response"));
      return { ok: false, error: "Empty AI response" };
    }
    return { ok: true, text };
  } catch (e) {
    logGeminiError(moduleName, e);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
