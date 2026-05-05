"use client";

import { useCallback, useEffect, useState } from "react";

export type UseFeatureApiResult<T> = {
  data: T | null;
  meta: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Client-only access to `/api/features/:endpoint` (cookie session).
 * UI must not import payload builders or call profile_hub directly.
 */
export function useFeatureApi<T = unknown>(
  endpoint: string,
  options?: { enabled?: boolean }
): UseFeatureApiResult<T> {
  const enabled = options?.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/features/${endpoint}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: T;
        meta?: Record<string, unknown>;
        error?: string;
      };
      if (!res.ok || json.success === false || json.data === undefined) {
        setError(json.error ?? `HTTP ${res.status}`);
        setData(null);
        setMeta({});
        return;
      }
      setData(json.data);
      setMeta(
        json.meta && typeof json.meta === "object" && json.meta !== null
          ? json.meta
          : {}
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setData(null);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => {
    void fetcher();
  }, [fetcher]);

  return { data, meta, loading, error, refetch: fetcher };
}

export async function postFeatureApi<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: T; meta: Record<string, unknown> } | { ok: false; error: string }> {
  const res = await fetch(`/api/features/${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: T;
    meta?: Record<string, unknown>;
    error?: string;
  };
  if (!res.ok || json.success === false || json.data === undefined) {
    return { ok: false, error: json.error ?? `HTTP ${res.status}` };
  }
  return {
    ok: true,
    data: json.data,
    meta:
      json.meta && typeof json.meta === "object" && json.meta !== null ? json.meta : {},
  };
}
