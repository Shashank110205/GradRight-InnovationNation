import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

import { getGeminiApiKeyForEngine } from "@/lib/ai/env";
import { GRADRIGHT_AI_FALLBACK_MESSAGE } from "@/lib/ai/psychology-layer";
import type { StudentProfile } from "@/lib/types";

const resumeParseSchema = z.object({
  headline_summary: z.string().optional(),
  competitiveness_band: z
    .enum(["developing", "competitive", "strong"])
    .optional(),
  competitiveness_note: z.string().max(500).optional(),
  skills: z.array(z.string()).default([]),
  projects: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
      })
    )
    .default([]),
  internships: z
    .array(
      z.object({
        org: z.string(),
        role: z.string().optional(),
        duration: z.string().optional(),
      })
    )
    .default([]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  goal_vectors: z
    .object({
      geography_focus: z.array(z.string()).optional(),
      role_focus: z.array(z.string()).optional(),
      scholarship_weight_0_to_1: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export type ParsedResumePayload = z.infer<typeof resumeParseSchema>;

const enrichmentSchema = z.object({
  profile_completeness_score: z.number().min(0).max(100),
  enrichment_status: z.enum(["partial", "ready", "failed"]),
  parsed_resume: resumeParseSchema.optional(),
});

export type ProfileEngineEnrichment = z.infer<typeof enrichmentSchema>;

export type ProfileEngineInput = {
  existingProfile: StudentProfile | null;
  aspiration_text: string | null;
  five_year_goal: string | null;
  dream_role: string | null;
  /** Stored storage path (see resume upload API). */
  resume_file_url: string | null;
  /** Raw resume bytes for Gemini (optional). */
  resumeBuffer?: Buffer | null;
  resumeMimeType?: string | null;
  scholarship_priority: string | null;
  /** Regions / countries from conversational step (free text). */
  regions_text: string | null;
};

function modelId(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

function baselineCompleteness(profile: StudentProfile | null): number {
  let s = 0;
  if (!profile) return 0;
  if (profile.target_country?.trim()) s += 12;
  if (profile.degree_type?.trim()) s += 10;
  if (profile.broad_field?.trim()) s += 10;
  if (profile.budget_band_usd?.trim()) s += 8;
  if (profile.target_intake?.trim()) s += 6;
  if (profile.current_academic_level?.trim()) s += 6;
  s += 8;
  return Math.min(40, s);
}

/**
 * PROFILE engine: resume + aspiration parsing and structured enrichment.
 * Only the profile engine should call this for writes downstream.
 */
export async function runProfileEngine(
  input: ProfileEngineInput
): Promise<ProfileEngineEnrichment> {
  const apiKey = getGeminiApiKeyForEngine("profile");
  if (!apiKey) {
    return {
      profile_completeness_score: baselineCompleteness(input.existingProfile),
      enrichment_status: "failed",
      parsed_resume: {
        skills: [],
        projects: [],
        internships: [],
        strengths: [],
        gaps: [GRADRIGHT_AI_FALLBACK_MESSAGE],
      },
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.35,
    },
  });

  const contextBlock = [
    "Existing profile (JSON):",
    JSON.stringify(
      {
        target_country: input.existingProfile?.target_country,
        degree_type: input.existingProfile?.degree_type,
        broad_field: input.existingProfile?.broad_field,
        budget_band_usd: input.existingProfile?.budget_band_usd,
      },
      null,
      0
    ),
    "Student aspiration text:",
    input.aspiration_text ?? "",
    "Five-year goal:",
    input.five_year_goal ?? "",
    "Dream role:",
    input.dream_role ?? "",
    "Career priority (one of prestige|salary|scholarship|affordability|fastest_placement or free text):",
    input.scholarship_priority ?? "",
    "Regions / countries of interest (free text):",
    input.regions_text ?? "",
  ].join("\n");

  const instruction = `You are GradRight Profile Intelligence — identity + growth architect. Merge resume content (if any) with the student's stated aspirations.
Psychology: never shame; frame gaps as "growth unlocks" and limits as "current limitations"; competitiveness notes must be realistic but reassuring (no doom).
Return ONLY valid JSON matching this shape:
{
  "profile_completeness_score": number (0-100, holistic),
  "enrichment_status": "partial" | "ready" | "failed",
  "parsed_resume": {
    "headline_summary": string (optional),
    "skills": string[],
    "projects": { "title": string, "description"?: string }[],
    "internships": { "org": string, "role"?: string, "duration"?: string }[],
    "strengths": string[],
    "gaps": string[],
    "competitiveness_band"?: "developing" | "competitive" | "strong",
    "competitiveness_note"?: string,
    "goal_vectors": { "geography_focus"?: string[], "role_focus"?: string[], "scholarship_weight_0_to_1"?: number }
  }
}
Rules:
- If resume text is missing or unusable, still infer what you can from aspirations; set enrichment_status "partial" when inference is thin.
- profile_completeness_score should rise meaningfully when skills/projects exist and aspirations are concrete.
- Never invent employers or schools not implied by the inputs; prefer empty arrays over hallucination.
- scholarship_weight_0_to_1 should reflect how much the student prioritizes scholarships (from priority + text).
- competitiveness_band + competitiveness_note: honest, non-alarmist estimate vs typical applicants for stated degree/field (no admission guarantees).
- "gaps" array items should read like constructive growth unlocks, not attacks.`;

  try {
    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [
      {
        text: `Attached resume (if any) plus the following context.\n\n${instruction}\n\n${contextBlock}`,
      },
    ];

    if (
      input.resumeBuffer &&
      input.resumeBuffer.length > 0 &&
      input.resumeMimeType
    ) {
      parts.push({
        inlineData: {
          mimeType: input.resumeMimeType,
          data: input.resumeBuffer.toString("base64"),
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });
    const text = result.response.text();
    const raw = JSON.parse(text) as unknown;
    const parsed = enrichmentSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }
    const base = baselineCompleteness(input.existingProfile);
    const mergedScore = Math.max(
      base,
      Math.round(parsed.data.profile_completeness_score)
    );
    return {
      ...parsed.data,
      profile_completeness_score: Math.min(100, mergedScore),
    };
  } catch (e) {
    console.error("[runProfileEngine]", e);
    return {
      profile_completeness_score: Math.max(
        baselineCompleteness(input.existingProfile),
        45
      ),
      enrichment_status: "failed",
      parsed_resume: {
        skills: [],
        projects: [],
        internships: [],
        strengths: [],
        gaps: [GRADRIGHT_AI_FALLBACK_MESSAGE],
      },
    };
  }
}

export function mergeTargetCountry(
  existing: string | null,
  regionsText: string | null
): string | null {
  const next = regionsText?.trim();
  if (!next) return existing?.trim() || null;
  return next;
}
