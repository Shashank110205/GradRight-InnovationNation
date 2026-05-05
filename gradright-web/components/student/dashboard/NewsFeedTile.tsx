"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import type { DashboardNewsFeedItem } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewsFeedTile({
  items,
  caption,
}: {
  items?: DashboardNewsFeedItem[] | null;
  /** Profile-aware hint under the title. */
  caption?: string | null;
}) {
  const list = items ?? [];
  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">News for you</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {caption?.trim()
          ? caption
          : "Filtered from our reference policy and education feeds — ranked to your destinations and field."}
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
            {item.relevance_tag ? (
              <span className="ml-2 inline-block rounded-md bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                {item.relevance_tag}
              </span>
            ) : null}
            <p className="mt-2 font-medium leading-snug text-foreground">{item.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
            >
              Read source
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border/60 pt-4">
        <Link
          href="/explore"
          prefetch
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
