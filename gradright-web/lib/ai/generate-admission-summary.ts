import { ADMISSION_SUMMARY_SYSTEM } from "@/lib/ai/prompts/admission-summary";

const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

export async function generateAdmissionSummary(input: {
  admissionProbability: number;
  country: string;
  degree: string;
  targetCourse: string;
  primaryUniversityLabel: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  cgpa: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const pct = Math.round(input.admissionProbability);

  const fallback = `Your inputs suggest roughly ${pct}% modeled admission likelihood at your stated ${input.country} targets for ${input.targetCourse}, with ${input.keyStrengths[0] ?? "academic signals"} as the clearest positive factors. ${input.keyWeaknesses[0] ?? "Selectivity and incomplete testing remain the main risks—treat this as a planning aid, not an offer prediction."}`;

  if (!apiKey) {
    return fallback;
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  const payload = {
    admissionProbabilityPercent: pct,
    country: input.country,
    degree: input.degree,
    targetCourse: input.targetCourse,
    primaryUniversityLabel: input.primaryUniversityLabel,
    cgpa_on_10: input.cgpa,
    keyStrengths: input.keyStrengths,
    keyWeaknesses: input.keyWeaknesses,
  };

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
        max_tokens: 200,
        system: ADMISSION_SUMMARY_SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn("[generateAdmissionSummary]", await res.text());
      return fallback;
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) return fallback;
    return text.replace(/^["']|["']$/g, "").slice(0, 450);
  } catch (e) {
    console.warn("[generateAdmissionSummary]", e);
    return fallback;
  }
}
