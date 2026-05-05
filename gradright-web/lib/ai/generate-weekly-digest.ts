import { generateGeminiText } from "@/lib/ai/gemini-text-client";
import { WEEKLY_DIGEST_PROMPT } from "@/lib/ai/prompts/digest";
import { z } from "zod";

const DigestItemSchema = z.object({
  type: z.enum(["news", "deadline", "tip", "platform_nudge", "market_update"]),
  title: z.string(),
  body: z.string(),
  cta_text: z.string().nullable(),
  cta_url: z.string().nullable(),
});

const WeeklyDigestSchema = z.object({
  subject_line: z.string(),
  greeting: z.string(),
  items: z.array(DigestItemSchema).length(5),
});

export type WeeklyDigestPayload = z.infer<typeof WeeklyDigestSchema>;

function stripJsonFence(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\n?/i, "").replace(/\n?```\s*$/i, "");
  }
  return t.trim();
}

/** C-003: Weekly digest JSON — Gemini `dashboard` key. */
export async function generateWeeklyDigestJson(userContextJson: string): Promise<
  | {
      ok: true;
      digest: WeeklyDigestPayload;
    }
  | {
      ok: false;
      error: string;
    }
> {
  const res = await generateGeminiText({
    module: "weekly-digest",
    systemInstruction: WEEKLY_DIGEST_PROMPT.trim(),
    userText: userContextJson,
    maxOutputTokens: 2000,
    responseMimeType: "application/json",
    temperature: 0.4,
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(res.text));
  } catch {
    return { ok: false, error: "Invalid JSON from model" };
  }
  const parsed = WeeklyDigestSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  return { ok: true, digest: parsed.data };
}
