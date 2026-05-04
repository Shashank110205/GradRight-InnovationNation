import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type ModelMessage } from "ai";

import type { GeminiEngineId } from "@/lib/ai/env";
import { getGeminiApiKeyForEngine } from "@/lib/ai/env";
import type { UserProfileContext } from "@/lib/types";

function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

function getGoogleProvider(engine: GeminiEngineId = "dashboard") {
  const apiKey = getGeminiApiKeyForEngine(engine);
  if (!apiKey) {
    return null;
  }
  return createGoogleGenerativeAI({ apiKey });
}

/**
 * Multi-turn mentor chat via Gemini (Vercel AI SDK streamText).
 * Route handlers should use `result.toUIMessageStreamResponse()` for useChat.
 */
export function streamMentorConversation(
  systemPrompt: string,
  messages: ModelMessage[],
  options?: { engine?: GeminiEngineId }
) {
  const engine = options?.engine ?? "dashboard";
  const google = getGoogleProvider(engine);
  if (!google) {
    throw new Error(
      "Gemini API key is not set for this engine (set per-engine GEMINI_*_API_KEY or legacy GEMINI_API_KEY)"
    );
  }

  return streamText({
    model: google(getGeminiModelId()),
    system: systemPrompt,
    messages,
  });
}

/**
 * FEATURE_SPECS shape: streamChatResponse(userMessage, systemPrompt, userProfile): ReadableStream
 * System prompt should already include personalization (e.g. MENTOR_SYSTEM_PROMPT).
 */
export function streamChatResponse(
  userMessage: string,
  systemPrompt: string,
  _userProfile: UserProfileContext
): ReadableStream<Uint8Array> {
  void _userProfile;
  const result = streamMentorConversation(systemPrompt, [
    { role: "user", content: userMessage },
  ]);
  const res = result.toTextStreamResponse();
  if (!res.body) {
    throw new Error("streamChatResponse: empty response body");
  }
  return res.body;
}
