import { redirect } from "next/navigation";

import { ExploreHubClient } from "@/components/student/explore/ExploreHubClient";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";

export const metadata = {
  title: "Explore",
  description:
    "Discover feed, guides, and awareness-first education for your study abroad journey.",
};

export default async function ExplorePage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const profile = await getStudentProfileByUserId(ctx.appUser.id);

  return (
    <ExploreHubClient
      countryHint={profile?.target_country ?? null}
      fieldHint={profile?.broad_field ?? null}
      scholarshipPriorityHint={profile?.scholarship_priority ?? null}
    />
  );
}
