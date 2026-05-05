import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiApiKey } from "@/lib/ai/env";
import { logGeminiError, logGeminiRequest } from "@/lib/ai/gemini-forensic-log";

/**
 * Default Gemini model for `generateContent` / Vercel AI SDK.
 * `gemini-2.0-flash` returns 404 for new API keys; use a current Flash-tier model.
 * Override with env `GEMINI_MODEL` (e.g. `gemini-3-flash-preview`).
 */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiModelId(): string {
  const raw = process.env.GEMINI_MODEL;
  if (raw === undefined) return DEFAULT_GEMINI_MODEL;
  const v = raw.trim().replace(/\r/g, "").replace(/\uFEFF/g, "");
  return v.length > 0 ? v : DEFAULT_GEMINI_MODEL;
}

const DEFAULT_TIMEOUT_MS = 55_000;

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GenerateGeminiParams = {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  responseMimeType?: "application/json" | "text/plain";
  timeoutMs?: number;
  /** Forensic / logging label */
  module?: string;
};

function logLabel(optsModule?: string, fallback = "generateGemini"): string {
  return optsModule ?? fallback;
}

function abortSignalForTimeout(ms: number, label: string): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error(`${label}: timeout after ${ms}ms`)), ms);
  return ac.signal;
}

/**
 * Single-key Gemini text/JSON generation (`getGeminiModelId()`). No fallback to other keys.
 */
export async function generateGemini(
  opts: GenerateGeminiParams
): Promise<{ ok: true; text: string } | { ok: false; reason: string; cause?: unknown }> {
  const apiKey = getGeminiApiKey();
  const label = logLabel(opts.module);
  if (!apiKey) {
    return { ok: false, reason: "key_missing" };
  }

  const maxTokens = opts.maxTokens ?? 8192;
  const temperature = opts.temperature ?? 0.35;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  logGeminiRequest(label, apiKey, opts.prompt.length + (opts.systemInstruction?.length ?? 0));

  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType?: string;
  } = { temperature, maxOutputTokens: maxTokens };
  if (opts.responseMimeType) {
    generationConfig.responseMimeType = opts.responseMimeType;
  }

  const model = genAI.getGenerativeModel({
    model: getGeminiModelId(),
    systemInstruction: opts.systemInstruction,
    generationConfig,
  });

  try {
    const result = await model.generateContent(
      {
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
      },
      { signal: abortSignalForTimeout(timeoutMs, label) }
    );
    const text = result.response.text()?.trim() ?? "";
    if (!text) {
      return { ok: false, reason: "empty_response" };
    }
    return { ok: true, text };
  } catch (e) {
    logGeminiError(label, e);
    const msg = e instanceof Error ? e.message : String(e);
    const reason = /timeout|aborted/i.test(msg) ? "timeout" : "api_error";
    return { ok: false, reason, cause: e };
  }
}

/**
 * Multimodal Gemini (e.g. PDF inline) → JSON or text. Same key and model.
 */
export async function generateGeminiFromParts(opts: {
  parts: GeminiPart[];
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  responseMimeType?: "application/json" | "text/plain";
  timeoutMs?: number;
  module?: string;
}): Promise<{ ok: true; text: string } | { ok: false; reason: string; cause?: unknown }> {
  const apiKey = getGeminiApiKey();
  const label = logLabel(opts.module, "generateGeminiFromParts");
  if (!apiKey) {
    return { ok: false, reason: "key_missing" };
  }

  const maxTokens = opts.maxTokens ?? 8192;
  const temperature = opts.temperature ?? 0.35;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  logGeminiRequest(label, apiKey, JSON.stringify(opts.parts).length);

  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType?: string;
  } = { temperature, maxOutputTokens: maxTokens };
  if (opts.responseMimeType) {
    generationConfig.responseMimeType = opts.responseMimeType;
  }

  const model = genAI.getGenerativeModel({
    model: getGeminiModelId(),
    systemInstruction: opts.systemInstruction,
    generationConfig,
  });

  try {
    const result = await model.generateContent(
      {
        contents: [{ role: "user", parts: opts.parts }],
      },
      { signal: abortSignalForTimeout(timeoutMs, label) }
    );
    const text = result.response.text()?.trim() ?? "";
    if (!text) {
      return { ok: false, reason: "empty_response" };
    }
    return { ok: true, text };
  } catch (e) {
    logGeminiError(label, e);
    const msg = e instanceof Error ? e.message : String(e);
    const reason = /timeout|aborted/i.test(msg) ? "timeout" : "api_error";
    return { ok: false, reason, cause: e };
  }
}
