import { redirect } from "next/navigation";

import { ApplicationTimelineClient } from "@/components/student/plan/ApplicationTimelineClient";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";

export const metadata = {
  title: "Application Timeline",
  description: "Your personalised application deadline tracker.",
};

export default async function PlanTimelinePage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const profile = await getStudentProfileByUserId(ctx.appUser.id);

  return <ApplicationTimelineClient profile={profile} />;
}
