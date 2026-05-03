"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppUserMenu({
  displayName,
  email,
  compact,
}: {
  displayName: string;
  email: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      window.location.assign("/api/auth/sign-out");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className={cn("relative", compact && "max-w-[min(100%,14rem)]")}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-left text-sm font-medium text-foreground hover:bg-muted/70",
          "[&::-webkit-details-marker]:hidden"
        )}
        aria-label="Account menu"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-primary/15 text-xs font-bold text-brand-primary">
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className="block truncate leading-tight">{displayName}</span>
          {email ? (
            <span className="block truncate text-[11px] font-normal text-muted-foreground">
              {email}
            </span>
          ) : null}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </summary>
      <div
        className="absolute right-0 z-50 mt-1 min-w-[12rem] rounded-lg border border-border bg-popover p-1 shadow-md"
        role="menu"
      >
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
          role="menuitem"
          onClick={(e) => {
            const d = e.currentTarget.closest("details");
            if (d) d.removeAttribute("open");
          }}
        >
          <UserRound className="size-4 shrink-0" aria-hidden />
          My account
        </Link>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start gap-2 rounded-md px-3 py-2 font-normal text-destructive hover:text-destructive"
          role="menuitem"
          disabled={busy}
          onClick={() => void signOut()}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          {busy ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </details>
  );
}
