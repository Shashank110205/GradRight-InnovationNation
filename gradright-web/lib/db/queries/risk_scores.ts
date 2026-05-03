import { db } from "@/lib/db/client";
import { risk_scores } from "@/lib/db/schema";
import { storedOnboardingSnapshotSchema } from "@/lib/onboarding/onboarding-answers-schema";
import type { NormalizedRiskEngineResult } from "@/lib/onboarding/call-risk-engine";

function mapEngineDriverToRiskDriver(
  d: NormalizedRiskEngineResult["top_drivers"][number]
): RiskDriver {
  return {
    factor: d.factor,
    direction: d.direction,
    weight: d.weight,
    explanation: d.explanation,
    user_friendly_summary: d.user_friendly_summary ?? undefined,
  };
}
import type {
  OnboardingAnswers,
  NextBestAction,
  RiskDriver,
  RiskLabel,
  RiskScore,
} from "@/lib/types";
import type { z } from "zod";
import { count, desc, eq } from "drizzle-orm";

export type StoredOnboardingSnapshot = z.infer<typeof storedOnboardingSnapshotSchema>;

export type LatestRiskScoreSummary = {
  risk_label: RiskLabel;
  placement_prob_6m: number;
  salary_band_low_lpa: number;
  salary_band_high_lpa: number;
  ai_summary: string | null;
  input_snapshot: Record<string, unknown>;
};

export async function getLatestRiskScoreByUserId(
  userId: string
): Promise<LatestRiskScoreSummary | null> {
  const rows = await db
    .select({
      risk_label: risk_scores.risk_label,
      placement_prob_6m: risk_scores.placement_prob_6m,
      salary_band_low_lpa: risk_scores.salary_band_low_lpa,
      salary_band_high_lpa: risk_scores.salary_band_high_lpa,
      ai_summary: risk_scores.ai_summary,
      input_snapshot: risk_scores.input_snapshot,
    })
    .from(risk_scores)
    .where(eq(risk_scores.user_id, userId))
    .orderBy(desc(risk_scores.calculated_at))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    risk_label: row.risk_label,
    placement_prob_6m: Number(row.placement_prob_6m ?? 0),
    salary_band_low_lpa: Number(row.salary_band_low_lpa ?? 0),
    salary_band_high_lpa: Number(row.salary_band_high_lpa ?? 0),
    ai_summary: row.ai_summary ?? null,
    input_snapshot: row.input_snapshot as Record<string, unknown>,
  };
}

function mapRowToRiskScore(row: typeof risk_scores.$inferSelect): RiskScore {
  return {
    id: row.id,
    user_id: row.user_id,
    input_snapshot: row.input_snapshot as Record<string, unknown>,
    placement_prob_3m: Number(row.placement_prob_3m ?? 0),
    placement_prob_6m: Number(row.placement_prob_6m ?? 0),
    placement_prob_12m: Number(row.placement_prob_12m ?? 0),
    salary_band_low_lpa: Number(row.salary_band_low_lpa ?? 0),
    salary_band_high_lpa: Number(row.salary_band_high_lpa ?? 0),
    risk_label: row.risk_label,
    risk_score_raw: Number(row.risk_score_raw ?? 0),
    top_drivers: row.top_drivers,
    next_best_actions: row.next_best_actions,
    ai_summary: row.ai_summary ?? null,
    model_version: row.model_version,
    calculated_at: row.calculated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getLatestFullRiskScoreByUserId(
  userId: string
): Promise<RiskScore | null> {
  const rows = await db
    .select()
    .from(risk_scores)
    .where(eq(risk_scores.user_id, userId))
    .orderBy(desc(risk_scores.calculated_at))
    .limit(1);
  const row = rows[0];
  return row ? mapRowToRiskScore(row) : null;
}

export async function getLatestRiskScoreIdByUserId(
  userId: string
): Promise<string | null> {
  const rows = await db
    .select({ id: risk_scores.id })
    .from(risk_scores)
    .where(eq(risk_scores.user_id, userId))
    .orderBy(desc(risk_scores.calculated_at))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function getRiskScoreById(id: string): Promise<RiskScore | null> {
  const rows = await db
    .select()
    .from(risk_scores)
    .where(eq(risk_scores.id, id))
    .limit(1);
  const row = rows[0];
  return row ? mapRowToRiskScore(row) : null;
}

export async function countRiskScoresByUserId(userId: string): Promise<number> {
  const rows = await db
    .select({ c: count() })
    .from(risk_scores)
    .where(eq(risk_scores.user_id, userId));
  return Number(rows[0]?.c ?? 0);
}

export async function insertRiskScoreRecord(input: {
  userId: string;
  inputSnapshot: Record<string, unknown>;
  risk: NormalizedRiskEngineResult;
  aiSummary: string;
}): Promise<RiskScore> {
  const now = new Date().toISOString();

  const drivers: RiskDriver[] = input.risk.top_drivers.map(mapEngineDriverToRiskDriver);

  const actions: NextBestAction[] = input.risk.next_best_actions.map((a) => ({
    action: a.action,
    impact: a.impact,
    resource_url: a.resource_url,
  }));

  const rows = await db
    .insert(risk_scores)
    .values({
      user_id: input.userId,
      input_snapshot: input.inputSnapshot,
      placement_prob_3m: String(input.risk.placement_prob_3m),
      placement_prob_6m: String(input.risk.placement_prob_6m),
      placement_prob_12m: String(input.risk.placement_prob_12m),
      salary_band_low_lpa: String(input.risk.salary_band_low_lpa),
      salary_band_high_lpa: String(input.risk.salary_band_high_lpa),
      risk_label: input.risk.risk_label,
      risk_score_raw: String(input.risk.risk_score_raw),
      top_drivers: drivers,
      next_best_actions: actions,
      ai_summary: input.aiSummary,
      calculated_at: now,
      updated_at: now,
    })
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error("insertRiskScoreRecord: no row");
  }
  return mapRowToRiskScore(row);
}

export async function insertRiskScoreFromOnboarding(input: {
  userId: string;
  answers: OnboardingAnswers | StoredOnboardingSnapshot;
  risk: NormalizedRiskEngineResult;
  aiSummary: string;
}): Promise<string> {
  const now = new Date().toISOString();

  const drivers: RiskDriver[] = input.risk.top_drivers.map(mapEngineDriverToRiskDriver);

  const actions: NextBestAction[] = input.risk.next_best_actions.map((a) => ({
    action: a.action,
    impact: a.impact,
    resource_url: a.resource_url,
  }));

  const rows = await db
    .insert(risk_scores)
    .values({
      user_id: input.userId,
      input_snapshot: input.answers as unknown as Record<string, unknown>,
      placement_prob_3m: String(input.risk.placement_prob_3m),
      placement_prob_6m: String(input.risk.placement_prob_6m),
      placement_prob_12m: String(input.risk.placement_prob_12m),
      salary_band_low_lpa: String(input.risk.salary_band_low_lpa),
      salary_band_high_lpa: String(input.risk.salary_band_high_lpa),
      risk_label: input.risk.risk_label,
      risk_score_raw: String(input.risk.risk_score_raw),
      top_drivers: drivers,
      next_best_actions: actions,
      ai_summary: input.aiSummary,
      calculated_at: now,
      updated_at: now,
    })
    .returning({ id: risk_scores.id });

  const id = rows[0]?.id;
  if (!id) {
    throw new Error("insertRiskScoreFromOnboarding: no id");
  }
  return id;
}
