import { createServerClient } from "@/lib/db/supabase";
import { runCareerRiskScoreForUser } from "@/lib/services/career/risk-score.service";
import { apiError, apiSuccess } from "@/lib/types";
import { RiskScorePostBodySchema } from "@/lib/validations/risk-score-input";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsedBody = RiskScorePostBodySchema.safeParse(json ?? {});
  if (!parsedBody.success) {
    return NextResponse.json(
      apiError(
        parsedBody.error.flatten().formErrors.join("; ") || "Invalid body"
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

  try {
    const row = await runCareerRiskScoreForUser({
      authUserId: authUser.id,
      authEmail: authUser.email,
      authMetadata: authUser.user_metadata as { full_name?: string },
      body: parsedBody.data,
    });
    return NextResponse.json(apiSuccess(row));
  } catch (e) {
    if (e instanceof Error && (e as Error & { code?: string }).code === "ONBOARDING_REQUIRED") {
      return NextResponse.json(
        apiError("Complete onboarding to generate a risk score."),
        { status: 400 }
      );
    }
    console.error("[POST /api/career/risk-score]", e);
    const message =
      e instanceof Error ? e.message : "Risk score generation failed";
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
