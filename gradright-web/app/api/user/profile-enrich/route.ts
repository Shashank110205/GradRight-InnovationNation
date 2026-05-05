import { mergeTargetCountry, runProfileEngine } from "@/lib/ai/profile-engine";
import { createServerClient, createServiceRoleSupabaseClient } from "@/lib/db/supabase";
import {
  applyProfileIntelligenceEnrichment,
  getStudentProfileByUserId,
  patchStudentProfileResumeExtraction,
  type ProfileIntelligencePatch,
} from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const BUCKET = "loan-documents";

const bodySchema = z.object({
  parse_only: z.boolean().optional(),
  aspiration_text: z.string().max(12000).optional().nullable(),
  five_year_goal: z.string().max(8000).optional().nullable(),
  dream_role: z.string().max(4000).optional().nullable(),
  regions_text: z.string().max(4000).optional().nullable(),
  scholarship_priority: z.string().max(120).optional().nullable(),
  resume_storage_path: z.string().max(500).optional().nullable(),
  broad_field: z.string().max(200).optional().nullable(),
  risk_appetite: z.string().max(80).optional().nullable(),
  career_path_clarity: z.string().max(80).optional().nullable(),
  funding_value_focus: z.enum(["affordability", "prestige", "balanced"]).optional().nullable(),
  experience_years: z.number().int().min(0).max(60).optional().nullable(),
});

function mimeFromPath(p: string): string {
  const lower = p.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
  return "application/octet-stream";
}

function assertOwnResumePath(userId: string, storagePath: string): boolean {
  const prefix = `profile-resumes/${userId}/`;
  return storagePath.startsWith(prefix) && !storagePath.includes("..");
}

async function downloadResumeBuffer(
  userId: string,
  downloadPath: string | null
): Promise<{ buf: Buffer | null; mime: string | null }> {
  if (!downloadPath || !assertOwnResumePath(userId, downloadPath)) {
    return { buf: null, mime: null };
  }
  try {
    const admin = createServiceRoleSupabaseClient();
    const { data, error } = await admin.storage.from(BUCKET).download(downloadPath);
    if (error || !data) return { buf: null, mime: null };
    const buf = Buffer.from(await data.arrayBuffer());
    const maxBytes = 6 * 1024 * 1024;
    if (buf.length > maxBytes) return { buf: null, mime: null };
    return { buf, mime: mimeFromPath(downloadPath) };
  } catch (e) {
    console.warn("[profile-enrich] resume download skipped", e);
    return { buf: null, mime: null };
  }
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
  if (
    body.resume_storage_path &&
    !assertOwnResumePath(appUser.id, body.resume_storage_path)
  ) {
    return NextResponse.json(apiError("Invalid resume path"), { status: 400 });
  }

  const existing = await getStudentProfileByUserId(appUser.id);
  if (!existing) {
    return NextResponse.json(apiError("Student profile not found"), { status: 400 });
  }

  const resumePath =
    body.resume_storage_path?.trim() || existing.resume_file_url?.trim() || null;

  const downloadPath =
    body.resume_storage_path?.trim() ||
    (resumePath && assertOwnResumePath(appUser.id, resumePath) ? resumePath : null);

  const { buf: resumeBuffer, mime: resumeMime } = await downloadResumeBuffer(
    appUser.id,
    downloadPath
  );

  const engine = await runProfileEngine({
    existingProfile: existing,
    aspiration_text: body.aspiration_text?.trim() ?? existing.aspiration_text,
    five_year_goal: body.five_year_goal?.trim() ?? existing.five_year_goal,
    dream_role: body.dream_role?.trim() ?? existing.dream_role,
    resume_file_url: resumePath,
    resumeBuffer,
    resumeMimeType: resumeMime,
    scholarship_priority:
      body.scholarship_priority?.trim() ?? existing.scholarship_priority,
    regions_text: body.regions_text?.trim() ?? null,
  });

  const pr = engine.parsed_resume;

  const certifications = pr?.certifications ?? [];
  const extractedCertifications = certifications as unknown[];
  const certCount = Math.max(
    existing.certification_count ?? 0,
    certifications.length
  );

  let resumeCgpa: string | null = null;
  let resumeCgpaScale: string | null = null;
  if (pr?.cgpa != null && Number.isFinite(pr.cgpa)) {
    resumeCgpa = String(pr.cgpa);
    resumeCgpaScale =
      pr.cgpa_scale != null && Number.isFinite(pr.cgpa_scale)
        ? String(pr.cgpa_scale)
        : "10";
  }
  const resumeInstituteName = pr?.degree_institution?.trim() || null;

  const mergedCountry = mergeTargetCountry(
    existing.target_country,
    body.regions_text ?? null
  );

  const parsedResumeJson: Record<string, unknown> = {
    ...(existing.parsed_resume_json ?? {}),
    profile_engine: pr ?? {},
    enrichment_status: engine.enrichment_status,
    score: engine.profile_completeness_score,
  };

  const nowIso = new Date().toISOString();

  const experienceYears =
    pr?.estimated_total_experience_years ??
    body.experience_years ??
    existing.experience_years ??
    null;

  if (body.parse_only) {
    const updated = await patchStudentProfileResumeExtraction(appUser.id, {
      resume_file_url: resumePath,
      parsed_resume_json: parsedResumeJson,
      extracted_skills: pr?.skills ?? [],
      extracted_projects: pr?.projects ?? [],
      extracted_internships: pr?.internships ?? [],
      extracted_certifications: extractedCertifications,
      experience_years: experienceYears,
      profile_completeness_score: engine.profile_completeness_score,
      enrichment_status: engine.enrichment_status,
      last_enriched_at: nowIso,
      cgpa: resumeCgpa,
      cgpa_scale: resumeCgpaScale ?? undefined,
      institute_name: resumeInstituteName,
      certification_count: certCount,
    });
    return NextResponse.json(
      apiSuccess({
        parse_only: true,
        profile: updated,
        parsed_resume: pr ?? null,
        engine: {
          enrichment_status: engine.enrichment_status,
          profile_completeness_score: engine.profile_completeness_score,
        },
      })
    );
  }

  const intelligencePatch: ProfileIntelligencePatch = {
    aspiration_text: body.aspiration_text?.trim() || null,
    five_year_goal: body.five_year_goal?.trim() || null,
    dream_role: body.dream_role?.trim() || null,
    scholarship_priority: body.scholarship_priority?.trim() || null,
    target_country: mergedCountry ?? existing.target_country,
    resume_file_url: resumePath,
    parsed_resume_json: parsedResumeJson,
    extracted_skills: pr?.skills ?? [],
    extracted_projects: pr?.projects ?? [],
    extracted_internships: pr?.internships ?? [],
    extracted_certifications: extractedCertifications,
    certification_count: certCount,
    profile_completeness_score: engine.profile_completeness_score,
    enrichment_status: engine.enrichment_status,
    last_enriched_at: nowIso,
    experience_years: experienceYears,
  };
  if (body.broad_field !== undefined) {
    intelligencePatch.broad_field = body.broad_field?.trim() || null;
  }
  if (body.risk_appetite !== undefined) {
    intelligencePatch.risk_appetite = body.risk_appetite?.trim() || null;
  }
  if (body.career_path_clarity !== undefined) {
    intelligencePatch.career_path_clarity = body.career_path_clarity?.trim() || null;
  }
  if (body.funding_value_focus !== undefined) {
    intelligencePatch.funding_value_focus = body.funding_value_focus;
  }
  if (resumeCgpa != null && existing.cgpa == null) {
    intelligencePatch.cgpa = resumeCgpa;
    intelligencePatch.cgpa_scale = resumeCgpaScale ?? undefined;
  }
  if (resumeInstituteName && !existing.institute_name?.trim()) {
    intelligencePatch.institute_name = resumeInstituteName;
  }

  const updated = await applyProfileIntelligenceEnrichment(
    appUser.id,
    intelligencePatch
  );

  return NextResponse.json(
    apiSuccess({
      profile: updated,
      engine: {
        enrichment_status: engine.enrichment_status,
        profile_completeness_score: engine.profile_completeness_score,
      },
    })
  );
}
