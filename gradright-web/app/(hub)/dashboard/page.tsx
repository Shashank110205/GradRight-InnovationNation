import { redirect } from "next/navigation";

import { DashboardPageClient } from "@/app/(hub)/dashboard/DashboardPageClient";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";

export default async function DashboardPage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }
  return <DashboardPageClient />;
}
