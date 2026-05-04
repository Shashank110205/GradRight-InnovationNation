import { appendProfileNotesBlock } from "@/lib/db/queries/student_profiles";
import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  preferred_universities: z.string().max(4000).optional(),
  budget_notes: z.string().max(2000).optional(),
  certifications: z.string().max(2000).optional(),
  resume_notes: z.string().max(4000).optional(),
  target_geography: z.string().max(1000).optional(),
});

/** MVP: accepts enrichment payload; durable storage can be wired in Step 2+. */
export async function POST(request: Request): Promise<NextResponse> {
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

  const d = parsed.data;
  const parts: string[] = [];
  if (d.preferred_universities?.trim()) {
    parts.push(`Preferred universities / programs:\n${d.preferred_universities.trim()}`);
  }
  if (d.budget_notes?.trim()) {
    parts.push(`Budget & funding intent:\n${d.budget_notes.trim()}`);
  }
  if (d.certifications?.trim()) {
    parts.push(`Certifications:\n${d.certifications.trim()}`);
  }
  if (d.resume_notes?.trim()) {
    parts.push(`Resume highlights:\n${d.resume_notes.trim()}`);
  }
  if (d.target_geography?.trim()) {
    parts.push(`Target geography nuance:\n${d.target_geography.trim()}`);
  }

  if (parts.length) {
    await appendProfileNotesBlock(appUser.id, parts.join("\n\n"));
  }

  return NextResponse.json(apiSuccess({ saved: true }));
}
