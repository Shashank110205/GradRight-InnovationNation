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

  void parsed.data;
  return NextResponse.json(apiSuccess({ saved: true }));
}
