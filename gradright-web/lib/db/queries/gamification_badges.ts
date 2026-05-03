import { db } from "@/lib/db/client";
import { gamification_rewards } from "@/lib/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export type BadgeRow = {
  badge: string;
  action: string;
  created_at: string;
};

export async function getUserBadgeHistory(userId: string): Promise<BadgeRow[]> {
  const rows = await db
    .select({
      badge: gamification_rewards.badge_unlocked,
      action: gamification_rewards.action,
      created_at: gamification_rewards.created_at,
    })
    .from(gamification_rewards)
    .where(
      and(
        eq(gamification_rewards.user_id, userId),
        isNotNull(gamification_rewards.badge_unlocked)
      )
    )
    .orderBy(desc(gamification_rewards.created_at));

  return rows.map((r) => ({
    badge: r.badge as string,
    action: r.action,
    created_at: r.created_at,
  }));
}

/** Distinct badge titles, newest first (for gallery). */
export async function getUserBadgesDistinct(userId: string): Promise<string[]> {
  const history = await getUserBadgeHistory(userId);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of history) {
    if (!seen.has(h.badge)) {
      seen.add(h.badge);
      out.push(h.badge);
    }
  }
  return out;
}
