import { z } from "zod";

import { getGeminiApiKey } from "@/lib/ai/env";
import { logGeminiError, logGeminiRequest } from "@/lib/ai/gemini-forensic-log";
import { safeGeminiGenerate } from "@/lib/ai/gemini-client";
import { safeGenerate } from "@/lib/ai/orchestrator";
import { getGeminiModelId } from "@/lib/ai/providers/gemini";
import { GRADRIGHT_AI_FALLBACK_MESSAGE } from "@/lib/ai/psychology-layer";
import { extractPdfText } from "@/lib/profile/extract-pdf-text";
import {
  TARGET_COUNTRY_SEPARATOR,
  type StudentProfile,
} from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

/** C-006: Resume extraction — academic + employability artifacts for master profile + PS2 inputs. */
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
        technologies: z.array(z.string()).optional(),
      })
    )
    .default([]),
  internships: z
    .array(
      z.object({
        org: z.string(),
        role: z.string().optional(),
        duration: z.string().optional(),
        domain: z.string().optional(),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        year: z.number().int().min(1970).max(2100).optional(),
      })
    )
    .default([]),
  /** CGPA on the stated scale (omit if not clearly stated). */
  cgpa: z.number().min(0).max(100).optional(),
  cgpa_scale: z.number().min(1).max(100).optional(),
  graduation_year: z.number().int().min(1970).max(2100).optional(),
  degree_institution: z.string().max(400).optional(),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  goal_vectors: z
    .object({
      geography_focus: z.array(z.string()).optional(),
      role_focus: z.array(z.string()).optional(),
      scholarship_weight_0_to_1: z.number().min(0).max(1).optional(),
    })
    .optional(),
  /** Total paid / professional years inferred from resume (not fabricated). */
  estimated_total_experience_years: z.number().min(0).max(45).optional(),
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

function baselineCompleteness(profile: StudentProfile | null): number {
  let s = 0;
  if (!profile) return 0;
  if (profile.target_country?.trim()) s += 12;
  if (profile.degree_type?.trim()) s += 10;
  if (profile.broad_field?.trim()) s += 10;
  if (profile.budget_band_usd?.trim()) s += 8;
  if (profile.target_intake?.trim()) s += 6;
  if (profile.current_academic_level?.trim()) s += 6;
  if (
    profile?.risk_appetite &&
    profile.risk_appetite !== "medium" &&
    ["conservative", "moderate", "aggressive"].includes(profile.risk_appetite)
  ) {
    s += 3;
  }
  if (
    profile?.career_path_clarity &&
    profile.career_path_clarity !== "unknown" &&
    ["clear", "emerging", "exploring"].includes(profile.career_path_clarity)
  ) {
    s += 3;
  }
  if (
    profile?.funding_value_focus &&
    profile.funding_value_focus !== "balanced" &&
    ["affordability", "prestige"].includes(profile.funding_value_focus)
  ) {
    s += 3;
  }
  s += 8;
  return Math.min(40, s);
}

function buildInstructionAndContext(input: ProfileEngineInput): {
  instruction: string;
  contextBlock: string;
} {
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
Return ONLY valid JSON matching this shape (C-006 — extract every field the resume clearly supports):
{
  "profile_completeness_score": number (0-100, holistic),
  "enrichment_status": "partial" | "ready" | "failed",
  "parsed_resume": {
    "headline_summary": string (optional),
    "skills": string[],
    "projects": { "title": string, "description"?: string, "technologies"?: string[] }[],
    "internships": { "org": string, "role"?: string, "duration"?: string, "domain"?: string }[],
    "certifications": { "name": string, "issuer"?: string, "year"?: number }[],
    "cgpa"?: number,
    "cgpa_scale"?: number,
    "graduation_year"?: number,
    "degree_institution"?: string,
    "strengths": string[],
    "gaps": string[],
    "competitiveness_band"?: "developing" | "competitive" | "strong",
    "competitiveness_note"?: string,
    "goal_vectors": { "geography_focus"?: string[], "role_focus"?: string[], "scholarship_weight_0_to_1"?: number },
    "estimated_total_experience_years"?: number
  }
}
Rules:
- If resume text is missing or unusable, still infer what you can from aspirations; set enrichment_status "partial" when inference is thin.
- profile_completeness_score should rise meaningfully when skills/projects exist and aspirations are concrete.
- Never invent employers or schools not implied by the inputs; prefer empty arrays over hallucination.
- Extract cgpa + cgpa_scale only when explicitly stated; use typical Indian 10-point or transcript scale when obvious.
- Certifications: professional/vendor certs only (omit generic "Coursera" completions unless clearly named).
- scholarship_weight_0_to_1 should reflect how much the student prioritizes scholarships (from priority + text).
- competitiveness_band + competitiveness_note: honest, non-alarmist estimate vs typical applicants for stated degree/field (no admission guarantees).
- "gaps" array items should read like constructive growth unlocks, not attacks.
- estimated_total_experience_years: only when clearly implied by resume dates/roles; otherwise omit.`;

  return { instruction, contextBlock };
}

function failedEnrichment(
  input: ProfileEngineInput
): ProfileEngineEnrichment {
  return {
    profile_completeness_score: baselineCompleteness(input.existingProfile),
    enrichment_status: "failed",
    parsed_resume: {
      skills: [],
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      gaps: [GRADRIGHT_AI_FALLBACK_MESSAGE],
    },
  };
}

/**
 * PROFILE engine: resume + aspiration parsing and structured enrichment.
 * Gemini (`GEMINI_API_KEY`) via orchestrator; PDF text extraction + multimodal Gemini fallback.
 */
export async function runProfileEngine(
  input: ProfileEngineInput
): Promise<ProfileEngineEnrichment> {
  if (!getGeminiApiKey()) {
    return failedEnrichment(input);
  }

  const apiKey = getGeminiApiKey();
  const { instruction, contextBlock } = buildInstructionAndContext(input);

  let resumeText = "";
  if (
    input.resumeBuffer &&
    input.resumeBuffer.length > 0 &&
    input.resumeMimeType === "application/pdf"
  ) {
    resumeText = await extractPdfText(input.resumeBuffer);
  }

  const resumeSection =
    resumeText.length > 80
      ? `\n\nResume text (extracted):\n"""${resumeText.slice(0, 48_000)}"""`
      : "";

  const userPrompt = `Attached resume context plus the following.\n\n${instruction}\n\n${contextBlock}${resumeSection}`;

  const approxLen =
    userPrompt.length + (input.resumeBuffer?.length ?? 0);
  logGeminiRequest("runProfileEngine", apiKey ?? undefined, approxLen);

  const tryParse = (raw: unknown): ProfileEngineEnrichment | null => {
    const parsed = enrichmentSchema.safeParse(raw);
    if (!parsed.success) return null;
    const base = baselineCompleteness(input.existingProfile);
    const mergedScore = Math.max(
      base,
      Math.round(parsed.data.profile_completeness_score)
    );
    return {
      ...parsed.data,
      profile_completeness_score: Math.min(100, mergedScore),
    };
  };

  try {
    const orchestrated = await safeGenerate({
      module: "runProfileEngine",
      userPrompt,
      expectJson: true,
      maxTokens: 8192,
      temperature: 0.35,
    });

    if (orchestrated.ok) {
      const out = tryParse(orchestrated.data);
      if (out) return out;
    }

    if (
      input.resumeBuffer &&
      input.resumeBuffer.length > 0 &&
      input.resumeMimeType &&
      apiKey
    ) {
      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [
        {
          text: `Attached resume (binary) plus the following context.\n\n${instruction}\n\n${contextBlock}`,
        },
        {
          inlineData: {
            mimeType: input.resumeMimeType,
            data: input.resumeBuffer.toString("base64"),
          },
        },
      ];

      const mm = await safeGeminiGenerate({
        module: "runProfileEngine:multimodal",
        run: () => {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: getGeminiModelId(),
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.35,
              maxOutputTokens: 8192,
            },
          });
          return model.generateContent({
            contents: [{ role: "user", parts }],
          });
        },
      });

      const text = mm.response.text();
      const raw = JSON.parse(text) as unknown;
      const out = tryParse(raw);
      if (out) return out;
    }
  } catch (e) {
    logGeminiError("runProfileEngine", e);
    console.error("[runProfileEngine]", e);
  }

  return failedEnrichment(input);
}

export function mergeTargetCountry(
  existing: string | null,
  regionsText: string | null
): string | null {
  const next = regionsText?.trim();
  const prior = existing?.trim() ?? "";
  if (!next) return prior || null;
  if (!prior) return next;
  if (prior.includes(next) || next.includes(prior)) {
    return prior.length >= next.length ? prior : next;
  }
  return `${prior}${TARGET_COUNTRY_SEPARATOR}${next}`;
}
