"use client";

import { CheckCircle2, Circle, FileText, ListChecks } from "lucide-react";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { cn } from "@/lib/utils";

type ChecklistData = {
  tasks?: Array<{ id?: string; label?: string; done?: boolean }>;
  gaps_from_decision_engine?: string[];
};

export default function ApplicationGuidePage() {
  const { data, loading, error, refetch } = useFeatureApi<ChecklistData>("checklist");
  const tasks = data?.tasks ?? [];
  const doneCount = tasks.filter((t) => Boolean(t.done)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Application Guide</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A profile-aware checklist from your Profile Hub so you always know what is done and what
          to prioritize next.
        </p>
      </div>

      {loading && !data ? (
        <GlassCard className="p-6 text-sm text-muted-foreground">Loading your checklist…</GlassCard>
      ) : null}

      {error ? (
        <GlassCard className="space-y-3 border-destructive/40 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-lg")}
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </GlassCard>
      ) : null}

      {!loading && !error ? (
        <>
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="size-4 text-primary" />
                Checklist progress
              </p>
              <p className="text-sm text-muted-foreground">
                {doneCount}/{tasks.length} completed
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id ?? task.label}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted/35"
                >
                  {task.done ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" />
                  )}
                  <span>{task.label ?? "Task"}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-primary" />
              What to improve next
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(data?.gaps_from_decision_engine ?? []).slice(0, 8).map((gap, idx) => (
                <li
                  key={`${gap}-${idx}`}
                  className="rounded-lg border border-border/60 px-3 py-2 transition-colors hover:bg-muted/20"
                >
                  {gap}
                </li>
              ))}
            </ul>
          </GlassCard>
        </>
      ) : null}
    </div>
  );
}

