import { computeScoringFromUserMetadata } from "@/lib/decision/compute-scoring";
import type { ScoringResult } from "@/lib/decision/types";
import { aggregateGapsAndActions } from "@/lib/decision/aggregate-gaps";
import { buildDashboardPersonalizedLines } from "@/lib/dashboard/personalized-insights";
import {
  formatDashboardDateHeader,
  formatDashboardEventTime,
} from "@/lib/format/dashboard-dates";
import type { DashboardNewsFeedItem } from "@/lib/data";
import { getUserBadgesDistinct } from "@/lib/db/queries/gamification_badges";
import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import {
  getCompletedWeeklyTaskIds,
  getRecentUserEventsByUserId,
  type UserEventRow,
} from "@/lib/db/queries/user_events_list";
import { explainHomeShortWithGemini } from "@/lib/features/gemini-feature-explain";
import type { StudentFeatureContext } from "@/lib/features/student-auth";
import { ensureGroundedProfileContext } from "@/lib/profile/ensure-grounded-context";
import { shimStudentProfileFromUserMetadata } from "@/lib/profile/hub-profile-shim";
import { buildProfileHubApiPayload } from "@/lib/profile/profile-hub-bundle";
import { buildStudentIntelligence } from "@/lib/profile/student-intelligence";
import { buildWowTrustSnapshot } from "@/lib/trust-layer/wow-trust-snapshot";
import { exploreSignalsReady } from "@/lib/explore/explore-wow";
import {
  getCachedUniversitiesForProfile,
} from "@/lib/dashboard/dashboard-server-cache";
import { buildWeeklyTasks } from "@/lib/dashboard/weekly-tasks";
import type { NormalizedRiskEngineResult } from "@/lib/onboarding/risk-engine-schema";

async function syncHubMeta(ctx: StudentFeatureContext): Promise<Record<string, unknown>> {
  const ensured = await ensureGroundedProfileContext(ctx.supabase, ctx.meta, {
    force: false,
  });
  return ensured.metadata;
}

function syntheticPlacementSnapshot(scorer: NormalizedRiskEngineResult): Record<string, unknown> {
  return {
    _placement_intel: {
      score_confidence: scorer.score_confidence ?? "medium",
      score_data_coverage_percentage: Math.round(scorer.score_data_coverage_percentage ?? 55),
      placement_intelligence_tier: scorer.placement_intelligence_tier ?? "live_market",
      grad_score_display_title: scorer.grad_score_display_title ?? "Your GradScore",
      intelligence_source_note:
        scorer.intelligence_source_note ?? "Python risk service output merged with profile hub.",
      score_confidence_user_message:
        scorer.score_confidence_user_message ??
        `Confidence from scorer: ${scorer.score_confidence ?? "medium"}.`,
    },
  };
}

function mergeRiskDisplay(
  dbRisk: LatestRiskScoreSummary | null,
  scoring: ScoringResult
): LatestRiskScoreSummary | null {
  const s = scoring.scorer;
  if (s) {
    return {
      risk_label: s.risk_label,
      placement_prob_6m: s.placement_prob_6m,
      salary_band_low_lpa: s.salary_band_low_lpa,
      salary_band_high_lpa: s.salary_band_high_lpa,
      ai_summary: dbRisk?.ai_summary ?? null,
      input_snapshot: dbRisk?.input_snapshot?.["_placement_intel"]
        ? dbRisk.input_snapshot
        : {
            ...syntheticPlacementSnapshot(s),
            ...(dbRisk?.input_snapshot && typeof dbRisk.input_snapshot === "object"
              ? dbRisk.input_snapshot
              : {}),
          },
    };
  }
  return dbRisk;
}

function insightsToNewsFeed(
  insights: Array<{ title: string; summary: string }>
): DashboardNewsFeedItem[] {
  return insights.slice(0, 6).map((s, i) => ({
    id: `orientation-${i}`,
    source: "Your orientation",
    relevance_tag: "Grounded",
    headline: s.title,
    summary: s.summary,
    url: "#explore",
  }));
}

/** Full dashboard bundle for `GET /api/features/home` — hub + scorer + thin DB reads for gamification. */
export async function assembleHomeDashboardPayload(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const { actions } = aggregateGapsAndActions(scoring);
  const { text: short_explanation, source: explanation_source } =
    await explainHomeShortWithGemini(scoring);

  const shim = shimStudentProfileFromUserMetadata(meta, ctx.appUser.id);
  const profile = shim;
  const intelligence = buildStudentIntelligence(profile);

  const [dbRisk, events, completedTaskIds, badges] = await Promise.all([
    getLatestRiskScoreByUserId(ctx.appUser.id),
    getRecentUserEventsByUserId(ctx.appUser.id, 8),
    getCompletedWeeklyTaskIds(ctx.appUser.id),
    getUserBadgesDistinct(ctx.appUser.id),
  ]);

  const risk = mergeRiskDisplay(dbRisk, scoring);
  const hubPc = bundle.profile_hub.system.profile_completeness;

  const personalizedLines = buildDashboardPersonalizedLines(profile, risk, {
    intelligence,
    topUniversity: getCachedUniversitiesForProfile(profile, 1)[0] ?? null,
    profileHubCompleteness: hubPc,
  });

  const topUniversitiesForWow = exploreSignalsReady(profile)
    ? getCachedUniversitiesForProfile(profile, 2)
    : [];
  const wowTrustSnapshot = buildWowTrustSnapshot({
    profile,
    intelligence,
    risk,
    topUniversities: topUniversitiesForWow,
  });

  const tasks = buildWeeklyTasks(profile, ctx.appUser.journey_stage);
  const eventsSlim = events.slice(0, 5).map((e: UserEventRow) => ({
    ...e,
    createdAtLabel: e.created_at ? formatDashboardEventTime(e.created_at) : null,
  }));

  const gc = bundle.profile_hub.grounded_context;
  const newsItems =
    gc?.student_insights?.length ? insightsToNewsFeed(gc.student_insights) : [];

  const displayName =
    ctx.appUser.full_name?.trim() || ctx.authUser.email?.split("@")[0] || "Student";

  return {
    display_name: displayName,
    nav_cache_user_id: ctx.appUser.id,
    today_label: formatDashboardDateHeader(new Date()),
    student_intelligence: intelligence,
    profile,
    risk,
    journey_stage: ctx.appUser.journey_stage,
    xp_points: ctx.appUser.xp_points,
    streak_days: ctx.appUser.streak_days,
    badges,
    tasks,
    completed_task_ids: completedTaskIds,
    events: eventsSlim,
    news_items: newsItems,
    personalized_lines: personalizedLines,
    wow_trust_snapshot: wowTrustSnapshot,
    profile_hub_completeness: hubPc,
    grad_score: scoring.grad_score,
    top_universities: scoring.universities.slice(0, 3),
    key_actions: actions.slice(0, 5),
    short_explanation,
    explanation_source,
    scoring_meta: scoring.meta,
    profile_hub: bundle.profile_hub,
  };
}
