/**
 * Client-side presentation helpers for `/api/features/*` payloads.
 * Maps heterogeneous `data` shapes, then enriches with `enrichFeatureData` (decisions + actions).
 */
import {
  enrichFeatureData,
  EMPTY_SENTINEL,
  extractEnrichProfileFromRaw,
  mergeEnrichProfile,
  type FeatureEnrichProfile,
} from "@/lib/ui/enrich-feature-data";
import type { FeatureModuleView } from "@/lib/ui/feature-module-view-type";

export type { FeatureModuleView } from "@/lib/ui/feature-module-view-type";

const EMPTY_INSIGHT = EMPTY_SENTINEL;

export function normalizeFeatureModuleView(
  raw: Record<string, unknown> | null | undefined,
  profile?: FeatureEnrichProfile | null
): FeatureModuleView {
  const r = raw ?? {};
  const base = buildBaseFeatureModuleView(r);
  const mergedProfile = mergeEnrichProfile(extractEnrichProfileFromRaw(r), profile ?? undefined);
  return enrichFeatureData(r, mergedProfile, base);
}

function buildBaseFeatureModuleView(raw: Record<string, unknown>): FeatureModuleView {
  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : typeof raw.short_explanation === "string" && raw.short_explanation.trim()
        ? raw.short_explanation.trim()
        : EMPTY_INSIGHT;

  const insights = pickStringArray(raw.insights)
    .concat(pickStringArray(raw.personalizedLines))
    .concat(pickStringArray(raw.latest_trends))
    .filter(Boolean)
    .slice(0, 16);

  const reasons = pickStringArray(raw.reasons).slice(0, 12);
  const actions = pickStringArray(raw.actions).concat(pickStringArray(raw.key_actions)).filter(Boolean).slice(0, 16);

  const metrics = pickMetrics(raw.metrics);
  const fallbackMetrics: { label: string; value: string }[] = [];
  if (typeof raw.grad_score === "number") {
    fallbackMetrics.push({ label: "GradScore", value: String(Math.round(raw.grad_score)) });
  }
  const pc = raw.profile_completeness ?? raw.profileHubCompleteness;
  if (typeof pc === "number") {
    fallbackMetrics.push({ label: "Profile", value: `${Math.round(pc)}% complete` });
  }

  return {
    summary,
    insights: insights.length ? insights : [EMPTY_INSIGHT],
    reasons: reasons.length ? reasons : [],
    actions: actions.length ? actions : ["Visit Improve Profile to sharpen predictions everywhere."],
    metrics: metrics.length ? metrics : fallbackMetrics,
  };
}

function pickStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function pickMetrics(v: unknown): { label: string; value: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { label: string; value: string }[] = [];
  for (const el of v) {
    if (!el || typeof el !== "object") continue;
    const o = el as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const value = typeof o.value === "string" ? o.value.trim() : "";
    if (label && value) out.push({ label, value });
  }
  return out.slice(0, 12);
}
