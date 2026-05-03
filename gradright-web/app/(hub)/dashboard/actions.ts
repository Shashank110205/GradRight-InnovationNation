"use server";

import { revalidatePath } from "next/cache";

import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { logUserEvent, recordGamificationReward } from "@/lib/db/queries/user_activity";
import { getCompletedWeeklyTaskIds } from "@/lib/db/queries/user_events_list";
import { updateUserXP } from "@/lib/db/queries/users";

export async function completeWeeklyTask(
  taskId: string,
  xpReward: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    return { ok: false, error: "Unauthorized" };
  }

  const done = await getCompletedWeeklyTaskIds(ctx.appUser.id);
  if (done.includes(taskId)) {
    return { ok: true };
  }

  try {
    await updateUserXP(ctx.appUser.id, xpReward);
    await logUserEvent(ctx.appUser.id, "weekly_task_completed", { taskId });
    await recordGamificationReward(ctx.appUser.id, "weekly_task", xpReward);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("[completeWeeklyTask]", e);
    return { ok: false, error: "Could not save progress" };
  }
}
