/**
 * Strict UI module envelope: every `/api/features/*` response `data` uses this shape
 * so surfaces render Summary · Insights · Reasons · Actions · Metrics consistently.
 */
export type ModuleMetric = { label: string; value: string };

export type FeatureModuleData = {
  summary: string;
  insights: string[];
  reasons: string[];
  actions: string[];
  metrics: ModuleMetric[];
};

export type FeatureModuleMeta = {
  confidence: number;
  completeness: number;
};

export function moduleMetaFromHub(
  completeness: number | null | undefined,
  confidenceHint?: number
): FeatureModuleMeta {
  const c =
    typeof completeness === "number" && Number.isFinite(completeness)
      ? Math.min(100, Math.max(0, completeness))
      : 0;
  const conf =
    typeof confidenceHint === "number" && Number.isFinite(confidenceHint)
      ? Math.min(100, Math.max(0, confidenceHint))
      : Math.min(95, 42 + Math.round(c * 0.48));
  return { confidence: conf, completeness: c };
}

/** Wrap any feature-specific payload behind the standard presentation layer. */
export function wrapFeatureModule<T extends Record<string, unknown>>(
  contract: FeatureModuleData,
  payload: T
): FeatureModuleData & { payload: T } {
  return { ...contract, payload };
}
