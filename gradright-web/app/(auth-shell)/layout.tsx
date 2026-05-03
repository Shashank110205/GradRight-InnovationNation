import Link from "next/link";

import { isNbfcPortalInstance } from "@/lib/portal-mode";

export default function AuthShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isNbfcPortalInstance()) {
    return (
      <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-300/20 via-transparent to-transparent dark:from-slate-600/10" />
        <header className="relative mb-8 flex flex-col items-center gap-1 text-center">
          <Link
            href="/"
            className="font-heading text-2xl font-bold tracking-tight text-slate-900 transition-opacity hover:opacity-90 dark:text-slate-50"
          >
            GradRight Insights
          </Link>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Poonawalla Fincorp · partner console
          </p>
        </header>
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-50/90 via-background to-violet-50/50 px-4 py-12 dark:from-indigo-950/40 dark:via-background dark:to-violet-950/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-radial-hero opacity-70" />
      <header className="relative mb-8 flex flex-col items-center gap-1">
        <Link
          href="/"
          className="font-heading text-2xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <span className="text-gradient">GradRight</span>
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Your grad path — score, finance, and clarity
        </p>
      </header>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
