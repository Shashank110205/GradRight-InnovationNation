import { db } from "@/lib/db/client";
import { gamification_rewards, users } from "@/lib/db/schema";
import type { GamificationAction } from "@/lib/types";
import { and, eq, sql } from "drizzle-orm";

export async function userHasGamificationAction(
  userId: string,
  action: string
): Promise<boolean> {
  const rows = await db
    .select({ id: gamification_rewards.id })
    .from(gamification_rewards)
    .where(
      and(
        eq(gamification_rewards.user_id, userId),
        eq(gamification_rewards.action, action)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function insertGamificationRewardRow(input: {
  userId: string;
  action: string;
  xpEarned: number;
  badgeUnlocked: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  await db.insert(gamification_rewards).values({
    user_id: input.userId,
    action: input.action,
    xp_earned: input.xpEarned,
    badge_unlocked: input.badgeUnlocked,
    updated_at: now,
  });
}

/**
 * One row per action per user (repeat streak milestones use distinct actions over time).
 */
export async function awardGamificationOnce(input: {
  userId: string;
  action: GamificationAction;
  xpEarned: number;
  badgeUnlocked: string | null;
}): Promise<{ awarded: boolean; new_xp_total: number; badge_unlocked: string | null }> {
  return db.transaction(async (tx) => {
    const dup = await tx
      .select({ id: gamification_rewards.id })
      .from(gamification_rewards)
      .where(
        and(
          eq(gamification_rewards.user_id, input.userId),
          eq(gamification_rewards.action, input.action)
        )
      )
      .limit(1);

    const currentXp = await tx
      .select({ xp_points: users.xp_points })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    const xpRow = currentXp[0];
    if (!xpRow) {
      throw new Error(`User not found: ${input.userId}`);
    }

    if (dup.length > 0) {
      return {
        awarded: false,
        new_xp_total: xpRow.xp_points,
        badge_unlocked: null,
      };
    }

    const now = new Date().toISOString();
    await tx.insert(gamification_rewards).values({
      user_id: input.userId,
      action: input.action,
      xp_earned: input.xpEarned,
      badge_unlocked: input.badgeUnlocked,
      updated_at: now,
    });

    const updated = await tx
      .update(users)
      .set({
        xp_points: sql`${users.xp_points} + ${input.xpEarned}`,
        updated_at: now,
      })
      .where(eq(users.id, input.userId))
      .returning({ xp_points: users.xp_points });

    const row = updated[0];
    if (!row) {
      throw new Error(`User not found after update: ${input.userId}`);
    }

    return {
      awarded: true,
      new_xp_total: row.xp_points,
      badge_unlocked: input.badgeUnlocked,
    };
  });
}
