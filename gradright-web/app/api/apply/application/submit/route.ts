import {
  getLoanApplicationByUserId,
  submitLoanApplication,
} from "@/lib/db/queries/applications";
import { createServerClient } from "@/lib/db/supabase";
import { ensureUserFromAuth, updateUserXP } from "@/lib/db/queries/users";
import {
  logUserEvent,
  recordGamificationReward,
} from "@/lib/db/queries/user_activity";
import { apiError, apiSuccess } from "@/lib/types";
import { LoanApplicationSubmitBodySchema } from "@/lib/validations/loan-application";
import { NextResponse } from "next/server";

function canSubmit(app: {
  status: string;
  step_completed: number;
  full_name: string | null;
  pan_number: string | null;
  address: string | null;
  institute: string | null;
  program: string | null;
  loan_amount_requested: number | null;
  family_income_annual: number | null;
}): string | null {
  if (app.status !== "draft") {
    return "Application is already submitted or closed.";
  }
  if (app.step_completed < 6) {
    return "Complete the review step before submitting.";
  }
  if (!app.full_name?.trim()) return "Full name is required.";
  if (!app.pan_number?.trim()) return "PAN is required.";
  if (!app.address?.trim()) return "Address is required.";
  if (!app.institute?.trim()) return "Institute is required.";
  if (!app.program?.trim()) return "Program is required.";
  if (app.loan_amount_requested == null || app.loan_amount_requested <= 0) {
    return "Loan amount is required.";
  }
  if (app.family_income_annual == null || app.family_income_annual <= 0) {
    return "Family income is required.";
  }
  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = LoanApplicationSubmitBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      apiError("Consent is required to submit."),
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

  const app = await getLoanApplicationByUserId(appUser.id);
  if (!app) {
    return NextResponse.json(apiError("No application found"), { status: 404 });
  }

  const block = canSubmit(app);
  if (block) {
    return NextResponse.json(apiError(block), { status: 400 });
  }

  const submitted = await submitLoanApplication(app.id);

  await logUserEvent(appUser.id, "loan_application_submitted", {
    application_id: submitted.id,
  });
  await updateUserXP(appUser.id, 75);
  await recordGamificationReward(appUser.id, "loan_application_submitted", 75);

  return NextResponse.json(apiSuccess(submitted));
}
