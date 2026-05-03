import type { GradRightScore } from "@/lib/types";

/** Session snapshot after onboarding score — hydrates dashboard before DB round-trip. */
export const DASHBOARD_PREVIEW_STORAGE_KEY = "gradright:dashboard-preview";

export type DashboardPreviewPayload = {
  savedAt: string;
  score: GradRightScore;
};

export function saveDashboardPreview(score: GradRightScore): void {
  if (typeof window === "undefined") return;
  try {
    const payload: DashboardPreviewPayload = {
      savedAt: new Date().toISOString(),
      score,
    };
    sessionStorage.setItem(
      DASHBOARD_PREVIEW_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function readDashboardPreview(): DashboardPreviewPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DASHBOARD_PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardPreviewPayload;
  } catch {
    return null;
  }
}
