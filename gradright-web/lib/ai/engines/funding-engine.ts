/**
 * Funding engine (GEMINI_FUNDING_API_KEY) — scholarships, ROI, readiness narratives.
 * Consumes unified `student_profiles` read-only until NBFC workflows require deltas.
 */
export type FundingEngineReadContext = {
  userId: string;
};

export function describeFundingEngine(): string {
  return "funding";
}
