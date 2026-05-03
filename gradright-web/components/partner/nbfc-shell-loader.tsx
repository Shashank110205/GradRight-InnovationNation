"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const NbfcShell = dynamic(
  () => import("@/components/partner/NbfcShell").then((m) => m.NbfcShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-400">
        Loading partner console…
      </div>
    ),
  }
);

export function NbfcShellLoader(props: ComponentProps<typeof NbfcShell>) {
  return <NbfcShell {...props} />;
}
