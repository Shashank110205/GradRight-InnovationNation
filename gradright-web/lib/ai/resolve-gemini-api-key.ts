/** Prefer GradRight name; fall back to common Google / AI Studio env names. */
export function resolveGeminiApiKey(): string | undefined {
  const k =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  return k || undefined;
}
