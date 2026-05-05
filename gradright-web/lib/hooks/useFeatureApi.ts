"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { APIResponse } from "@/lib/types";

const FEATURE_BASE = "/api/features";

export type FeatureApiState<T> = {
  data: T | null;
  meta: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function parseJson<T>(json: APIResponse<T> & { meta?: Record<string, unknown> }): {
  data: T | null;
  meta: Record<string, unknown> | null;
  err: string | null;
} {
  if (!json.success) {
    return { data: null, meta: null, err: json.error ?? "Request failed" };
  }
  return {
    data: (json.data ?? null) as T | null,
    meta: (json as { meta?: Record<string, unknown> }).meta ?? null,
    err: null,
  };
}

/**
 * Fetches a single `GET /api/features/:endpoint` bundle (profile_hub-backed).
 * Listens for `gr-feature-refresh` to refetch after profile / hub updates.
 */
export function useFeatureApi<T = unknown>(endpoint: string): FeatureApiState<T> {
  const path = useMemo(
    () => `${FEATURE_BASE}/${endpoint.replace(/^\//, "")}`,
    [endpoint]
  );

  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path, {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as APIResponse<T> & {
        meta?: Record<string, unknown>;
      };
      if (!res.ok) {
        setData(null);
        setMeta(null);
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      const { data: d, meta: m, err } = parseJson(json);
      if (err) {
        setError(err);
        setData(null);
        setMeta(null);
        return;
      }
      setData(d);
      setMeta(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setData(null);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void fetcher();
  }, [fetcher]);

  useEffect(() => {
    const onRefresh = () => {
      void fetcher();
    };
    window.addEventListener("gr-feature-refresh", onRefresh);
    return () => window.removeEventListener("gr-feature-refresh", onRefresh);
  }, [fetcher]);

  return { data, meta, loading, error, refetch: fetcher };
}

/** One-off POST to `/api/features/:endpoint` (mentor, profile-deepening). */
export async function postFeatureApi<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<
  { ok: true; data: T; meta: Record<string, unknown> | null } | { ok: false; error: string }
> {
  const path = `${FEATURE_BASE}/${endpoint.replace(/^\//, "")}`;
  try {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json()) as APIResponse<T> & {
      meta?: Record<string, unknown>;
    };
    if (!res.ok || !json.success) {
      return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    }
    window.dispatchEvent(new Event("gr-feature-refresh"));
    return {
      ok: true,
      data: (json.data ?? null) as T,
      meta: json.meta ?? null,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export type FeaturePostResult<T> = {
  data: T | null;
  meta: Record<string, unknown> | null;
  error: string | null;
  posting: boolean;
  post: (body: Record<string, unknown>) => Promise<void>;
};

export function useFeaturePost<T = unknown>(
  endpoint: string,
  method: "POST" | "PUT" | "PATCH" = "POST"
): FeaturePostResult<T> {
  const path = useMemo(
    () => `${FEATURE_BASE}/${endpoint.replace(/^\//, "")}`,
    [endpoint]
  );

  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      setPosting(true);
      setError(null);
      try {
        const res = await fetch(path, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as APIResponse<T> & {
          meta?: Record<string, unknown>;
        };
        if (!res.ok || !json.success) {
          setData(null);
          setMeta(null);
          setError(json.error ?? `HTTP ${res.status}`);
          return;
        }
        const { data: d, meta: m } = parseJson(json);
        setData(d);
        setMeta(m);
        window.dispatchEvent(new Event("gr-feature-refresh"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
        setData(null);
        setMeta(null);
      } finally {
        setPosting(false);
      }
    },
    [method, path]
  );

  return { data, meta, error, posting, post };
}
