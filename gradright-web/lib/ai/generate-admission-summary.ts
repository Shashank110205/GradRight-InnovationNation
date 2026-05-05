import { generateGeminiText } from "@/lib/ai/gemini-text-client";
import { ADMISSION_SUMMARY_SYSTEM } from "@/lib/ai/prompts/admission-summary";

/** C-003: Admission narrative — Gemini `explore` (DISCOVER) key. */
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
  const pct = Math.round(input.admissionProbability);

  const fallback = `Your inputs suggest roughly ${pct}% modeled admission likelihood at your stated ${input.country} targets for ${input.targetCourse}, with ${input.keyStrengths[0] ?? "academic signals"} as the clearest positive factors. ${input.keyWeaknesses[0] ?? "Selectivity and incomplete testing remain the main risks—treat this as a planning aid, not an offer prediction."}`;

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

  const res = await generateGeminiText({
    module: "admission-summary",
    systemInstruction: ADMISSION_SUMMARY_SYSTEM,
    userText: JSON.stringify(payload),
    maxOutputTokens: 300,
    responseMimeType: "text/plain",
    temperature: 0.4,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn("[generateAdmissionSummary]", res.error);
    return fallback;
  }

  const text = res.text.replace(/^["']|["']$/g, "").trim().slice(0, 450);
  if (!text) return fallback;
  return text;
}
