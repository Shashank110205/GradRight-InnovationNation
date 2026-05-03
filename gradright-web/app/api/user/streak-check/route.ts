import {
  applyDailyStreakCheck,
  getUserBySupabaseUID,
} from "@/lib/db/queries/users";
import { createServerClient } from "@/lib/db/supabase";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
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

    const result = await applyDailyStreakCheck(appUser.id);

    return NextResponse.json(
      apiSuccess({
        streak_days: result.streak_days,
        xp_awarded: result.xp_awarded,
        badge_unlocked: result.badge_unlocked,
      })
    );
  } catch (e) {
    console.error("[POST /api/user/streak-check]", e);
    return NextResponse.json(
      apiError(
        e instanceof Error ? e.message : "Could not update streak"
      ),
      { status: 500 }
    );
  }
}
