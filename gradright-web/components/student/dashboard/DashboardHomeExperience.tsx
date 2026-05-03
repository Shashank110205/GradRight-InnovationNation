"use client";

import {
  Activity,
  Award,
  Bell,
  Briefcase,
  ChevronRight,
  Compass,
  Flame,
  GraduationCap,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { CountUp } from "@/components/shell/CountUp";
import { ScoreRing } from "@/components/shell/ScoreRing";
import { StatPill } from "@/components/shell/StatPill";
import { GamificationBar } from "@/components/shared/GamificationBar";
import { JourneyBar } from "@/components/shared/JourneyBar";
import { buttonVariants } from "@/components/ui/button";
import { MODULE_ROUTES } from "@/lib/dashboard/module-registry";
import type { JourneyStage } from "@/lib/types";
import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import type { MockNewsItem } from "@/lib/ai/risk-engine/data/mock-news";
import type { UserEventRow } from "@/lib/db/queries/user_events_list";
import type { StudentProfile } from "@/lib/types";
import type { WeeklyTask } from "@/lib/dashboard/weekly-tasks";
import { cn } from "@/lib/utils";
import { parsePlacementIntelFromSnapshot } from "@/lib/dashboard/parse-placement-intel";

import { NewsFeedTile } from "./NewsFeedTile";
import { PrimaryCTACard } from "./PrimaryCTACard";
import { QuickInsightTile } from "./QuickInsightTile";
import { WeeklyTasksTile } from "./WeeklyTasksTile";

const MODULE_CARDS = [
  { title: "Discover", href: MODULE_ROUTES.discover, blurb: "Reach & match schools" },
  { title: "Plan", href: MODULE_ROUTES.plan, blurb: "Admission predictor" },
  {
    title: "Application Timeline",
    href: "/plan/timeline",
    blurb: "Deadlines & milestones",
  },
  { title: "Finance", href: MODULE_ROUTES.finance, blurb: "EMI & comfort" },
  { title: "Apply", href: MODULE_ROUTES.apply, blurb: "Loan application" },
  { title: "Succeed", href: MODULE_ROUTES.succeed, blurb: "Career milestones" },
  {
    title: "Career Navigator",
    href: "/career/navigator",
    blurb: "Find your best-fit universities with AI",
  },
] as const;

function heroScore(risk: LatestRiskScoreSummary | null): number {
  if (risk?.placement_prob_6m != null) {
    return Math.min(94, Math.max(52, Math.round(risk.placement_prob_6m * 100)));
  }
  return 68;
}

function flagForProfile(country: string | null): string {
  if (!country) return "🌍";
  if (country.includes("United States") || country.includes("USA")) return "🇺🇸";
  if (country.includes("United Kingdom") || country.includes("UK")) return "🇬🇧";
  if (country.includes("Canada")) return "🇨🇦";
  if (country.includes("Germany")) return "🇩🇪";
  if (country.includes("Australia")) return "🇦🇺";
  if (country.includes("India")) return "🇮🇳";
  return "🌍";
}

export type DashboardEventForClient = UserEventRow & {
  createdAtLabel: string | null;
};

export type DashboardHomeExperienceProps = {
  displayName: string;
  profile: StudentProfile | null;
  risk: LatestRiskScoreSummary | null;
  journeyStage: JourneyStage;
  xpPoints: number;
  streakDays: number;
  badges: string[];
  tasks: WeeklyTask[];
  completedTaskIds: string[];
  events: DashboardEventForClient[];
  newsItems: MockNewsItem[];
  todayLabel: string;
};

export function DashboardHomeExperience({
  displayName,
  profile,
  risk,
  journeyStage,
  xpPoints,
  streakDays,
  badges,
  tasks,
  completedTaskIds,
  events,
  newsItems,
  todayLabel,
}: DashboardHomeExperienceProps) {
  const greeting = displayName ? `Hey ${displayName.split(" ")[0]},` : "Hey trailblazer,";
  const score = heroScore(risk);
  const peer = Math.max(2, 100 - score);
  const country = profile?.target_country ?? null;
  const field = profile?.broad_field ?? "Your field";
  const placementPct =
    risk?.placement_prob_6m != null ? Math.round(risk.placement_prob_6m * 100) : null;
  const financePulse =
    profile?.loan_needed === false ? 78 : profile?.budget_band_usd?.includes("80") ? 62 : 71;

  const ctaHref = MODULE_ROUTES[journeyStage];

  const placementIntel = useMemo(
    () => parsePlacementIntelFromSnapshot(risk?.input_snapshot),
    [risk?.input_snapshot]
  );

  const weeklyMission = useMemo(() => {
    const next = tasks.find((t) => !completedTaskIds.includes(t.id));
    return (
      next?.title ??
      tasks[0]?.title ??
      "Pick one weekly task to keep momentum — small wins compound into admits and financing confidence."
    );
  }, [tasks, completedTaskIds]);

  const gradTitle =
    placementIntel?.grad_score_display_title ?? "Your Preliminary GradScore";
  const confLine =
    placementIntel?.score_confidence_user_message ??
    "Confidence: Medium (benchmark data + profile data)";
  const coveragePct =
    placementIntel?.score_data_coverage_percentage != null
      ? Math.round(placementIntel.score_data_coverage_percentage)
      : null;

  return (
    <div className="relative min-h-0">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 50% -15%, rgb(99 102 241 / 0.12), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 0%, rgb(236 72 153 / 0.08), transparent 45%)
          `,
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,oklch(0.145_0_0/0.03)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.145_0_0/0.03)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)]" />

      <div className="animate-in fade-in duration-500 space-y-6 md:space-y-8">
        <div>
          <JourneyBar currentStage={journeyStage} />
        </div>

        <section
          aria-label="What to do next"
          className="scroll-mt-6 rounded-2xl border border-border/70 bg-card/55 p-4 shadow-sm backdrop-blur-sm md:p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Start here
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            You&apos;re in — pick one move to keep momentum. Everything below builds on this.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Link
              href="/dashboard/score-upgrade"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-11 justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95"
              )}
            >
              <Target className="h-4 w-4 shrink-0" aria-hidden />
              Improve your score
            </Link>
            <Link
              href={MODULE_ROUTES.discover}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-11 justify-center gap-2 rounded-xl border-border/80 bg-background/60 backdrop-blur-sm"
              )}
            >
              <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
              Explore universities
            </Link>
            <Link
              href={MODULE_ROUTES.finance}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-11 justify-center gap-2 rounded-xl border-border/80 bg-background/60 backdrop-blur-sm"
              )}
            >
              <Wallet className="h-4 w-4 shrink-0" aria-hidden />
              Check financing readiness
            </Link>
          </div>
        </section>

        <section aria-label="GradScore and accuracy" className="scroll-mt-20">
          <GlassCard className="relative overflow-hidden border-brand-primary/25 bg-gradient-to-br from-brand-primary/12 via-card to-violet-500/10 p-6 shadow-md md:p-7">
            <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-brand-secondary/20 blur-3xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
                  Your GradScore snapshot
                </p>
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  {gradTitle}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{confLine}</p>
                {coveragePct != null ? (
                  <p className="text-xs text-muted-foreground/90">
                    Data coverage ~{coveragePct}% ·{" "}
                    {placementIntel?.intelligence_source_note ??
                      "Benchmark intelligence layers on as you add verified inputs."}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/90">
                    {placementIntel?.intelligence_source_note ??
                      "Your score evolves as more verified academic, career, and market inputs are added."}
                  </p>
                )}
                <div className="rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm leading-snug text-foreground/90 backdrop-blur-sm">
                  <span className="font-semibold text-brand-primary">This week: </span>
                  {weeklyMission}
                </div>
              </div>
              <Link
                href="/dashboard/score-upgrade"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-3 text-sm font-semibold text-white shadow-elegant ring-glow hover:opacity-95 lg:self-center"
                )}
              >
                <Target className="h-4 w-4" aria-hidden />
                Improve My Score Accuracy
              </Link>
            </div>
          </GlassCard>
        </section>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {todayLabel}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {greeting}
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Let&apos;s move <span className="text-gradient">your future</span> forward.
            </h1>
          </div>
          <button
            type="button"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/70 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-pink ring-2 ring-background" />
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-5">
            <GlassCard
              gradient
              className="flex h-full flex-col items-stretch gap-6 p-6 sm:flex-row sm:items-center"
            >
              <ScoreRing
                value={score}
                label="Pulse"
                sublabel={risk ? "From your latest risk snapshot" : "Complete profile for a live pulse"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-lg">{flagForProfile(country)}</span>
                  <span className="text-muted-foreground">
                    {country ?? "Destinations"} · {field}
                  </span>
                </div>
                <h3 className="mt-3 font-heading text-xl font-semibold leading-snug">
                  You&apos;re tracking in the top {peer}% of similar early profiles.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Three small wins this week compound into clearer admits and financing confidence.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber/20 px-2.5 py-1 font-medium text-brand-amber">
                    <Flame className="h-3.5 w-3.5" />
                    {streakDays} day streak
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 font-medium backdrop-blur-sm">
                    <Award className="h-3.5 w-3.5" />
                    {badges.length} badges
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-7 lg:gap-3">
            <StatPill
              icon={<Compass className="h-3.5 w-3.5" />}
              label="Placement"
              value={
                placementPct != null ? (
                  <>
                    <CountUp to={placementPct} />%
                  </>
                ) : (
                  "—"
                )
              }
              trend={risk ? "6-month outlook" : "Run onboarding"}
              tone="blue"
            />
            <StatPill
              icon={<Briefcase className="h-3.5 w-3.5" />}
              label="Risk band"
              value={
                risk ? (
                  <span className="capitalize">{risk.risk_label}</span>
                ) : (
                  "—"
                )
              }
              trend="Live model"
              tone="pink"
            />
            <StatPill
              icon={<Wallet className="h-3.5 w-3.5" />}
              label="Finance"
              value={
                <>
                  <CountUp to={financePulse} />%
                </>
              }
              trend="Comfort heuristic"
              tone="mint"
            />
            <StatPill
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Total XP"
              value={
                <>
                  <CountUp to={Math.min(9999, xpPoints)} />
                </>
              }
              trend="Earn more in weekly tasks"
              tone="amber"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PrimaryCTACard stage={journeyStage} />
          </div>
          <div>
            <GamificationBar xpPoints={xpPoints} streakDays={streakDays} badges={badges} />
          </div>
        </div>

        <div>
          <GlassCard className="relative overflow-hidden border-brand-primary/20 bg-brand-soft p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-[80%] -translate-x-1/2 bg-gradient-to-t from-brand-primary/10 to-transparent blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
                  Your next best move
                </p>
                <h3 className="mt-2 font-heading text-xl font-semibold leading-snug">
                  Deepen the module you&apos;re in — we&apos;ll sync tasks and predictions.
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  About three focused minutes keeps your streak and sharpens your snapshot.
                </p>
              </div>
              <Link
                href={ctaHref}
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-md transition-[transform,box-shadow] hover:shadow-lg pressable sm:self-center"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <QuickInsightTile risk={risk} />
          </div>
          <div className="md:col-span-1">
            <NewsFeedTile items={newsItems} />
          </div>
          <div className="md:col-span-1">
            <WeeklyTasksTile tasks={tasks} completedIds={completedTaskIds} />
          </div>
        </div>

        <section aria-label="Module shortcuts" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">All modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            {MODULE_CARDS.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto flex-col items-start gap-1 border-border/70 bg-card/50 py-4 text-left whitespace-normal backdrop-blur-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md"
                )}
              >
                <span className="text-sm font-semibold text-foreground">{m.title}</span>
                <span className="text-xs font-normal text-muted-foreground">{m.blurb}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-primary">
                  Open <ChevronRight className="size-3" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {events.length > 0 ? (
          <section
            aria-label="Recent activity"
            className="rounded-2xl border border-border/70 bg-card/40 p-4 backdrop-blur-sm"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recent activity
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {events.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <span className="font-medium text-foreground">{e.event_type}</span>
                  {e.createdAtLabel ? (
                    <span className="text-muted-foreground"> · {e.createdAtLabel}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
