"use client";

import { useEffect, useMemo, useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { cn } from "@/lib/utils";

const EXAMS_BY_COUNTRY: Record<
  string,
  Array<{ exam: string; typical_for: string; target: string; pattern: string }>
> = {
  "United States": [
    {
      exam: "GRE",
      typical_for: "MS/PhD STEM programs",
      target: "320+ (Quant-heavy programs may expect higher)",
      pattern: "Verbal + Quant + Analytical Writing",
    },
    {
      exam: "TOEFL iBT",
      typical_for: "English proficiency",
      target: "95-105+",
      pattern: "Reading, Listening, Speaking, Writing",
    },
    {
      exam: "GMAT",
      typical_for: "MBA / business analytics",
      target: "Classic 650+ or Focus 615+",
      pattern: "Quantitative, Verbal, Data Insights",
    },
  ],
  "United Kingdom": [
    {
      exam: "IELTS Academic",
      typical_for: "Most taught master’s programs",
      target: "Overall 6.5-7.5 (no band <6 usually)",
      pattern: "Listening, Reading, Writing, Speaking",
    },
    {
      exam: "GRE/GMAT",
      typical_for: "Selective programs / business schools",
      target: "Program-specific (often optional)",
      pattern: "Depends on test chosen",
    },
  ],
  Canada: [
    {
      exam: "IELTS / TOEFL",
      typical_for: "English proficiency + visa support",
      target: "IELTS 6.5-7.5 or TOEFL 90+",
      pattern: "Language sections",
    },
    {
      exam: "GRE",
      typical_for: "Research-focused STEM universities",
      target: "315+ where required/competitive",
      pattern: "Verbal + Quant + Analytical Writing",
    },
  ],
  Germany: [
    {
      exam: "IELTS / TOEFL",
      typical_for: "English-taught programs",
      target: "IELTS 6.5+ or TOEFL 88+",
      pattern: "Language sections",
    },
    {
      exam: "GRE",
      typical_for: "Technical master’s at top schools",
      target: "Program-specific (often optional)",
      pattern: "Verbal + Quant + Analytical Writing",
    },
  ],
  Australia: [
    {
      exam: "IELTS / TOEFL / PTE",
      typical_for: "Admission + visa pathways",
      target: "IELTS 6.5-7.0 equivalent",
      pattern: "Language sections per test",
    },
    {
      exam: "GMAT/GRE",
      typical_for: "MBA and select quantitative tracks",
      target: "Program-specific",
      pattern: "Depends on test chosen",
    },
  ],
};

function formatSourceLabel(raw: string): string {
  const s = raw.toLowerCase();
  if (s === "gemini" || s === "unavailable") return "Personalized";
  return raw || "Personalized";
}

export default function ExamStrategyPage() {
  const { data, loading, error, refetch } = useFeatureApi<Record<string, unknown>>("gre");
  const [country, setCountry] = useState<string>("United States");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/user/dashboard-brief", {
          cache: "no-store",
          credentials: "include",
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { profile?: { target_country?: string | null } | null };
        };
        const target = json.data?.profile?.target_country?.trim();
        if (target && EXAMS_BY_COUNTRY[target]) {
          setCountry(target);
        }
      } catch {
        // keep default
      }
    })();
  }, []);

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
  const countryOptions = Object.keys(EXAMS_BY_COUNTRY);
  const exams = useMemo(
    () => EXAMS_BY_COUNTRY[country] ?? EXAMS_BY_COUNTRY["United States"],
    [country]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Exam Strategy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Country-aware exam guidance based on your profile and target destination.
        </p>
      </div>

      <GlassCard className="space-y-4 p-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Target country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 w-full max-w-sm rounded-lg border border-border/70 bg-background px-3 text-sm shadow-sm transition-[box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            {countryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {suggested.verbal != null ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/45">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Verbal
              </p>
              <p className="mt-1 font-heading text-2xl font-bold">{suggested.verbal}</p>
            </div>
          ) : null}
          {suggested.quant != null ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/45">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Quant
              </p>
              <p className="mt-1 font-heading text-2xl font-bold">{suggested.quant}</p>
            </div>
          ) : null}
          {suggested.aw != null ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/45">
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

      <div className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => (
          <GlassCard
            key={exam.exam}
            className="space-y-2 p-5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <p className="font-heading text-lg font-semibold">{exam.exam}</p>
            <p className="text-sm text-muted-foreground">{exam.typical_for}</p>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
              <p>
                <span className="font-medium">Target range:</span> {exam.target}
              </p>
              <p className="mt-1">
                <span className="font-medium">Pattern:</span> {exam.pattern}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
