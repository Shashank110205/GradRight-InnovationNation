/**
 * Resilience wrapper for single-key Gemini calls (rate limit + retries).
 * Business logic stays in callers; this wraps only the network closure.
 */

import { getGeminiApiKey } from "@/lib/ai/env";

export type GeminiFailureReason =
  | "key_missing"
  | "rate_limited_local"
  | "rate_limited_remote"
  | "network_error"
  | "timeout"
  | "unknown_error"
  | "empty_response";

export class GeminiCallError extends Error {
  reason: GeminiFailureReason;
  module: string;
  attempts: number;
  cause?: unknown;

  constructor(
    reason: GeminiFailureReason,
    module: string,
    attempts: number,
    cause?: unknown,
    message?: string
  ) {
    super(message ?? `${reason} (module=${module}, attempts=${attempts})`);
    this.name = "GeminiCallError";
    this.reason = reason;
    this.module = module;
    this.attempts = attempts;
    this.cause = cause;
  }
}

const DEFAULT_LIMIT_PER_MIN = Number(
  process.env.GEMINI_RPM?.trim() || process.env.GEMINI_PER_ENGINE_RPM?.trim() || "24"
);
const WINDOW_MS = 60_000;

const recentCalls: number[] = [];

function pruneAndCheckLimit(): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  while (recentCalls.length > 0 && recentCalls[0]! <= now - WINDOW_MS) {
    recentCalls.shift();
  }
  if (recentCalls.length >= DEFAULT_LIMIT_PER_MIN) {
    const oldest = recentCalls[0]!;
    return { allowed: false, retryAfterMs: Math.max(250, WINDOW_MS - (now - oldest)) };
  }
  return { allowed: true, retryAfterMs: 0 };
}

function recordCall(): void {
  recentCalls.push(Date.now());
}

function getStatusFromError(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const e = err as { status?: number; statusCode?: number; message?: string };
  if (typeof e.status === "number") return e.status;
  if (typeof e.statusCode === "number") return e.statusCode;
  const msg = typeof e.message === "string" ? e.message : "";
  const m = msg.match(/\b(4\d\d|5\d\d)\b/);
  return m ? Number(m[1]) : null;
}

function isRetryableNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed|network/i.test(
    msg
  );
}

function extractRetryDelayMs(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const e = err as { errorDetails?: unknown; message?: string };

  if (Array.isArray(e.errorDetails)) {
    for (const d of e.errorDetails as Array<Record<string, unknown>>) {
      const t = typeof d?.["@type"] === "string" ? (d["@type"] as string) : "";
      if (t.endsWith("RetryInfo") && typeof d.retryDelay === "string") {
        const m = (d.retryDelay as string).match(/^(\d+(?:\.\d+)?)s$/);
        if (m) return Math.round(Number(m[1]) * 1000);
      }
    }
  }

  if (typeof e.message === "string") {
    const m = e.message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
    if (m) return Math.round(Number(m[1]) * 1000);
  }
  return null;
}

function classify(err: unknown): GeminiFailureReason {
  const status = getStatusFromError(err);
  if (status === 429) return "rate_limited_remote";
  if (status === 408) return "timeout";
  if (status === 401 || status === 403) return "key_missing";
  if (isRetryableNetworkError(err)) return "network_error";
  return "unknown_error";
}

function debugEnabled(): boolean {
  return (
    process.env.GRADRIGHT_GEMINI_FORENSIC === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

function logEvent(
  kind: "request" | "retry" | "fallback",
  module: string,
  extra?: Record<string, unknown>
): void {
  if (!debugEnabled()) return;
  console.log(`[gemini:${kind}]`, JSON.stringify({ module, ...extra }));
}

const MAX_ATTEMPTS = 3;

function backoffMs(attempt: number, hintMs: number | null): number {
  if (hintMs && hintMs > 0) return Math.min(hintMs, 5000);
  return Math.min(4000, 250 * 2 ** attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function safeGeminiGenerate<T>(opts: {
  module: string;
  run: () => Promise<T>;
}): Promise<T> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    logEvent("fallback", opts.module, { reason: "key_missing" });
    throw new GeminiCallError("key_missing", opts.module, 0);
  }

  const limit = pruneAndCheckLimit();
  if (!limit.allowed) {
    logEvent("fallback", opts.module, {
      reason: "rate_limited_local",
      retry_after_ms: limit.retryAfterMs,
    });
    throw new GeminiCallError("rate_limited_local", opts.module, 0);
  }

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    recordCall();
    logEvent("request", opts.module, { attempt });

    try {
      return await opts.run();
    } catch (err) {
      lastErr = err;
      const reason = classify(err);
      const retryable =
        reason === "rate_limited_remote" ||
        reason === "network_error" ||
        reason === "timeout";

      if (!retryable || attempt >= MAX_ATTEMPTS) {
        logEvent("fallback", opts.module, { reason, attempts: attempt });
        throw new GeminiCallError(reason, opts.module, attempt, err);
      }

      const wait = backoffMs(attempt, extractRetryDelayMs(err));
      logEvent("retry", opts.module, { attempt, next_wait_ms: wait, reason });
      await sleep(wait);
    }
  }

  throw new GeminiCallError("unknown_error", opts.module, MAX_ATTEMPTS, lastErr);
}

export type SafeGeminiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: GeminiFailureReason; error?: unknown };

export async function safeGeminiResult<T>(opts: {
  module: string;
  run: () => Promise<T>;
}): Promise<SafeGeminiResult<T>> {
  try {
    const data = await safeGeminiGenerate(opts);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof GeminiCallError) {
      return { ok: false, reason: e.reason, error: e.cause };
    }
    return { ok: false, reason: "unknown_error", error: e };
  }
}
