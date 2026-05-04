/** Single Gemini backbone — context switches via system prompt appendix (see `mentor.ts`). */
export type MentorMode = "dashboard" | "discover" | "result" | "profile";

export function resolveMentorMode(pathname: string): MentorMode {
  if (pathname.startsWith("/explore")) return "discover";
  if (pathname.startsWith("/dashboard/score-upgrade")) return "profile";
  if (pathname.startsWith("/plan/admission") || pathname.startsWith("/funding")) {
    return "result";
  }
  return "dashboard";
}
