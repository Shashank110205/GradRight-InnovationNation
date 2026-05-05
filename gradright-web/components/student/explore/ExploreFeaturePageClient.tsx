"use client";

import Link from "next/link";
import { Compass, MapPin, Sparkles, Target } from "lucide-react";

import { PrimaryActionBanner } from "@/components/shared/PrimaryActionBanner";
import { YourInsightsSection } from "@/components/shared/YourInsightsSection";
import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { cn } from "@/lib/utils";

/**
 * Explore hub — presentation layer only; data from `/api/features/*` (unchanged contracts).
 */
export function ExploreFeaturePageClient() {
  const discover = useFeatureApi<Record<string, unknown>>("discover");
  const career = useFeatureApi<Record<string, unknown>>("career");
  const universities = useFeatureApi<Record<string, unknown>>("universities");

  const loading = discover.loading || career.loading || universities.loading;

  const err = discover.error || career.error || universities.error;

  if (loading && !discover.data && !career.data && !universities.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading your Explore insights…</p>
      </div>
    );
  }

  if (err) {
    return (
      <GlassCard className="border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="font-medium">{err}</p>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-4 rounded-xl")}
          onClick={() => {
            void discover.refetch();
            void career.refetch();
            void universities.refetch();
          }}
        >
          Get My Insights
        </button>
      </GlassCard>
    );
  }

  const d = discover.data ?? {};
  const c = career.data ?? {};
  const u = universities.data ?? {};

  const prevActions = Array.isArray(d.key_actions)
    ? (d.key_actions as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const mergedForInsights: Record<string, unknown> = {
    ...d,
    insights: [
      ...(Array.isArray(d.insights) ? d.insights : []),
      ...(Array.isArray(d.latest_trends) ? d.latest_trends : []),
    ],
    key_actions: [
      ...prevActions,
      ...(typeof c.demand_trends === "string" && c.demand_trends.trim()
        ? [`Career signal: ${String(c.demand_trends).slice(0, 320)}`]
        : []),
    ],
    grad_score: typeof d.grad_score === "number" ? d.grad_score : undefined,
    profile_completeness:
      typeof d.profile_completeness === "number"
        ? d.profile_completeness
        : (d.profile_hub as { system?: { profile_completeness?: number } } | undefined)?.system
            ?.profile_completeness,
  };

  const roles = Array.isArray(c.roles) ? (c.roles as string[]) : [];
  const uniRows = Array.isArray(u.universities) ? u.universities : [];
  const hub = (d.profile_hub as Record<string, unknown> | undefined) ?? {};
  const onboarding =
    hub.onboarding && typeof hub.onboarding === "object"
      ? ((hub.onboarding as Record<string, unknown>).answers as Record<string, unknown> | undefined)
      : undefined;
  const countryStr =
    onboarding && typeof onboarding.target_country === "string"
      ? onboarding.target_country
      : "your selected country";
  const countries = countryStr
    .split(/[,/]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3);
  const field =
    onboarding && typeof onboarding.broad_field === "string"
      ? onboarding.broad_field
      : "your target field";
  const cgpa = (hub.profile_intelligence as { resume?: { cgpa?: number } } | undefined)?.resume?.cgpa;
  const starterRows =
    countries.length > 0
      ? countries.map((country, i) => ({
          tier: i === 0 ? "safe" : i === 1 ? "moderate" : "ambitious",
          name: `${field} shortlist option ${i + 1}`,
          country,
          fit_reason:
            typeof cgpa === "number" && Number.isFinite(cgpa)
              ? `Built around your current CGPA ${cgpa.toFixed(1)} and ${field} trajectory in ${country}.`
              : `Built around your ${field} trajectory in ${country}. Add academic details for tighter matching.`,
          score: i === 0 ? "72" : i === 1 ? "64" : "58",
        }))
      : [];

  return (
    <div className="relative mx-auto max-w-5xl space-y-10 pb-8">
      <PrimaryActionBanner />

      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Explore · For you
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          What&apos;s possible for <span className="text-gradient">your path</span>?
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Programs, salary context, and student realities — tied to your destinations, field, and goals.
        </p>
      </header>

      <YourInsightsSection data={mergedForInsights} />

      <section className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-brand-primary">
            <Sparkles className="size-5" />
            <h2 className="font-heading text-lg font-semibold">Signals & trends</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {Array.isArray(d.insights) && d.insights.length
              ? (d.insights as { title?: string; summary?: string }[]).slice(0, 6).map((it, i) => (
                  <li key={i}>
                    <span className="font-medium text-foreground">{it.title}</span>
                    <p className="mt-1 leading-relaxed">{it.summary}</p>
                  </li>
                ))
              : null}
            {!Array.isArray(d.insights) || !(d.insights as unknown[]).length ? (
              <li className="text-muted-foreground">
                You&apos;re one step away from unlocking this insight — update your preferences to get
                more accurate results.
              </li>
            ) : null}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trends
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {(Array.isArray(d.latest_trends) ? d.latest_trends : []).length ? (
                (d.latest_trends as string[]).map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))
              ) : (
                <li className="list-none text-muted-foreground">
                  Update your goals under Improve Profile to refresh what shows here.
                </li>
              )}
            </ul>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-brand-secondary">
            <MapPin className="size-5" />
            <h2 className="font-heading text-lg font-semibold">Career & roles</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {typeof c.demand_trends === "string" ? c.demand_trends : ""}
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">
            Salary context: {String(c.salary_range ?? "—")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {roles.slice(0, 12).map((r) => (
              <span
                key={r}
                className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium"
              >
                {r}
              </span>
            ))}
          </div>
          {typeof c.growth_trajectory === "string" && c.growth_trajectory ? (
            <p className="mt-4 text-sm text-muted-foreground">{c.growth_trajectory}</p>
          ) : null}
        </GlassCard>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-brand-primary" />
            <h2 className="font-heading text-lg font-semibold">Programs matched to you</h2>
          </div>
          <Link
            href="/career/navigator"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
          >
            Show recommendations
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {uniRows.slice(0, 8).map((row: Record<string, unknown>, i: number) => (
            <GlassCard key={i} className="flex flex-col gap-2 border-border/80 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-primary">
                  {String(row.tier ?? "")}
                </span>
                <span className="text-xs text-muted-foreground">
                  score {String(row.final_score ?? row.base_score ?? "—")}
                </span>
              </div>
              <h3 className="font-heading text-base font-semibold">{String(row.name ?? "")}</h3>
              <p className="text-xs text-muted-foreground">{String(row.country ?? "")}</p>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {String(row.fit_reason ?? "")}
              </p>
            </GlassCard>
          ))}
          {!uniRows.length && starterRows.length
            ? starterRows.map((row, i) => (
                <GlassCard key={`starter-${i}`} className="flex flex-col gap-2 border-dashed border-brand-primary/35 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-primary">
                      {row.tier}
                    </span>
                    <span className="text-xs text-muted-foreground">starter score {row.score}</span>
                  </div>
                  <h3 className="font-heading text-base font-semibold">{row.name}</h3>
                  <p className="text-xs text-muted-foreground">{row.country}</p>
                  <p className="text-sm text-muted-foreground">{row.fit_reason}</p>
                </GlassCard>
              ))
            : null}
          {!uniRows.length && !starterRows.length ? (
            <GlassCard className="border-dashed p-6 text-center text-sm text-muted-foreground md:col-span-2">
              You&apos;re one step away from unlocking this insight — add destinations and goals under
              Improve Profile so we can rank programs for you.
            </GlassCard>
          ) : null}
        </div>
      </section>

      <GlassCard className="flex flex-wrap items-center justify-between gap-4 border-brand-primary/25 bg-brand-primary/5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plan your next move
          </p>
          <p className="mt-1 font-medium text-foreground">
            Your Chances and funding tools use the same saved profile — stay consistent as you refine
            it.
          </p>
        </div>
        <Link href="/plan/admission" className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}>
          <Target className="mr-2 size-4" />
          See My Chances
        </Link>
      </GlassCard>
    </div>
  );
}
