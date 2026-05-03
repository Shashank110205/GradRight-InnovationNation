// Document Checklist API — see application-timeline for the real timeline.

import { generateLoanDocumentChecklist } from "@/lib/ai/generate-loan-doc-checklist";
import { createServerClient } from "@/lib/db/supabase";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { ensureUserFromAuth } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

/** Module 8 — personalized document checklist (AI-assisted). */
export async function POST(): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await ensureUserFromAuth({
    id: authUser.id,
    email: authUser.email,
    user_metadata: authUser.user_metadata as { full_name?: string },
  });

  const [profile, risk] = await Promise.all([
    getStudentProfileByUserId(appUser.id),
    getLatestRiskScoreByUserId(appUser.id),
  ]);

  const { items, source } = await generateLoanDocumentChecklist({
    profile,
    risk,
  });

  return NextResponse.json(
    apiSuccess({ items, source, kind: "loan_document_checklist" as const })
  );
}
