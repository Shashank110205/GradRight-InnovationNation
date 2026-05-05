"use client";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { cn } from "@/lib/utils";

function formatSourceLabel(raw: string): string {
  const s = raw.toLowerCase();
  if (s === "gemini" || s === "unavailable") return "Personalized";
  return raw || "Personalized";
}

export default function ExamStrategyPage() {
  const { data, loading, error, refetch } = useFeatureApi<Record<string, unknown>>("gre");

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <GlassCard className="border-destructive/40 p-6 text-center">
        <p>{error ?? "Could not load exam guidance"}</p>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "default" }), "mt-4 rounded-xl")}
          onClick={() => void refetch()}
        >
          Get My Insights
        </button>
      </GlassCard>
    );
  }

  const suggested = (data.suggested_score ?? {}) as Record<string, number | undefined>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Exam Strategy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Targets combine your résumé signals with program-style requirements.
        </p>
      </div>

      <GlassCard className="space-y-4 p-6">
        <div className="flex flex-wrap gap-4 text-sm">
          {suggested.verbal != null ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Verbal
              </p>
              <p className="mt-1 font-heading text-2xl font-bold">{suggested.verbal}</p>
            </div>
          ) : null}
          {suggested.quant != null ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Quant
              </p>
              <p className="mt-1 font-heading text-2xl font-bold">{suggested.quant}</p>
            </div>
          ) : null}
          {suggested.aw != null ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                AW
              </p>
              <p className="mt-1 font-heading text-2xl font-bold">{suggested.aw}</p>
            </div>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {String(data.reasoning ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          Guidance style: {formatSourceLabel(String(data.source ?? ""))}
        </p>
      </GlassCard>
    </div>
  );
}
