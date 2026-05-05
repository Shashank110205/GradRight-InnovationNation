"use client";

import {
  ChevronDown,
  Compass,
  LayoutDashboard,
  Map,
  Menu,
  PanelLeft,
  PanelLeftClose,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AppUserMenu } from "@/components/shared/AppUserMenu";
import { DashboardNavDataProvider } from "@/components/student/dashboard/DashboardNavDataContext";
import {
  HUB_MOBILE_PRIMARY,
  HUB_SIDEBAR_SECTIONS,
  hubSectionIsActive,
  type HubSidebarSection,
} from "@/lib/dashboard/module-registry";
import { cn } from "@/lib/utils";

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

const SIDEBAR_ICONS = {
  layout: LayoutDashboard,
  compass: Compass,
  map: Map,
  wallet: Wallet,
  users: UsersRound,
} as const;

/** AI SDK chat must not run in the Node/webpack SSR path (breaks dev `__webpack_require__`). */
const ChatbotToggleLazy = dynamic(
  () =>
    import("@/components/shared/ChatbotToggle").then((m) => ({
      default: m.ChatbotToggle,
    })),
  { ssr: false }
);

function SidebarSectionBlock({
  section,
  pathname,
  collapsed,
  onNavigate,
  sectionOpen,
  toggleSection,
}: {
  section: HubSidebarSection;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
  sectionOpen: Record<string, boolean>;
  toggleSection: (id: string) => void;
}) {
  const Icon = SIDEBAR_ICONS[section.icon];
  const active = hubSectionIsActive(section, pathname);
  const hasChildren = section.children.length > 0;
  const open = sectionOpen[section.id] ?? false;

  if (section.id === "home") {
    const homeActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    return (
      <Link
        href="/dashboard"
        prefetch
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
          homeActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          collapsed && "justify-center px-0"
        )}
        title={collapsed ? section.label : undefined}
      >
        <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
        {!collapsed ? <span>{section.label}</span> : null}
      </Link>
    );
  }

  return (
    <div className="space-y-0.5">
      <div
        className={cn(
          "flex items-stretch rounded-lg",
          active && "bg-sidebar-accent/40"
        )}
      >
        <Link
          href={section.href}
          prefetch
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-l-lg px-2 py-2 text-sm font-medium transition-colors",
            active
              ? "text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            collapsed && "justify-center rounded-lg px-0"
          )}
          title={collapsed ? section.label : section.title}
        >
          <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
          {!collapsed ? (
            <span className="min-w-0 truncate">{section.label}</span>
          ) : null}
        </Link>
        {!collapsed && hasChildren ? (
          <button
            type="button"
            className={cn(
              "flex w-9 shrink-0 items-center justify-center rounded-r-lg text-sidebar-foreground/70 transition hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              open && "bg-sidebar-accent/30"
            )}
            aria-expanded={open}
            aria-label={open ? `Collapse ${section.label} links` : `Expand ${section.label} links`}
            onClick={(e) => {
              e.preventDefault();
              toggleSection(section.id);
            }}
          >
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      {!collapsed && hasChildren && open ? (
        <ul className="ml-2 space-y-0.5 border-l border-sidebar-border/60 py-1 pl-2">
          {section.children.map((c) => {
            const base = c.href.split("#")[0] ?? c.href;
            const childActive =
              pathname === base || pathname.startsWith(`${base}/`);
            return (
              <li key={`${section.id}:${c.href}:${c.label}`}>
                <Link
                  href={c.href}
                  prefetch
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    childActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

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
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({});
  const streakRunRef = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSectionOpen((prev) => {
        const next = { ...prev };
        for (const s of HUB_SIDEBAR_SECTIONS) {
          if (s.id === "home" || s.children.length === 0) continue;
          if (hubSectionIsActive(s, pathname)) next[s.id] = true;
        }
        return next;
      });
    });
  }, [pathname]);

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

  function toggleSection(id: string) {
    setSectionOpen((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <DashboardNavDataProvider>
    <div className="flex min-h-screen bg-background">
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
              prefetch
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

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2" aria-label="Workspace">
          {HUB_SIDEBAR_SECTIONS.map((section) => (
            <SidebarSectionBlock
              key={section.id}
              section={section}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
              sectionOpen={sectionOpen}
              toggleSection={toggleSection}
            />
          ))}
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
            <Link
              href="/connect#community"
              prefetch
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm transition hover:bg-muted active:scale-95"
              aria-label="Community and peer groups"
              title="Community"
            >
              <UsersRound className="size-4" aria-hidden />
            </Link>
            <AppUserMenu displayName={headerName} email={headerEmail} compact />
          </div>
        </header>

        <main className="flex-1 p-4 pb-32 md:p-6 md:pb-24">{children}</main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md md:hidden"
        aria-label="Primary"
      >
        {HUB_MOBILE_PRIMARY.map((item) => {
          const Icon = SIDEBAR_ICONS[item.icon];
          const section = HUB_SIDEBAR_SECTIONS.find((s) => s.id === item.id)!;
          const active = hubSectionIsActive(section, pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                active ? "text-brand-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
              <span className="truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <ChatbotToggleLazy appUserId={appUserId} />
    </div>
    </DashboardNavDataProvider>
  );
}
