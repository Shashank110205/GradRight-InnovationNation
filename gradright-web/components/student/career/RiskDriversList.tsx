import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import type { RiskDriver } from "@/lib/types";
import { driverUserSummary } from "@/lib/gradscore/driver-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DirectionIcon({ direction }: { direction: RiskDriver["direction"] }) {
  if (direction === "positive") {
    return (
      <ArrowUpRight className="size-5 text-emerald-600 dark:text-emerald-400" />
    );
  }
  if (direction === "negative") {
    return (
      <ArrowDownRight className="size-5 text-rose-600 dark:text-rose-400" />
    );
  }
  return <Minus className="size-5 text-muted-foreground" />;
}

export function RiskDriversList({ drivers }: { drivers: RiskDriver[] }) {
  const top = drivers.slice(0, 3);

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">What&apos;s shaping your outlook</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
        {top.map((d) => (
          <div
            key={`${d.factor}-${d.explanation.slice(0, 24)}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {d.factor}
              </p>
              <DirectionIcon direction={d.direction} />
            </div>
            <p className="text-sm font-medium leading-snug text-foreground">
              {driverUserSummary(d)}
            </p>
            <details className="group text-xs text-muted-foreground">
              <summary className="cursor-pointer list-none font-medium text-brand-primary underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
                How we calculated this
              </summary>
              <p className="mt-2 leading-relaxed">{d.explanation}</p>
            </details>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
