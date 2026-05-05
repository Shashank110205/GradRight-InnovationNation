import { redirect } from "next/navigation";

import { ExploreFeatureClient } from "@/app/(hub)/explore/ExploreFeatureClient";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";

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

  return <ExploreFeatureClient />;
}
