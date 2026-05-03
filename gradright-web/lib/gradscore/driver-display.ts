import type { RiskDriver } from "@/lib/types";

/**
 * Human-first copy for drivers. Prefer `user_friendly_summary` from the engine;
 * fall back to light heuristics so older snapshots still read well.
 */
export function driverUserSummary(driver: RiskDriver): string {
  if (driver.user_friendly_summary?.trim()) {
    return driver.user_friendly_summary.trim();
  }
  const f = driver.factor.toLowerCase();
  const e = driver.explanation.toLowerCase();
  if (f.includes("profile") || f.includes("weighted")) {
    return "Your academic profile is influencing your projected outcomes in a transparent, explainable way.";
  }
  if (f.includes("demand") || f.includes("sector") || f.includes("market")) {
    if (driver.direction === "negative") {
      return "Your target market may need stronger positioning or adjacent opportunities.";
    }
    return "Market context for your field and destination is working in your favor.";
  }
  if (f.includes("coverage") || f.includes("data")) {
    return "We show how much verified signal sits behind this score — deeper profile data improves confidence.";
  }
  if (e.includes("cgpa") || f.includes("cgpa") || f.includes("academic")) {
    return "Your academic profile is strengthening your projected outcomes.";
  }
  if (e.includes("internship")) {
    return "Hands-on experience is shaping how employers read your readiness.";
  }
  return driver.explanation.length > 160
    ? `${driver.explanation.slice(0, 157)}…`
    : driver.explanation;
}
