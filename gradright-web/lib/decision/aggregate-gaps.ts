import type { ScoringResult } from "./types";

/** Merge Python scorer gaps with grounded university gaps (deduped). */
export function aggregateGapsAndActions(scoring: ScoringResult): {
  gaps: string[];
  actions: string[];
} {
  const gaps = new Set<string>();
  const actions = new Set<string>();

  for (const g of scoring.readiness.improvement_areas ?? []) {
    if (g?.trim()) gaps.add(g.trim());
  }
  for (const u of scoring.universities) {
    for (const g of u.gaps) {
      if (g?.trim()) gaps.add(g.trim());
    }
    for (const a of u.actions) {
      if (a?.trim()) actions.add(a.trim());
    }
  }

  return {
    gaps: [...gaps].slice(0, 24),
    actions: [...actions].slice(0, 24),
  };
}
