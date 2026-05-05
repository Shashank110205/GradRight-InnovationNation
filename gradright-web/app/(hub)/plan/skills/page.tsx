"use client";

import { Brain, Sparkles, Target } from "lucide-react";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { cn } from "@/lib/utils";

type SkillRoadmapData = {
  skills_to_build?: string[];
  action_plan?: string[];
};

export default function PlanSkillsPage() {
  const { data, loading, error, refetch } = useFeatureApi<SkillRoadmapData>("skill-roadmap");
  const skills = data?.skills_to_build ?? [];
  const actions = data?.action_plan ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Skills You Need</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A practical skills roadmap generated from your profile, destination, and decision-engine
          gaps.
        </p>
      </div>

      {loading && !data ? (
        <GlassCard className="p-6 text-sm text-muted-foreground">Building your roadmap…</GlassCard>
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
        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard className="p-5 sm:p-6">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <Brain className="size-4 text-primary" />
              Priority skill stack
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.slice(0, 18).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs transition-colors hover:bg-muted/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-primary" />
              Action plan
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {actions.slice(0, 10).map((action, idx) => (
                <li key={`${action}-${idx}`}>{action}</li>
              ))}
            </ol>
          </GlassCard>
        </div>
      ) : null}

      {!loading && !error && !skills.length && !actions.length ? (
        <GlassCard className="p-5 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Complete profile details to unlock a sharper skills roadmap.
          </p>
        </GlassCard>
      ) : null}
    </div>
  );
}

