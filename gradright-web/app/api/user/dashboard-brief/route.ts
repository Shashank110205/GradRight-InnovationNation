import { generateDashboardBrief } from "@/lib/ai/gemini-dashboard-brief";
import { createServerClient } from "@/lib/db/supabase";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  try {
    const appUser = await getUserBySupabaseUID(authUser.id);
    if (!appUser) {
      return NextResponse.json(apiError("User not found"), { status: 404 });
    }

    const [profile, risk] = await Promise.all([
      getStudentProfileByUserId(appUser.id),
      getLatestRiskScoreByUserId(appUser.id),
    ]);

    const firstName =
      appUser.full_name?.split(/\s+/)[0]?.trim() ||
      authUser.email?.split("@")[0] ||
      null;

    const { brief, source } = await generateDashboardBrief({
      profile,
      risk,
      firstName,
    });

    return NextResponse.json(
      apiSuccess({
        brief,
        source,
        profile,
        risk,
        user: {
          full_name: appUser.full_name,
          xp_points: appUser.xp_points,
          journey_stage: appUser.journey_stage,
        },
      })
    );
  } catch (e) {
    console.error("[GET /api/user/dashboard-brief]", e);
    return NextResponse.json(
      apiError(
        e instanceof Error ? e.message : "Could not load dashboard brief"
      ),
      { status: 500 }
    );
  }
}
