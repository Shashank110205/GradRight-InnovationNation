import Link from "next/link";

import type { NextBestAction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NextBestActionsList({ actions }: { actions: NextBestAction[] }) {
  const top = actions.slice(0, 3);

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Next best actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
        {top.map((a) => (
          <div
            key={`${a.action.slice(0, 48)}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 ring-1 ring-foreground/5"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={
                  a.impact === "high"
                    ? "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                    : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                }
              >
                {a.impact} impact
              </span>
            </div>
            <p className="text-sm leading-snug text-foreground">{a.action}</p>
            {a.resource_url ? (
              <Link
                href={a.resource_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Open resource
              </Link>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
