import { mergeTargetCountry, runProfileEngine } from "@/lib/ai/profile-engine";
import { createServerClient, createServiceRoleSupabaseClient } from "@/lib/db/supabase";
import {
  applyProfileIntelligenceEnrichment,
  getStudentProfileByUserId,
} from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const BUCKET = "loan-documents";

const bodySchema = z.object({
  aspiration_text: z.string().max(12000).optional().nullable(),
  five_year_goal: z.string().max(8000).optional().nullable(),
  dream_role: z.string().max(4000).optional().nullable(),
  regions_text: z.string().max(4000).optional().nullable(),
  scholarship_priority: z.string().max(120).optional().nullable(),
  resume_storage_path: z.string().max(500).optional().nullable(),
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

  let resumeBuffer: Buffer | null = null;
  let resumeMime: string | null = null;
  const resumePath =
    body.resume_storage_path?.trim() || existing.resume_file_url?.trim() || null;

  const downloadPath =
    body.resume_storage_path?.trim() ||
    (resumePath && assertOwnResumePath(appUser.id, resumePath)
      ? resumePath
      : null);

  if (downloadPath) {
    try {
      const admin = createServiceRoleSupabaseClient();
      const { data, error } = await admin.storage
        .from(BUCKET)
        .download(downloadPath);
      if (!error && data) {
        const buf = Buffer.from(await data.arrayBuffer());
        const maxBytes = 6 * 1024 * 1024;
        if (buf.length <= maxBytes) {
          resumeBuffer = buf;
          resumeMime = mimeFromPath(downloadPath);
        }
      }
    } catch (e) {
      console.warn("[profile-enrich] resume download skipped", e);
    }
  }

  const engine = await runProfileEngine({
    existingProfile: existing,
    aspiration_text: body.aspiration_text?.trim() || null,
    five_year_goal: body.five_year_goal?.trim() || null,
    dream_role: body.dream_role?.trim() || null,
    resume_file_url: resumePath,
    resumeBuffer,
    resumeMimeType: resumeMime,
    scholarship_priority: body.scholarship_priority?.trim() || null,
    regions_text: body.regions_text?.trim() || null,
  });

  const pr = engine.parsed_resume;
  const mergedCountry = mergeTargetCountry(
    existing.target_country,
    body.regions_text ?? null
  );

  const parsedResumeJson: Record<string, unknown> = {
    profile_engine: pr ?? {},
    enrichment_status: engine.enrichment_status,
    score: engine.profile_completeness_score,
  };

  const nowIso = new Date().toISOString();
  const updated = await applyProfileIntelligenceEnrichment(appUser.id, {
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
    profile_completeness_score: engine.profile_completeness_score,
    enrichment_status: engine.enrichment_status,
    last_enriched_at: nowIso,
  });

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
