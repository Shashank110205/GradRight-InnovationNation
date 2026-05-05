"use client";

import { useMemo } from "react";

import { DashboardHomeExperience } from "@/components/student/dashboard/DashboardHomeExperience";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";

/**
 * Home dashboard — data exclusively from `GET /api/features/home` (profile_hub + scoring + shell).
 */
export function DashboardHomeClient() {
  const { data, loading, error, refetch } = useFeatureApi<Record<string, unknown>>("home");

  const featureHome = useMemo(() => {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    return {
      profile_hub: d.profile_hub,
      grad_score: Number(d.grad_score ?? 0),
      short_explanation: String(d.short_explanation ?? ""),
      explanation_source: String(d.explanation_source ?? ""),
      top_universities: Array.isArray(d.top_universities) ? d.top_universities : [],
      key_actions: Array.isArray(d.key_actions)
        ? (d.key_actions as string[])
        : [],
      meta: d.scoring_meta,
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading your command center…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-foreground">Could not load dashboard</p>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const d = data as Record<string, unknown>;

  return (
    <DashboardHomeExperience
      displayName={String(d.displayName ?? "Student")}
      navCacheUserId={String(d.navCacheUserId ?? "")}
      studentIntelligence={d.studentIntelligence as never}
      profile={d.profile as never}
      risk={d.risk as never}
      journeyStage={d.journeyStage as never}
      xpPoints={Number(d.xpPoints ?? 0)}
      streakDays={Number(d.streakDays ?? 0)}
      badges={(d.badges as string[]) ?? []}
      tasks={d.tasks as never}
      completedTaskIds={(d.completedTaskIds as string[]) ?? []}
      events={d.events as never}
      newsItems={d.newsItems as never}
      todayLabel={String(d.todayLabel ?? "")}
      personalizedLines={(d.personalizedLines as string[]) ?? []}
      wowTrustSnapshot={d.wowTrustSnapshot as never}
      profileHubCompleteness={
        typeof d.profileHubCompleteness === "number" ? d.profileHubCompleteness : null
      }
      featureHome={featureHome}
    />
  );
}
