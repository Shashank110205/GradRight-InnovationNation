import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type ModelMessage } from "ai";

import { resolveGeminiApiKey } from "@/lib/ai/resolve-gemini-api-key";
import type { UserProfileContext } from "@/lib/types";

function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

function getGoogleProvider() {
  const apiKey = resolveGeminiApiKey();
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
  messages: ModelMessage[]
) {
  const google = getGoogleProvider();
  if (!google) {
    throw new Error(
      "Gemini API key is not set (GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GOOGLE_API_KEY)"
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
