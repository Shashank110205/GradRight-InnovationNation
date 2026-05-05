import type { NormalizedRiskEngineResult } from "@/lib/onboarding/risk-engine-schema";

import type { UniversityDecisionRow } from "@/lib/decision/enrich-university-scores";

export type ScoringResult = {
  grad_score: number;
  scorer: NormalizedRiskEngineResult | null;
  admission_scores: Record<string, number>;
  readiness: {
    signals: Record<string, string> | null;
    strengths: string[];
    improvement_areas: string[];
  };
  universities: UniversityDecisionRow[];
  roi: {
    salary_mid_lpa: number | null;
    aggregate_fee_index: number | null;
    ratio: number | null;
  };
  meta: {
    risk_engine_configured: boolean;
    insufficient_data: boolean;
    note?: string;
    from_cache?: boolean;
  };
};
