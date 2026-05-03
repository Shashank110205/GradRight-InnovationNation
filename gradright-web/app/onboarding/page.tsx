import { redirect } from "next/navigation";

import { OnboardingShell } from "@/components/student/onboarding/OnboardingShell";
import { destinationForAuthenticatedStudentAppUser } from "@/lib/auth/student-journey-destinations";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  if (ctx.appUser.role === "nbfc_supervisor") {
    redirect("/nbfc");
  }

  const dest = destinationForAuthenticatedStudentAppUser({
    role: ctx.appUser.role,
    onboarding_complete: ctx.appUser.onboarding_complete,
    wow_completed: ctx.appUser.wow_completed,
  });

  if (dest === "/dashboard") {
    redirect("/dashboard");
  }

  const { stage } = await searchParams;
  if (stage === "wow" && !ctx.appUser.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <OnboardingShell
      resumeWowOnly={ctx.appUser.onboarding_complete && !ctx.appUser.wow_completed}
    />
  );
}
