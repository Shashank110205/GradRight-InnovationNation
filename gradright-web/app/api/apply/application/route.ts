import {
  getLoanApplicationByUserId,
  upsertLoanApplicationStep,
} from "@/lib/db/queries/applications";
import {
  getLatestRiskScoreIdByUserId,
} from "@/lib/db/queries/risk_scores";
import { createServerClient } from "@/lib/db/supabase";
import { ensureUserFromAuth } from "@/lib/db/queries/users";
import { mergeOcrExtractedData } from "@/lib/apply/merge-loan-ocr";
import type { LoanApplication } from "@/lib/types";
import { apiError, apiSuccess } from "@/lib/types";
import { LoanApplicationPatchSchema } from "@/lib/validations/loan-application";
import { NextResponse } from "next/server";

function stripEmptyStrings(
  patch: Partial<LoanApplication>
): Partial<LoanApplication> {
  const next = { ...patch };
  if (next.pan_number === "") next.pan_number = null;
  if (next.aadhaar_last4 === "") next.aadhaar_last4 = null;
  return next;
}

export async function GET(): Promise<NextResponse> {
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

  const row = await getLoanApplicationByUserId(appUser.id);
  return NextResponse.json(apiSuccess(row));
}

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

  const existing = await getLoanApplicationByUserId(appUser.id);
  if (existing) {
    return NextResponse.json(apiSuccess(existing));
  }

  const riskId = await getLatestRiskScoreIdByUserId(appUser.id);
  const created = await upsertLoanApplicationStep(appUser.id, {
    step_completed: -1,
    risk_score_id: riskId,
  });

  return NextResponse.json(apiSuccess(created));
}

export async function PATCH(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = LoanApplicationPatchSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        parsed.error.flatten().formErrors.join("; ") || "Invalid body"
      ),
      { status: 400 }
    );
  }

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

  const existing = await getLoanApplicationByUserId(appUser.id);
  if (!existing) {
    return NextResponse.json(apiError("No draft application"), { status: 404 });
  }

  const {
    loan_program: loanProgram,
    ocr_extracted_data: ocrPatch,
    ...rest
  } = parsed.data;

  const mergedOcr = mergeOcrExtractedData(
    existing,
    ocrPatch ?? undefined,
    loanProgram as Record<string, unknown> | null | undefined
  );

  const payload = stripEmptyStrings({
    ...rest,
    ...(mergedOcr !== null ? { ocr_extracted_data: mergedOcr } : {}),
  } as Partial<LoanApplication>);

  const updated = await upsertLoanApplicationStep(appUser.id, payload);
  return NextResponse.json(apiSuccess(updated));
}
