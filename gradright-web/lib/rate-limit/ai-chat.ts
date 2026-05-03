import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** 20 requests per minute per user (BUILD_ORDER). */
const WINDOW_REQUESTS = 20;
const WINDOW_DURATION = "1 m";

let ratelimit: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    ratelimit = null;
    return null;
  }

  const redis = new Redis({ url, token });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(WINDOW_REQUESTS, WINDOW_DURATION),
    prefix: "gradright:ai-chat",
  });
  return ratelimit;
}

export async function enforceAiChatRateLimit(userKey: string): Promise<
  | { allowed: true }
  | { allowed: false; retryAfterSec: number }
> {
  const rl = getRatelimit();
  if (!rl) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[ai-chat] UPSTASH_REDIS_REST_URL / TOKEN missing — rate limit disabled"
      );
    }
    return { allowed: true };
  }

  const { success, reset } = await rl.limit(userKey);
  if (success) {
    return { allowed: true };
  }

  const retryAfterSec = Math.max(
    1,
    Math.ceil((reset - Date.now()) / 1000)
  );
  return { allowed: false, retryAfterSec };
}
