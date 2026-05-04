"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import type { MockNewsItem } from "@/lib/ai/risk-engine/data/mock-news";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewsFeedTile({
  items,
  caption,
}: {
  items?: MockNewsItem[] | null;
  /** Profile-aware hint under the title (dashboard engine + student_profiles). */
  caption?: string | null;
}) {
  const list = items ?? [];
  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">News for you</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {caption?.trim() ? caption : "Curated headlines (MVP)"}
      </p>
      <ul className="mt-4 flex flex-1 flex-col gap-3">
        {list.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border/80 bg-muted/30 p-3 text-sm"
          >
            <span className="inline-block rounded-md bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {item.source}
            </span>
            <p className="mt-2 font-medium leading-snug text-foreground">{item.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
            {item.why_matters ? (
              <p className="mt-2 text-xs leading-relaxed text-foreground/90">
                <span className="font-semibold text-foreground">Why it matters: </span>
                {item.why_matters}
              </p>
            ) : null}
            {item.why_for_you ? (
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                <span className="font-semibold text-brand-primary">For you: </span>
                {item.why_for_you}
              </p>
            ) : null}
            {item.recommended_action ? (
              <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                Next: {item.recommended_action}
              </p>
            ) : null}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
            >
              Read more
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border/60 pt-4">
        <Link
          href="/explore"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-center rounded-xl text-xs font-semibold"
          )}
        >
          Open full Discover feed
        </Link>
      </div>
    </section>
  );
}
