import { createServerClient } from "@/lib/db/supabase";
import {
  getStudentProfileByUserId,
  patchStudentProfileResumeExtraction,
} from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { mergeProfileCompletenessIntoMetadata } from "@/lib/profile/calculate-profile-completeness";
import { applyProfileHubPatch } from "@/lib/profile/user-profile-hub";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const projectEl = z
  .object({
    title: z.string().max(400).optional(),
    description: z.string().max(4000).optional(),
  })
  .passthrough()
  .transform((o) => ({
    title: (typeof o.title === "string" && o.title.trim() ? o.title.trim() : "Project").slice(
      0,
      400
    ),
    description:
      typeof o.description === "string" && o.description.trim()
        ? o.description.trim().slice(0, 4000)
        : undefined,
  }));

const internshipEl = z
  .object({
    org: z.string().max(400).optional(),
    role: z.string().max(400).optional(),
    duration: z.string().max(200).optional(),
  })
  .passthrough()
  .transform((o) => ({
    org: (typeof o.org === "string" && o.org.trim() ? o.org.trim() : "Organization").slice(0, 400),
    role:
      typeof o.role === "string" && o.role.trim() ? o.role.trim().slice(0, 400) : undefined,
    duration:
      typeof o.duration === "string" && o.duration.trim()
        ? o.duration.trim().slice(0, 200)
        : undefined,
  }));

const bodySchema = z.object({
  resume_storage_path: z.string().min(8).max(500),
  skills: z.array(z.string().max(160)).max(100),
  projects: z.array(projectEl).max(50),
  internships: z.array(internshipEl).max(40),
  estimated_total_experience_years: z.number().min(0).max(50).nullable().optional(),
});

function assertOwnResumePath(userId: string, storagePath: string): boolean {
  const prefix = `profile-resumes/${userId}/`;
  return storagePath.startsWith(prefix) && !storagePath.includes("..");
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

  const rate = await enforceAiChatRateLimit(appUser.id);
  if (!rate.allowed) {
    return NextResponse.json(apiError("Too many requests — try again shortly."), {
      status: 429,
    });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(apiError("Invalid body"), { status: 400 });
  }

  const body = parsed.data;
  const path = body.resume_storage_path.trim();
  if (!assertOwnResumePath(appUser.id, path)) {
    return NextResponse.json(apiError("Invalid resume path"), { status: 400 });
  }

  const existing = await getStudentProfileByUserId(appUser.id);
  if (!existing) {
    return NextResponse.json(apiError("Student profile not found"), { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const est = body.estimated_total_experience_years ?? null;
  const experienceYears =
    est != null && Number.isFinite(est)
      ? Math.round(est)
      : existing.experience_years != null
        ? existing.experience_years
        : null;

  const prevJson = { ...(existing.parsed_resume_json ?? {}) };
  const bump =
    body.skills.length > 0 || body.projects.length > 0 || body.internships.length > 0 ? 6 : 0;
  const nextScore = Math.min(
    100,
    Math.max(existing.profile_completeness_score ?? 0, 22) + bump
  );

  const parsedResumeJson: Record<string, unknown> = {
    ...prevJson,
    gemini_chat_extraction: {
      skills: body.skills,
      projects: body.projects,
      internships: body.internships,
      estimated_total_experience_years: est,
      saved_at: nowIso,
    },
  };

  try {
    const updated = await patchStudentProfileResumeExtraction(appUser.id, {
      resume_file_url: path,
      parsed_resume_json: parsedResumeJson,
      extracted_skills: body.skills,
      extracted_projects: body.projects as unknown[],
      extracted_internships: body.internships as unknown[],
      experience_years: experienceYears,
      profile_completeness_score: nextScore,
      enrichment_status: "partial",
      last_enriched_at: nowIso,
    });

    const prevMeta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const patched = applyProfileHubPatch(prevMeta, {
      resume_gemini: {
        saved_at: nowIso,
        resume_storage_path: path,
        skills: body.skills,
        projects: body.projects as unknown[],
        internships: body.internships as unknown[],
        estimated_total_experience_years: est ?? null,
      },
    });
    const nextMeta = mergeProfileCompletenessIntoMetadata(patched);
    const { error: hubErr } = await supabase.auth.updateUser({ data: nextMeta });
    if (hubErr) {
      console.error("[profile-chat-extraction-save] profile_hub", hubErr);
    }

    return NextResponse.json(
      apiSuccess({
        profile: updated,
        profile_completeness_score: nextScore,
        profile_hub_synced: !hubErr,
      })
    );
  } catch (e) {
    console.error("[profile-chat-extraction-save]", e);
    return NextResponse.json(apiError("Could not save extraction."), { status: 500 });
  }
}
