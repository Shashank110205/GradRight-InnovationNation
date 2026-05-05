"use client";

import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { cn } from "@/lib/utils";

export function ExploreFeatureClient() {
  const discover = useFeatureApi("discover");
  const career = useFeatureApi("career");
  const universities = useFeatureApi("universities");

  const loading = discover.loading || career.loading || universities.loading;
  const err =
    discover.error ?? career.error ?? universities.error ?? null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading your Explore feed from profile hub…
      </div>
    );
  }

  if (err || !discover.data || !career.data || !universities.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm text-destructive">{err ?? "Could not load Explore"}</p>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          onClick={() => {
            void discover.refetch();
            void career.refetch();
            void universities.refetch();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const d = discover.data as {
    insights: Array<{ title: string; summary: string }>;
    latest_trends: string[];
    profile_completeness: number | null;
    signals_ready: boolean;
    student_intelligence: { cgpa_band: string; risk_level: string };
  };
  const cr = career.data as {
    roles: string[];
    salary_range: string;
    demand_trends: string;
    growth_trajectory: string;
    companies: string[];
  };
  const uni = universities.data as {
    universities: Array<{
      name: string;
      country: string;
      tier: string;
      final_score: number;
      fit_reason?: string;
      gaps: string[];
      actions: string[];
    }>;
  };

  return (
    <div className="relative mx-auto max-w-5xl space-y-10 pb-12 pt-2">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Explore · Feature APIs
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          What&apos;s possible for your path
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Powered by <code className="text-xs">/api/features/discover</code>,{" "}
          <code className="text-xs">career</code>, and{" "}
          <code className="text-xs">universities</code> — same profile hub as everywhere else.
        </p>
        {!d.signals_ready ? (
          <GlassCard className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            Add target countries and field in profile intelligence, then refresh orientation so
            Explore stops guessing.
            <Link
              href="/dashboard/score-upgrade"
              className={cn(buttonVariants({ size: "sm" }), "mt-3 inline-flex")}
            >
              Enrich profile
            </Link>
          </GlassCard>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="font-heading text-lg font-semibold">Discover insights</h2>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            {d.insights.slice(0, 6).map((ins, i) => (
              <li key={i}>
                <span className="font-medium text-foreground">{ins.title}</span>
                <p className="mt-1">{ins.summary}</p>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="font-heading text-lg font-semibold">Career & labor market</h2>
          <p className="mt-2 text-sm text-muted-foreground">{cr.demand_trends}</p>
          <p className="mt-2 text-sm text-muted-foreground">{cr.growth_trajectory}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cr.roles.slice(0, 10).map((r) => (
              <span
                key={r}
                className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium"
              >
                {r}
              </span>
            ))}
          </div>
          {cr.salary_range ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Salary context: {cr.salary_range}
            </p>
          ) : null}
        </GlassCard>
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold">Universities (ranked)</h2>
        <div className="mt-4 grid gap-3">
          {uni.universities.slice(0, 8).map((row, i) => (
            <GlassCard key={`${row.name}-${i}`} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.country} · {row.tier} · score {row.final_score}
                  </p>
                </div>
                <Link
                  href="/plan/admission"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                >
                  Plan admits
                </Link>
              </div>
              {row.fit_reason ? (
                <p className="mt-2 text-sm text-muted-foreground">{row.fit_reason}</p>
              ) : null}
              {row.actions?.length ? (
                <p className="mt-2 text-xs text-brand-primary">
                  Next: {row.actions.slice(0, 2).join(" · ")}
                </p>
              ) : null}
            </GlassCard>
          ))}
        </div>
      </section>

      <GlassCard className="border-dashed p-4 text-xs text-muted-foreground">
        Profile strength ~{Math.round(d.profile_completeness ?? 0)}% · CGPA band{" "}
        {d.student_intelligence.cgpa_band.replace(/_/g, " ")}
      </GlassCard>
    </div>
  );
}
