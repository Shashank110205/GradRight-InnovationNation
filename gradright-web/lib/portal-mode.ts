/**
 * Split dev/prod surfaces: student app vs NBFC (partner) app.
 * Set `NEXT_PUBLIC_PORTAL_MODE=nbfc` on the Poonawalla Insights dev server (e.g. port 3001).
 */
export type PortalMode = "student" | "nbfc";

export function getPortalMode(): PortalMode {
  return process.env.NEXT_PUBLIC_PORTAL_MODE === "nbfc" ? "nbfc" : "student";
}

export function isNbfcPortalInstance(): boolean {
  return getPortalMode() === "nbfc";
}

/** Where the student-facing app lives (for redirects off the NBFC-only server). */
export function getStudentPortalOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_STUDENT_ORIGIN?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Where the Insights / partner app lives (for links from the student server). */
export function getNbfcPortalOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_NBFC_ORIGIN?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}
