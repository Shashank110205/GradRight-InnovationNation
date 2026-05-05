"use client";

import { useEffect, useState } from "react";

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

export function useNbfcPolling<T>(url: string, intervalMs = 20000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as ApiEnvelope<T>;
        if (!mounted) return;
        if (!json.success || !json.data) {
          setError(json.error ?? "Failed to load");
          return;
        }
        setData(json.data);
        setError(null);
      } catch {
        if (mounted) setError("Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    const timer = setInterval(() => {
      void load();
    }, intervalMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [url, intervalMs]);

  return { data, loading, error };
}
