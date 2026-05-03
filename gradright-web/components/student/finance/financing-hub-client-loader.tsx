"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const FinancingHubClient = dynamic(
  () =>
    import("@/components/student/finance/FinancingHubClient").then(
      (m) => m.FinancingHubClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
        Loading financing tools…
      </div>
    ),
  }
);

export function FinancingHubClientLoader(
  props: ComponentProps<typeof FinancingHubClient>
) {
  return <FinancingHubClient {...props} />;
}
