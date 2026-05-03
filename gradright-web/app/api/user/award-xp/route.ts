import { awardGamificationOnce } from "@/lib/db/queries/gamification_rewards";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { createServerClient } from "@/lib/db/supabase";
import {
  gamificationActionSchema,
  getRewardForAction,
  isStreakMilestoneAction,
} from "@/lib/gamification/xp-taxonomy";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  action: gamificationActionSchema,
});

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON"), { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(apiError("Invalid body"), { status: 400 });
  }

  const { action } = parsed.data;
  if (isStreakMilestoneAction(action)) {
    return NextResponse.json(apiError("Action not allowed"), { status: 403 });
  }

  try {
    const appUser = await getUserBySupabaseUID(authUser.id);
    if (!appUser) {
      return NextResponse.json(apiError("User not found"), { status: 404 });
    }

    const { xp, badge } = getRewardForAction(action);
    const result = await awardGamificationOnce({
      userId: appUser.id,
      action,
      xpEarned: xp,
      badgeUnlocked: badge,
    });

    return NextResponse.json(
      apiSuccess({
        new_xp_total: result.new_xp_total,
        badge_unlocked: result.awarded ? result.badge_unlocked : null,
      })
    );
  } catch (e) {
    console.error("[POST /api/user/award-xp]", e);
    return NextResponse.json(
      apiError(e instanceof Error ? e.message : "Could not award XP"),
      { status: 500 }
    );
  }
}
