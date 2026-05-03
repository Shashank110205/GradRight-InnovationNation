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

const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

function stripJsonFence(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\n?/i, "").replace(/\n?```\s*$/i, "");
  }
  return t.trim();
}

export async function generateWeeklyDigestJson(userContextJson: string): Promise<{
  ok: true;
  digest: WeeklyDigestPayload;
} | {
  ok: false;
  error: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
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
        max_tokens: 1200,
        system: WEEKLY_DIGEST_PROMPT.trim(),
        messages: [{ role: "user", content: userContextJson }],
      }),
      signal: AbortSignal.timeout(4500),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: errText.slice(0, 500) };
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const raw = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!raw) {
      return { ok: false, error: "Empty model response" };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(stripJsonFence(raw));
    } catch {
      return { ok: false, error: "Invalid JSON from model" };
    }
    const parsed = WeeklyDigestSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.message };
    }
    return { ok: true, digest: parsed.data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Digest generation failed";
    return { ok: false, error: msg };
  }
}
