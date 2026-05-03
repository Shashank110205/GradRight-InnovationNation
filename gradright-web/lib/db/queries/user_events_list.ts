import { db } from "@/lib/db/client";
import { user_events } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type UserEventRow = {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

export async function getRecentUserEventsByUserId(
  userId: string,
  limit = 12
): Promise<UserEventRow[]> {
  const rows = await db
    .select({
      id: user_events.id,
      event_type: user_events.event_type,
      event_data: user_events.event_data,
      created_at: user_events.created_at,
    })
    .from(user_events)
    .where(eq(user_events.user_id, userId))
    .orderBy(desc(user_events.created_at))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    event_type: r.event_type,
    event_data: (r.event_data as Record<string, unknown> | null) ?? null,
    created_at: r.created_at,
  }));
}

export async function getCompletedWeeklyTaskIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ event_data: user_events.event_data })
    .from(user_events)
    .where(
      and(
        eq(user_events.user_id, userId),
        eq(user_events.event_type, "weekly_task_completed")
      )
    );

  const ids = new Set<string>();
  for (const r of rows) {
    if (r.event_data && typeof r.event_data === "object") {
      const d = r.event_data as { taskId?: string };
      if (typeof d.taskId === "string") {
        ids.add(d.taskId);
      }
    }
  }
  return [...ids];
}
