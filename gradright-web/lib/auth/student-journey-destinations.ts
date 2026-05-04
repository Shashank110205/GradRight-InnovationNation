import { safeNextPath } from "@/lib/auth/safe-next-path";

/** Prefixes protected for signed-in students (student web app). */
export const STUDENT_JOURNEY_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/plan",
  "/career",
  "/finance",
  "/funding",
  "/explore",
  "/connect",
  "/apply",
  "/discover",
  "/succeed",
  "/account",
] as const;

export type StudentFlowSnapshot = {
  role: string | null | undefined;
  onboarding_complete: boolean;
  wow_completed: boolean;
};

export function isStudentJourneyPath(pathname: string): boolean {
  return STUDENT_JOURNEY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isNbfcSupervisorRole(role: string | null | undefined): boolean {
  return role === "nbfc_supervisor";
}

/** Home destination for an authenticated user on the student app (from `/` or session refresh). */
export function destinationForAuthenticatedStudentAppUser(
  s: StudentFlowSnapshot
): string {
  if (isNbfcSupervisorRole(s.role)) {
    return "/nbfc";
  }
  if (!s.onboarding_complete) {
    return "/onboarding";
  }
  if (!s.wow_completed) {
    return "/onboarding?stage=wow";
  }
  return "/dashboard";
}

const POST_AUTH_ALLOWED_PREFIXES: readonly string[] = [
  "/dashboard",
  "/plan",
  "/career",
  "/finance",
  "/funding",
  "/explore",
  "/connect",
  "/apply",
  "/discover",
  "/succeed",
  "/account",
];

/** Safe `next` targets after sign-in when onboarding + WOW are complete. */
export function isAllowedStudentPostAuthPath(path: string): boolean {
  const pathOnly = path.split("?")[0] ?? path;
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) {
    return false;
  }
  return POST_AUTH_ALLOWED_PREFIXES.some(
    (p) => pathOnly === p || pathOnly.startsWith(`${p}/`)
  );
}

/** Post sign-in: gates first; then optional deep-link `next` when fully onboarded. */
export function destinationAfterSignIn(
  s: StudentFlowSnapshot,
  nextRaw: string | null,
  fallback: string = "/dashboard"
): string {
  const gates = destinationForAuthenticatedStudentAppUser(s);
  if (gates !== "/dashboard") {
    return gates;
  }
  const next = safeNextPath(nextRaw, fallback);
  if (isAllowedStudentPostAuthPath(next)) {
    return next;
  }
  return fallback;
}

/** Non-null redirect URL if this hub path must be blocked for the current student flow. */
export function hubGuardRedirectDestination(
  pathname: string,
  s: StudentFlowSnapshot
): string | null {
  if (!isStudentJourneyPath(pathname)) {
    return null;
  }
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return null;
  }
  if (isNbfcSupervisorRole(s.role)) {
    return "/sign-in";
  }
  if (!s.onboarding_complete) {
    return "/onboarding";
  }
  if (!s.wow_completed) {
    return "/onboarding?stage=wow";
  }
  return null;
}

/** Rules for `/onboarding` only. */
export function onboardingRouteRedirect(
  pathname: string,
  search: string,
  s: StudentFlowSnapshot
): string | null {
  if (pathname !== "/onboarding" && !pathname.startsWith("/onboarding/")) {
    return null;
  }
  if (isNbfcSupervisorRole(s.role)) {
    return "/nbfc";
  }
  if (s.onboarding_complete && s.wow_completed) {
    return "/dashboard";
  }
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const stageWow = params.get("stage") === "wow";
  if (stageWow && !s.onboarding_complete) {
    return "/onboarding";
  }
  if (s.onboarding_complete && !s.wow_completed && !stageWow) {
    return "/onboarding?stage=wow";
  }
  return null;
}
