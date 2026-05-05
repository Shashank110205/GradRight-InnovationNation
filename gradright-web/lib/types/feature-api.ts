/**
 * Client-safe shapes for `/api/features/*` responses (do not import server payload builders in UI).
 * Keep aligned with `assembleHomeDashboardPayload` / feature route handlers.
 */

import type { DashboardNewsFeedItem } from "@/lib/data";
import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import type { UserEventRow } from "@/lib/db/queries/user_events_list";
import type { WeeklyTask } from "@/lib/dashboard/weekly-tasks";
import type { StudentIntelligence } from "@/lib/profile/student-intelligence";
import type { WowTrustSnapshot } from "@/lib/trust-layer/wow-trust-snapshot";
import type { JourneyStage, StudentProfile } from "@/lib/types";

export type DashboardEventApiPayload = UserEventRow & {
  createdAtLabel: string | null;
};

export type HomeDashboardApiPayload = {
  display_name: string;
  nav_cache_user_id: string;
  today_label: string;
  student_intelligence: StudentIntelligence;
  profile: StudentProfile | null;
  risk: LatestRiskScoreSummary | null;
  journey_stage: JourneyStage;
  xp_points: number;
  streak_days: number;
  badges: string[];
  tasks: WeeklyTask[];
  completed_task_ids: string[];
  events: DashboardEventApiPayload[];
  news_items: DashboardNewsFeedItem[];
  personalized_lines: string[];
  wow_trust_snapshot: WowTrustSnapshot;
  profile_hub_completeness: number | null;
  grad_score: number;
  top_universities: unknown[];
  key_actions: string[];
  short_explanation: string;
  explanation_source: string;
  scoring_meta: Record<string, unknown>;
  profile_hub: unknown;
};

/** Hero “decision snapshot” card — subset of home payload. */
export type DashboardFeatureHomePanel = Pick<
  HomeDashboardApiPayload,
  | "grad_score"
  | "top_universities"
  | "key_actions"
  | "short_explanation"
  | "explanation_source"
  | "profile_hub"
  | "profile_hub_completeness"
  | "scoring_meta"
>;
