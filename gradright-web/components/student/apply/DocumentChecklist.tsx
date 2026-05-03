"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import { useApplicationStore } from "@/stores/application-store";

export function DocumentChecklist() {
  const saveStep = useApplicationStore((s) => s.saveStep);
  const saving = useApplicationStore((s) => s.saving);
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/apply/document-checklist", { method: "POST" });
        const json = (await res.json()) as {
          success: boolean;
          data?: { items?: string[] };
          error?: string;
        };
        if (!res.ok || !json.success || !json.data?.items?.length) {
          throw new Error(json.error || "Could not load checklist");
        }
        if (!cancelled) setItems(json.data.items);
      } catch (e) {
        if (!cancelled) {
          setLoadErr(
            e instanceof Error ? e.message : "Could not load checklist"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onContinue() {
    await saveStep(0, {});
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Your document checklist
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A personalized list based on your profile. Gather these before you
        continue—saves time with lenders later.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : loadErr ? (
        <p className="mt-4 text-sm text-destructive">{loadErr}</p>
      ) : (
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-foreground">
          {items.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={() => void onContinue()}
          disabled={saving || loading || !!loadErr || items.length === 0}
        >
          Continue
        </Button>
      </div>
    </GlassCard>
  );
}
