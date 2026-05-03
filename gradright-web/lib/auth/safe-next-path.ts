/** Internal path only — prevents open redirects. */
export function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  if (raw.includes("://") || raw.includes("\\")) {
    return fallback;
  }
  return raw;
}
