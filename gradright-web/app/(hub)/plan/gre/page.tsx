import { redirect } from "next/navigation";

import { GreFeatureClient } from "@/app/(hub)/plan/gre/GreFeatureClient";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";

export const metadata = {
  title: "GRE estimator",
  description: "Target GRE verbal / quant bands grounded in your profile and program requirements",
};

export default async function GreEstimatorPage() {
  const ctx = await getDashboardAuthContext();
  if (!ctx) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">GRE estimator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Data from <code className="text-xs">GET /api/features/gre</code> — résumé + grounded
          requirements only.
        </p>
      </div>
      <GreFeatureClient />
    </div>
  );
}
