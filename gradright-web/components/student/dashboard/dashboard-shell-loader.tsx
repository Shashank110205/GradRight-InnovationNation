"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const DashboardShell = dynamic(
  () =>
    import("@/components/student/dashboard/dashboard-shell").then(
      (m) => m.DashboardShell
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace…
      </div>
    ),
  }
);

export function DashboardShellLoader(
  props: ComponentProps<typeof DashboardShell>
) {
  return <DashboardShell {...props} />;
}
