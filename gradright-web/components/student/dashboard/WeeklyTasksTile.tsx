"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WeeklyTask } from "@/lib/dashboard/weekly-tasks";

import { completeWeeklyTask } from "@/app/(hub)/dashboard/actions";

function statusStyles(status: WeeklyTask["status"]) {
  switch (status) {
    case "overdue":
      return {
        bar: "bg-red-500",
        chip: "bg-red-500/15 text-red-700 dark:text-red-300",
        label: "Overdue",
      };
    case "due_soon":
      return {
        bar: "bg-amber-500",
        chip: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
        label: "Due soon",
      };
    default:
      return {
        bar: "bg-muted-foreground/40",
        chip: "bg-muted text-muted-foreground",
        label: "Upcoming",
      };
  }
}

export function WeeklyTasksTile({
  tasks,
  completedIds,
}: {
  tasks: WeeklyTask[];
  completedIds: string[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">This week</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Milestones tied to your journey</p>
      <ul className="mt-4 flex flex-1 flex-col gap-3">
        {tasks.map((task) => {
          const done = completedIds.includes(task.id);
          const st = statusStyles(task.status);
          return (
            <li
              key={task.id}
              className={cn(
                "rounded-xl border border-border/80 p-3",
                done && "opacity-60"
              )}
            >
              <div className={cn("h-1 w-full rounded-full", st.bar)} aria-hidden />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", st.chip)}>
                  {done ? "Done" : st.label}
                </span>
                <span className="text-[11px] text-muted-foreground">Due {task.dueDate}</span>
                <span className="text-[11px] text-muted-foreground">+{task.xpReward} XP</span>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug">{task.title}</p>
              <Button
                type="button"
                size="sm"
                variant={done ? "secondary" : "default"}
                disabled={done || isPending}
                className={cn("mt-3 w-full", !done && "bg-brand-primary text-white hover:bg-brand-primary/90")}
                onClick={() => {
                  setPendingId(task.id);
                  startTransition(async () => {
                    try {
                      await completeWeeklyTask(task.id, task.xpReward);
                      router.refresh();
                    } finally {
                      setPendingId(null);
                    }
                  });
                }}
              >
                {done
                  ? "Completed"
                  : pendingId === task.id && isPending
                    ? "Saving…"
                    : "Mark complete"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
