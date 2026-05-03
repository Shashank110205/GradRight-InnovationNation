import { db } from "@/lib/db/client";
import { nudge_log } from "@/lib/db/schema";

export async function insertNudgeLog(input: {
  userId: string;
  nudgeType: string;
  channel: "email" | "push" | "in_app";
  content?: string | null;
}): Promise<void> {
  await db.insert(nudge_log).values({
    user_id: input.userId,
    nudge_type: input.nudgeType,
    channel: input.channel,
    content: input.content ?? null,
  });
}
