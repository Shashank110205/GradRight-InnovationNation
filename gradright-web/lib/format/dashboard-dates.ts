/** Deterministic labels for SSR + client hydration (explicit en-US). */

export function formatDashboardDateHeader(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDashboardEventTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}
