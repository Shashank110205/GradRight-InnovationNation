/**
 * Explore engine (GEMINI_EXPLORE_API_KEY) — pathways, country guidance, discovery.
 * Consumes unified `student_profiles` read-only until product specs define writes.
 */
export type ExploreEngineReadContext = {
  userId: string;
};

export function describeExploreEngine(): string {
  return "explore";
}
