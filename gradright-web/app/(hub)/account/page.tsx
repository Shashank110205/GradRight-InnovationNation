import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassCard } from "@/components/shell/GlassCard";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";

export const metadata = {
  title: "My account",
  description: "Profile and account settings",
};

export default async function AccountPage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const displayName =
    ctx.appUser.full_name?.trim() ||
    ctx.authUser.email?.split("@")[0] ||
    "Student";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          My account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed-in profile for this GradRight workspace.
        </p>
      </div>

      <GlassCard className="space-y-4 p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Display name
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">{displayName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email
          </p>
          <p className="mt-1 text-sm text-foreground">{ctx.authUser.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Progress
          </p>
          <p className="mt-1 text-sm text-foreground">
            {ctx.appUser.xp_points} XP · {ctx.appUser.streak_days} day streak
          </p>
        </div>
      </GlassCard>

      <Link
        href="/dashboard"
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground sm:w-auto"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
