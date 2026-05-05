"use client";

import Link from "next/link";

import { Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_COPY =
  "Improve your profile to unlock more accurate results — predictions and recommendations sharpen as we learn your goals.";

type PrimaryActionBannerProps = {
  /** Main line (e.g. encouragement or completeness hint). */
  message?: string;
  /** Secondary line under the title. */
  detail?: string;
  href?: string;
  buttonLabel?: string;
  className?: string;
};

export function PrimaryActionBanner({
  message = DEFAULT_COPY,
  detail,
  href = "/dashboard/score-upgrade",
  buttonLabel = "Improve My Profile",
  className,
}: PrimaryActionBannerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-primary/25 bg-gradient-to-r from-brand-primary/10 via-card to-brand-secondary/10 p-4 shadow-sm md:p-5",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-primary/15 text-brand-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-foreground">{message}</p>
            {detail ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
            ) : null}
          </div>
        </div>
        <Link
          href={href}
          prefetch
          className={cn(
            buttonVariants({ size: "default" }),
            "shrink-0 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 text-white shadow-md hover:opacity-95"
          )}
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
