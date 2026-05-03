"use client";

import {
  Briefcase,
  FolderOpen,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useSupabase } from "@/components/shared/AppProviders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/nbfc/applications", label: "Applications", icon: FolderOpen },
  { href: "/nbfc/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/nbfc/settings", label: "Settings", icon: Settings },
] as const;

export function NbfcShell({
  children,
  supervisorName,
  supervisorEmail,
}: {
  children: React.ReactNode;
  supervisorName: string;
  supervisorEmail: string;
}) {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    /** Full navigation clears cookies reliably across portals. */
    window.location.assign("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 border-r border-slate-200 bg-slate-100/90 backdrop-blur-md transition-transform dark:border-slate-800 dark:bg-slate-900/95 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Poonawalla Fincorp
            </p>
            <p className="truncate font-heading text-sm font-bold text-slate-900 dark:text-slate-50">
              GradRight Insights
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-200 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(false)}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/nbfc/applications"
                ? pathname.startsWith("/nbfc/applications")
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 md:block">
          Review consented student data to qualify leads and prioritize loan outreach.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                {supervisorName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {supervisorEmail}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
            onClick={() => void logout()}
          >
            <LogOut className="size-3.5" />
            Log out
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
