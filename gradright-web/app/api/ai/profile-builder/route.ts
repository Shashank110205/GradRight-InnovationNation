import { getGeminiApiKey } from "@/lib/ai/env";
import { safeGenerate } from "@/lib/ai/orchestrator";
import { extractPdfText } from "@/lib/profile/extract-pdf-text";
import {
  coerceUnknownToJsonObject,
  mergeProfileIntelligence,
  normalizeGoalsIntelligence,
  normalizeProfileIntelligence,
  normalizeResumeIntelligence,
  validateProfileIntelligenceForSave,
} from "@/lib/profile/normalize-profile-intelligence";
import type {
  ProfileIntelligence,
  ProfileIntelligenceResume,
} from "@/lib/profile/profile-intelligence-types";
import { createServerClient } from "@/lib/db/supabase";
import { mergeProfileCompletenessIntoMetadata } from "@/lib/profile/calculate-profile-completeness";
import { scheduleEnsureGroundedProfileContext } from "@/lib/profile/schedule-grounded-context";
import { applyProfileHubPatch } from "@/lib/profile/user-profile-hub";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_BYTES = 6 * 1024 * 1024;

const RESUME_SYSTEM = `You are a strict JSON generator.

Extract ONLY the following fields:

cgpa: number
internships: string[]
projects: string[]
research_papers: string[]
skills: string[]
extracurricular: {
  leadership: string[]
  public_service: string[]
  sports: string[]
  achievements: string[]
  hackathons: string[]
}

Return ONLY valid JSON.
NO explanation.
NO text outside JSON.

If unknown, return empty array or 0.`;

const ENRICHMENT_SYSTEM = `You are a strict JSON generator.

Extract ONLY:
five_year_goal: string
target_role: string
domain: string
clarity: "high" | "medium" | "low"

Return ONLY valid JSON.
NO explanation.
NO text outside JSON.

Infer clarity from how specific and actionable the answers are: high = concrete roles/places; medium = directional but fuzzy; low = vague or generic.`;

const enrichmentBodySchema = z.object({
  mode: z.literal("enrichment"),
  five_year_goal: z.string().max(8000),
  target_role: z.string().max(4000),
  domain: z.string().max(2000),
});

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function resumeHasExtractedSignal(r: ProfileIntelligenceResume): boolean {
  if (r.cgpa > 0) return true;
  if (
    r.internships.length +
      r.projects.length +
      r.research_papers.length +
      r.skills.length >
    0
  ) {
    return true;
  }
  const e = r.extracurricular;
  return (
    e.leadership.length +
      e.public_service.length +
      e.sports.length +
      e.achievements.length +
      e.hackathons.length >
    0
  );
}

function buildUserMetadataWithProfileIntelligence(
  prevMeta: Record<string, unknown>,
  mergedPi: ProfileIntelligence
): Record<string, unknown> {
  const prevPiRaw = prevMeta.profile_intelligence;
  const prevPi = isRecord(prevPiRaw) ? prevPiRaw : {};
  return {
    ...prevMeta,
    profile_intelligence: {
      ...prevPi,
      resume: mergedPi.resume,
      goals: mergedPi.goals,
    },
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role === "nbfc_supervisor") {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  if (!appUser.onboarding_complete) {
    return NextResponse.json(apiError("Complete onboarding first"), { status: 400 });
  }

  if (!getGeminiApiKey()) {
    return NextResponse.json(apiError("AI not configured (GEMINI_API_KEY)"), { status: 503 });
  }

  const rate = await enforceAiChatRateLimit(appUser.id);
  if (!rate.allowed) {
    return NextResponse.json(apiError("Too many requests — try again shortly."), {
      status: 429,
    });
  }

  const contentType = request.headers.get("content-type") ?? "";

  const prevMeta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const prevPi = prevMeta.profile_intelligence;

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(apiError("Invalid form data"), { status: 400 });
    }

    const mode = String(form.get("mode") ?? "");
    if (mode !== "resume") {
      return NextResponse.json(apiError("Invalid mode"), { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(apiError("Missing PDF file"), { status: 400 });
    }

    if (!file.size || file.type !== "application/pdf") {
      return NextResponse.json(apiError("Expected application/pdf"), { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(apiError("File too large"), { status: 400 });
    }

    const text = await extractPdfText(buf);
    if (text.length < 40) {
      return NextResponse.json(
        apiError("Could not extract enough text from this PDF"),
        { status: 400 }
      );
    }

    const userPrompt = `Resume text:\n"""${text.slice(0, 48_000)}"""`;

    const ai = await safeGenerate({
      module: "profile-builder:resume",
      systemInstruction: RESUME_SYSTEM,
      userPrompt,
      expectJson: true,
      maxTokens: 4096,
      temperature: 0.1,
    });

    let parsed: Record<string, unknown> = {};
    try {
      parsed = coerceUnknownToJsonObject(ai.ok ? ai.data : {});
    } catch {
      parsed = {};
    }

    const resumeNorm = normalizeResumeIntelligence(parsed);
    if (!ai.ok || !resumeHasExtractedSignal(resumeNorm)) {
      const unchanged = validateProfileIntelligenceForSave(
        mergeProfileIntelligence(prevPi, {})
      );
      return NextResponse.json(
        apiSuccess({
          saved: false,
          source: "fallback",
          profile_intelligence: unchanged,
        })
      );
    }

    const merged = mergeProfileIntelligence(prevPi, {
      resume: resumeNorm,
    });
    const normalized = normalizeProfileIntelligence(merged);
    const validated = validateProfileIntelligenceForSave(normalized);

    const baseMeta = buildUserMetadataWithProfileIntelligence(prevMeta, validated);
    const patched = applyProfileHubPatch(baseMeta, {
      goals_snapshot: validated.goals,
      resume_snapshot: validated.resume,
    });
    const nextMeta = mergeProfileCompletenessIntoMetadata(patched);

    const { error: upErr } = await supabase.auth.updateUser({ data: nextMeta });
    if (upErr) {
      console.error("[profile-builder] updateUser", upErr);
      return NextResponse.json(apiError("Failed to save profile metadata"), {
        status: 500,
      });
    }

    scheduleEnsureGroundedProfileContext(supabase, nextMeta);

    return NextResponse.json(
      apiSuccess({
        saved: true,
        source: ai.source,
        profile_intelligence: validated,
      })
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsedBody = enrichmentBodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(apiError("Invalid body"), { status: 400 });
  }

  const { five_year_goal, target_role, domain } = parsedBody.data;
  const fg = five_year_goal.trim();
  const tr = target_role.trim();
  const dm = domain.trim();

  const userPrompt = `Where do you see yourself in 5 years?
"""${fg}"""

What is your target role?
"""${tr}"""

Which domain interests you most?
"""${dm}"""`;

  const ai = await safeGenerate({
    module: "profile-builder:enrichment",
    systemInstruction: ENRICHMENT_SYSTEM,
    userPrompt,
    expectJson: true,
    maxTokens: 1024,
    temperature: 0.15,
  });

  let parsed: Record<string, unknown> = {};
  try {
    parsed = coerceUnknownToJsonObject(ai.ok ? ai.data : {});
  } catch {
    parsed = {};
  }

  const combined = normalizeProfileIntelligence({
    ...parsed,
    five_year_goal: fg,
    target_role: tr,
    domain: dm,
  });

  const merged = mergeProfileIntelligence(prevPi, {
    goals: combined.goals,
  });
  const normalized = normalizeProfileIntelligence(merged);
  const validated = validateProfileIntelligenceForSave(normalized);

  const baseMeta = buildUserMetadataWithProfileIntelligence(prevMeta, validated);
  const patched = applyProfileHubPatch(baseMeta, {
    goals_snapshot: validated.goals,
    resume_snapshot: validated.resume,
  });
  const nextMeta = mergeProfileCompletenessIntoMetadata(patched);

  const { error: upErr } = await supabase.auth.updateUser({ data: nextMeta });
  if (upErr) {
    console.error("[profile-builder] updateUser", upErr);
    return NextResponse.json(apiError("Failed to save profile metadata"), {
      status: 500,
    });
  }

  scheduleEnsureGroundedProfileContext(supabase, nextMeta);

  return NextResponse.json(
    apiSuccess({
      saved: true,
      source: ai.ok ? ai.source : "fallback",
      profile_intelligence: validated,
    })
  );
}
