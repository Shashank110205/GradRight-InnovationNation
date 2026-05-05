"use client";

import { GlassCard } from "@/components/shell/GlassCard";
import { Button } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";

export function GreFeatureClient() {
  const { data, loading, error, refetch } = useFeatureApi<{
    suggested_score: { verbal?: number; quant?: number; aw?: number };
    reasoning: string;
    source: string;
  }>("gre");

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
        Loading GRE guidance…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-destructive">{error ?? "Could not load GRE estimator"}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <GlassCard className="space-y-4 p-6">
      <div className="flex flex-wrap gap-4 text-sm">
        {data.suggested_score.verbal != null ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Verbal
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">{data.suggested_score.verbal}</p>
          </div>
        ) : null}
        {data.suggested_score.quant != null ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Quant
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">{data.suggested_score.quant}</p>
          </div>
        ) : null}
        {data.suggested_score.aw != null ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              AW
            </p>
            <p className="mt-1 font-heading text-2xl font-bold">{data.suggested_score.aw}</p>
          </div>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{data.reasoning}</p>
      <p className="text-xs text-muted-foreground">Source: {data.source}</p>
    </GlassCard>
  );
}
