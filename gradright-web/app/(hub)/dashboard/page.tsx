import { redirect } from "next/navigation";

import type { DashboardHomeExperienceProps } from "@/components/student/dashboard/DashboardHomeExperience";
import { DashboardHomeExperience } from "@/components/student/dashboard/DashboardHomeExperience";
import { getCachedDashboardNews } from "@/lib/dashboard/dashboard-news";
import { buildWeeklyTasks } from "@/lib/dashboard/weekly-tasks";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import {
  formatDashboardDateHeader,
  formatDashboardEventTime,
} from "@/lib/format/dashboard-dates";
import { getUserBadgesDistinct } from "@/lib/db/queries/gamification_badges";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import {
  getCompletedWeeklyTaskIds,
  getRecentUserEventsByUserId,
} from "@/lib/db/queries/user_events_list";

export default async function DashboardPage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const userId = ctx.appUser.id;

  const [profile, risk, events, completedTaskIds, badges, newsItems] = await Promise.all([
    getStudentProfileByUserId(userId),
    getLatestRiskScoreByUserId(userId),
    getRecentUserEventsByUserId(userId, 8),
    getCompletedWeeklyTaskIds(userId),
    getUserBadgesDistinct(userId),
    getCachedDashboardNews(),
  ]);

  const tasks = buildWeeklyTasks(profile, ctx.appUser.journey_stage);

  const displayName =
    ctx.appUser.full_name?.trim() || ctx.authUser.email?.split("@")[0] || "Student";

  const todayLabel = formatDashboardDateHeader(new Date());
  const eventsWithLabels = events.map((e) => ({
    ...e,
    createdAtLabel: e.created_at ? formatDashboardEventTime(e.created_at) : null,
  }));

  const homeProps = {
    displayName,
    profile,
    risk,
    journeyStage: ctx.appUser.journey_stage,
    xpPoints: ctx.appUser.xp_points,
    streakDays: ctx.appUser.streak_days,
    badges,
    tasks,
    completedTaskIds,
    events: eventsWithLabels,
    newsItems: newsItems ?? [],
    todayLabel,
  } satisfies DashboardHomeExperienceProps;

  return <DashboardHomeExperience {...homeProps} />;
}
