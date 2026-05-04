/**
 * Central Gemini key resolution for the five-engine architecture.
 * Team-specific env names stay supported via ordered fallbacks (additive only).
 */

export type GeminiEngineId =
  | "dashboard"
  | "explore"
  | "funding"
  | "profile"
  | "dataops";

const LEGACY_KEYS = [
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_API_KEY",
] as const;

const ENGINE_PRIMARY: Record<GeminiEngineId, readonly string[]> = {
  dashboard: ["GEMINI_DASHBOARD_API_KEY", ...LEGACY_KEYS],
  explore: [
    "GEMINI_EXPLORE_API_KEY",
    "GEMINI_DASHBOARD_API_KEY",
    ...LEGACY_KEYS,
  ],
  funding: [
    "GEMINI_FUNDING_API_KEY",
    "GEMINI_DASHBOARD_API_KEY",
    ...LEGACY_KEYS,
  ],
  profile: [
    "GEMINI_PROFILE_API_KEY",
    "GEMINI_DASHBOARD_API_KEY",
    ...LEGACY_KEYS,
  ],
  dataops: [
    "GEMINI_DATAOPS_API_KEY",
    "GEMINI_DASHBOARD_API_KEY",
    ...LEGACY_KEYS,
  ],
};

function readEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** First non-empty value for the given env var names. */
export function resolveFirstKey(names: readonly string[]): string | undefined {
  for (const n of names) {
    const v = readEnv(n);
    if (v) return v;
  }
  return undefined;
}

export function getGeminiApiKeyForEngine(
  engine: GeminiEngineId
): string | undefined {
  return resolveFirstKey(ENGINE_PRIMARY[engine]);
}

/**
 * Default chat / shared flows: dashboard key first, then legacy shared keys.
 */
export function getPrimaryGeminiApiKey(): string | undefined {
  return getGeminiApiKeyForEngine("dashboard");
}

export type EngineKeyStatus = Record<GeminiEngineId, boolean>;

export function getGeminiEngineKeyPresence(): EngineKeyStatus {
  return {
    dashboard: Boolean(getGeminiApiKeyForEngine("dashboard")),
    explore: Boolean(getGeminiApiKeyForEngine("explore")),
    funding: Boolean(getGeminiApiKeyForEngine("funding")),
    profile: Boolean(getGeminiApiKeyForEngine("profile")),
    dataops: Boolean(getGeminiApiKeyForEngine("dataops")),
  };
}
