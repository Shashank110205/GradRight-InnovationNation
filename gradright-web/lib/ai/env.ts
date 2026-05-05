/**
 * AI environment — single Gemini key (`GEMINI_API_KEY`). Model: `getGeminiModelId()` (default gemini-2.5-flash; override with `GEMINI_MODEL`).
 */

import fs from "node:fs";
import path from "node:path";

function normalizeEnvValue(raw: string): string {
  let v = raw.trim().replace(/\r/g, "").replace(/\uFEFF/g, "");
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  const hash = v.indexOf(" #");
  if (hash >= 0) v = v.slice(0, hash).trim();
  return v;
}

function readEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined) return undefined;
  const t = normalizeEnvValue(v);
  return t.length > 0 ? t : undefined;
}

/** Google AI Studio / GenAI sometimes documents this name — we accept it as a fallback. */
const GEMINI_ALIASES = ["GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"] as const;

let scannedDiskForGemini = false;

/**
 * If `process.env` is missing the key (stale dev process, editor not saved, or odd Next load order),
 * parse `.env.local` from the app root and optional monorepo parent once.
 */
function hydrateGeminiKeyFromEnvLocalOnce(): void {
  if (scannedDiskForGemini) return;
  scannedDiskForGemini = true;
  if (GEMINI_ALIASES.some((k) => readEnv(k))) return;

  const dirs = [process.cwd(), path.resolve(process.cwd(), "..")];
  for (const dir of dirs) {
    const filePath = path.join(dir, ".env.local");
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 1) continue;
        const key = trimmed.slice(0, eq).trim();
        if (key !== "GEMINI_API_KEY" && key !== "GOOGLE_GENERATIVE_AI_API_KEY") continue;
        const val = normalizeEnvValue(trimmed.slice(eq + 1));
        if (!val) continue;
        if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = val;
        return;
      }
    } catch {
      /* ignore */
    }
  }
}

/** Primary Gemini API key (see `getGeminiModelId()` in `lib/ai/providers/gemini.ts`). */
export function getGeminiApiKey(): string | undefined {
  hydrateGeminiKeyFromEnvLocalOnce();
  return readEnv("GEMINI_API_KEY") ?? readEnv("GOOGLE_GENERATIVE_AI_API_KEY");
}

export type AiKeyPresence = {
  gemini: boolean;
};

export function getAiKeyPresence(): AiKeyPresence {
  return {
    gemini: Boolean(getGeminiApiKey()),
  };
}
