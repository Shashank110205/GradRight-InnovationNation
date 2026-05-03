import { Check } from "lucide-react";
import Link from "next/link";

import { MODULE_ROUTES } from "@/lib/dashboard/module-registry";
import { cn } from "@/lib/utils";
import type { JourneyStage } from "@/lib/types";

const STAGES: { stage: JourneyStage; label: string }[] = [
  { stage: "discover", label: "Discover" },
  { stage: "plan", label: "Plan" },
  { stage: "finance", label: "Finance" },
  { stage: "apply", label: "Apply" },
  { stage: "succeed", label: "Succeed" },
];

function stageIndex(s: JourneyStage): number {
  return STAGES.findIndex((x) => x.stage === s);
}

export function JourneyBar({ currentStage }: { currentStage: JourneyStage }) {
  const idx = stageIndex(currentStage);

  return (
    <nav
      aria-label="Journey progress"
      className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex min-w-[520px] items-center gap-1 md:min-w-0 md:justify-between md:gap-2">
        {STAGES.map((item, i) => {
          const href = MODULE_ROUTES[item.stage];
          const isComplete = i < idx;
          const isCurrent = i === idx;

          return (
            <li key={item.stage} className="flex flex-1 items-center">
              {i > 0 ? (
                <div
                  className={cn(
                    "mx-1 hidden h-px flex-1 md:block",
                    isComplete || isCurrent ? "bg-brand-primary/50" : "bg-border"
                  )}
                  aria-hidden
                />
              ) : null}
              <Link
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors md:px-3 md:text-sm",
                  isCurrent &&
                    "bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/30",
                  !isCurrent && !isComplete && "text-muted-foreground hover:text-foreground",
                  isComplete && !isCurrent && "text-muted-foreground hover:text-brand-primary"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px] md:size-7 md:text-xs",
                    isComplete && "bg-brand-primary/20 text-brand-primary",
                    isCurrent && !isComplete && "bg-brand-primary text-white",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="size-3.5 md:size-4" aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
