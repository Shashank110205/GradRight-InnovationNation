import { db } from "@/lib/db/client";
import { gamification_rewards, user_events } from "@/lib/db/schema";

export async function logUserEvent(
  userId: string,
  eventType: string,
  eventData?: Record<string, unknown> | null
): Promise<void> {
  const now = new Date().toISOString();
  await db.insert(user_events).values({
    user_id: userId,
    event_type: eventType,
    event_data: eventData ?? null,
    updated_at: now,
  });
}

export async function recordGamificationReward(
  userId: string,
  action: string,
  xpEarned: number
): Promise<void> {
  const now = new Date().toISOString();
  await db.insert(gamification_rewards).values({
    user_id: userId,
    action,
    xp_earned: xpEarned,
    updated_at: now,
  });
}
