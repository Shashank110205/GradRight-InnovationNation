"use client";

import type { HomeDashboardApiPayload } from "@/lib/types/feature-api";
import type { DashboardFeatureHomePanel } from "@/lib/types/feature-api";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { DashboardHomeExperience } from "@/components/student/dashboard/DashboardHomeExperience";

function toFeaturePanel(d: HomeDashboardApiPayload): DashboardFeatureHomePanel {
  return {
    grad_score: d.grad_score,
    top_universities: d.top_universities,
    key_actions: d.key_actions,
    short_explanation: d.short_explanation,
    explanation_source: d.explanation_source,
    profile_hub: d.profile_hub,
    profile_hub_completeness: d.profile_hub_completeness,
    scoring_meta: d.scoring_meta,
  };
}

export function DashboardPageClient() {
  const { data, loading, error, refetch } = useFeatureApi<HomeDashboardApiPayload>("home");

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm font-medium text-destructive">{error ?? "Could not load dashboard"}</p>
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const d = data;

  return (
    <DashboardHomeExperience
      displayName={d.display_name}
      navCacheUserId={d.nav_cache_user_id}
      studentIntelligence={d.student_intelligence}
      profile={d.profile}
      risk={d.risk}
      journeyStage={d.journey_stage}
      xpPoints={d.xp_points}
      streakDays={d.streak_days}
      badges={d.badges}
      tasks={d.tasks}
      completedTaskIds={d.completed_task_ids}
      events={d.events}
      newsItems={d.news_items}
      todayLabel={d.today_label}
      personalizedLines={d.personalized_lines}
      wowTrustSnapshot={d.wow_trust_snapshot}
      profileHubCompleteness={d.profile_hub_completeness}
      featureHome={toFeaturePanel(d)}
      onHomeRefresh={() => void refetch()}
    />
  );
}
