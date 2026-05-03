import { redirect } from "next/navigation";

import { DashboardShellLoader } from "@/components/student/dashboard/dashboard-shell-loader";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  if (ctx.appUser.role === "nbfc_supervisor") {
    redirect("/sign-in");
  }

  if (!ctx.appUser.onboarding_complete) {
    redirect("/onboarding");
  }
  if (!ctx.appUser.wow_completed) {
    redirect("/onboarding?stage=wow");
  }

  const displayName =
    ctx.appUser.full_name?.trim() ||
    ctx.authUser.email?.split("@")[0] ||
    "Student";

  return (
    <DashboardShellLoader
      headerName={displayName}
      headerEmail={ctx.authUser.email ?? ""}
      xpPoints={ctx.appUser.xp_points}
      streakDays={ctx.appUser.streak_days}
      appUserId={ctx.appUser.id}
    >
      {children}
    </DashboardShellLoader>
  );
}
