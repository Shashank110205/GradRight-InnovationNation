/**
 * Dashboard engine (GEMINI_DASHBOARD_API_KEY) — missions, alerts, digest copy.
 * Reads unified `student_profiles`; does not write enrichment (PROFILE engine only).
 * Wire new flows here as dashboard personalization expands.
 */
export type DashboardEngineReadContext = {
  userId: string;
};

export function describeDashboardEngine(): string {
  return "dashboard";
}
