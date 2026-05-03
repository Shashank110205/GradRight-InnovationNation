import { fetchRiskEngineEligibility, LOAN_ELIGIBILITY_DISCLAIMER } from "@/lib/finance/eligibility-engine";
import { createServerClient } from "@/lib/db/supabase";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { ensureUserFromAuth } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import type { LoanEligibilityApiPayload } from "@/lib/types";
import { LoanEligibilityPostSchema } from "@/lib/validations/loan-eligibility";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = LoanEligibilityPostSchema.safeParse(json ?? {});
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

  const risk = await getLatestRiskScoreByUserId(appUser.id);
  if (!risk) {
    return NextResponse.json(
      apiError("Run your career assessment first so we can use your salary outlook."),
      { status: 400 }
    );
  }

  const body = parsed.data;
  const estimate = await fetchRiskEngineEligibility({
    loan_amount_requested: body.loan_amount_requested,
    salary_band_low_lpa: risk.salary_band_low_lpa,
    salary_band_high_lpa: risk.salary_band_high_lpa,
    family_income_annual: body.family_income,
    collateral_available: body.collateral_available,
  });

  const payload: LoanEligibilityApiPayload = {
    ...estimate,
    disclaimer: LOAN_ELIGIBILITY_DISCLAIMER,
  };

  return NextResponse.json(apiSuccess(payload));
}
