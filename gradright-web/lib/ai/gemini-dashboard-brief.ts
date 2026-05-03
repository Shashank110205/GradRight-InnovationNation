import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import type { StudentProfile } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseTargetCountries } from "@/lib/types";

import { resolveGeminiApiKey } from "@/lib/ai/resolve-gemini-api-key";

export type DashboardBrief = {
  headline: string;
  subline: string;
  focusAreas: string[];
};

const SYSTEM = `You are GradRight's product copywriter. Write concise, encouraging dashboard copy for Indian students planning graduate study abroad.
Rules:
- Tone: warm, confident, not hype; no guarantees about admissions, salaries, or loans.
- Reference their actual destinations, field, and degree when provided.
- Output ONLY valid JSON, no markdown, with keys: headline (max 12 words), subline (max 28 words), focusAreas (array of 3-4 short strings, action-oriented).
- Align with GradRight themes: journey planning, career risk awareness, financing literacy.`;

function templateBrief(input: {
  profile: StudentProfile | null;
  risk: LatestRiskScoreSummary | null;
}): DashboardBrief {
  const countries = parseTargetCountries(
    String(input.profile?.target_country ?? "")
  );
  const dest =
    countries.length > 1
      ? countries.slice(0, 2).join(" & ")
      : countries[0] ?? "your destinations";
  const field = input.profile?.broad_field ?? "your field";
  const degree = input.profile?.degree_type ?? "your program";

  const risk = input.risk?.risk_label ?? "medium";
  const low = input.risk?.salary_band_low_lpa ?? 8;
  const high = input.risk?.salary_band_high_lpa ?? 18;

  return {
    headline: `Your ${field} path toward ${dest}`,
    subline: `You’re tracking a ${degree} with early salary context around ₹${low}–₹${high} LPA — we’ll help you tighten the story lenders and employers care about.`,
    focusAreas: [
      risk === "high"
        ? "Prioritize 1–2 proof points (internships, tests, projects) in the next 90 days"
        : "Lock a realistic shortlist mix: reach, match, and safer targets",
      input.profile?.loan_needed
        ? "Map loan comfort vs. expected EMI at low and high salary outcomes"
        : "Keep a financing backup plan even if you’re self-funded for now",
      "Sync milestones to your intake so deadlines don’t stack awkwardly",
    ],
  };
}

function parseBriefJson(text: string): DashboardBrief | null {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  try {
    const o = JSON.parse(cleaned) as Record<string, unknown>;
    const headline = String(o.headline ?? "").trim();
    const subline = String(o.subline ?? "").trim();
    const raw = o.focusAreas;
    const focusAreas = Array.isArray(raw)
      ? raw.map((x) => String(x).trim()).filter(Boolean)
      : [];
    if (!headline || !subline || focusAreas.length === 0) return null;
    return { headline, subline, focusAreas: focusAreas.slice(0, 6) };
  } catch {
    return null;
  }
}

export async function generateDashboardBrief(input: {
  profile: StudentProfile | null;
  risk: LatestRiskScoreSummary | null;
  firstName: string | null;
}): Promise<{ brief: DashboardBrief; source: "gemini" | "template" }> {
  const fallback = templateBrief(input);

  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    return { brief: fallback, source: "template" };
  }

  const modelId =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  const userBlob = {
    first_name: input.firstName,
    profile: input.profile
      ? {
          target_country: input.profile.target_country,
          target_countries: parseTargetCountries(
            String(input.profile.target_country ?? "")
          ),
          degree_type: input.profile.degree_type,
          broad_field: input.profile.broad_field,
          target_intake: input.profile.target_intake,
          budget_band_usd: input.profile.budget_band_usd,
          loan_needed: input.profile.loan_needed,
        }
      : null,
    risk: input.risk
      ? {
          risk_label: input.risk.risk_label,
          placement_prob_6m: input.risk.placement_prob_6m,
          salary_band_low_lpa: input.risk.salary_band_low_lpa,
          salary_band_high_lpa: input.risk.salary_band_high_lpa,
          ai_summary: input.risk.ai_summary,
        }
      : null,
  };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: SYSTEM,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: JSON.stringify(userBlob) }],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 400,
      },
    });

    const text = result.response.text()?.trim();
    if (!text) {
      return { brief: fallback, source: "template" };
    }

    const parsed = parseBriefJson(text);
    if (!parsed) {
      return { brief: fallback, source: "template" };
    }

    return { brief: parsed, source: "gemini" };
  } catch (e) {
    console.warn("[generateDashboardBrief]", e);
    return { brief: fallback, source: "template" };
  }
}
