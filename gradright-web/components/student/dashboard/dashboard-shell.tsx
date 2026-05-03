"use client";

import {
  Compass,
  FileText,
  LayoutDashboard,
  Map,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Rocket,
  Target,
  Wallet,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STREAK_COOKIE = "gr_streak_checked_ist";

function readStreakCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${STREAK_COOKIE}=([^;]*)`)
  );
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function writeStreakCookie(istYmd: string): void {
  document.cookie = `${STREAK_COOKIE}=${encodeURIComponent(istYmd)}; path=/; max-age=86400; SameSite=Lax`;
}

function todayISTYmdClient(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

import { AppUserMenu } from "@/components/shared/AppUserMenu";
import { DASHBOARD_NAV } from "@/lib/dashboard/module-registry";
import { cn } from "@/lib/utils";

const ICONS = {
  layout: LayoutDashboard,
  target: Target,
  compass: Compass,
  map: Map,
  wallet: Wallet,
  file: FileText,
  rocket: Rocket,
} as const;

/** AI SDK chat must not run in the Node/webpack SSR path (breaks dev `__webpack_require__`). */
const ChatbotToggleLazy = dynamic(
  () =>
    import("@/components/shared/ChatbotToggle").then((m) => ({
      default: m.ChatbotToggle,
    })),
  { ssr: false }
);

export function DashboardShell({
  children,
  headerName,
  headerEmail,
  xpPoints,
  streakDays,
  appUserId,
}: {
  children: React.ReactNode;
  headerName: string;
  headerEmail: string;
  xpPoints: number;
  streakDays: number;
  appUserId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const streakRunRef = useRef(false);

  useEffect(() => {
    if (streakRunRef.current) return;
    streakRunRef.current = true;

    const today = todayISTYmdClient();
    if (readStreakCookie() === today) return;

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/user/streak-check", { method: "POST" });
          const json: unknown = await res.json();
          if (
            typeof json === "object" &&
            json !== null &&
            "success" in json &&
            (json as { success: unknown }).success === true
          ) {
            writeStreakCookie(today);
            router.refresh();
          }
        } catch {
          /* non-fatal */
        }
      })();
    }, 400);

    return () => window.clearTimeout(handle);
  }, [router]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-[width,transform] duration-200 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-[72px]" : "w-56"
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-sidebar-border px-3">
          {!collapsed ? (
            <Link
              href="/dashboard"
              className="font-heading truncate text-sm font-bold text-sidebar-foreground"
              onClick={() => setMobileOpen(false)}
            >
              GradRight
            </Link>
          ) : (
            <span className="sr-only">GradRight</span>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent md:inline-flex"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>
            <button
              type="button"
              className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Modules">
          {DASHBOARD_NAV.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={`${item.label}:${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <button
            type="button"
            className="rounded-md p-2 hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-sm font-semibold text-foreground">{headerName}</p>
            <p className="truncate text-xs text-muted-foreground">{headerEmail}</p>
          </div>
          <div className="flex min-w-0 flex-1 shrink-0 items-center justify-end gap-2 sm:min-w-0 sm:flex-none sm:justify-end">
            <span className="hidden rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary sm:inline">
              {xpPoints} XP
            </span>
            {streakDays > 0 ? (
              <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground lg:inline">
                {streakDays}d streak
              </span>
            ) : null}
            <AppUserMenu displayName={headerName} email={headerEmail} compact />
          </div>
        </header>

        <main className="flex-1 p-4 pb-28 md:p-6 md:pb-24">{children}</main>
      </div>

      <ChatbotToggleLazy appUserId={appUserId} />
    </div>
  );
}
