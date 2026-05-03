"use client";

import { AlertTriangle, Calendar, Clock, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import type {
  ApplicationTimelineDeadline,
  ApplicationTimelineMilestone,
  ApplicationTimelinePayload,
  ApplicationTimelinePhase,
  MilestonePriority,
  TimelinePhaseColor,
} from "@/lib/ai/generate-application-timeline";
import type { StudentProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const INTAKE_OPTIONS = ["Fall 2025", "Spring 2026", "Fall 2026"] as const;

const EMPTY_UNIVERSITIES: string[] = [];

function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pickInitialIntake(profile: StudentProfile | null): string {
  const raw = profile?.target_intake?.trim();
  if (!raw) return "Fall 2026";
  if ((INTAKE_OPTIONS as readonly string[]).includes(raw)) return raw;
  if (/fall\s*2025/i.test(raw)) return "Fall 2025";
  if (/spring\s*2026/i.test(raw)) return "Spring 2026";
  if (/fall\s*2026/i.test(raw)) return "Fall 2026";
  return "Fall 2026";
}

function profileToPayload(profile: StudentProfile | null): Record<string, unknown> {
  if (!profile) return {};
  return {
    degree_type: profile.degree_type,
    broad_field: profile.broad_field,
    target_country: profile.target_country,
    target_intake: profile.target_intake,
    current_academic_level: profile.current_academic_level,
    gre_score: profile.gre_score,
    ielts_score: profile.ielts_score,
    toefl_score: profile.toefl_score,
    loan_needed: profile.loan_needed,
    cgpa: profile.cgpa,
  };
}

const SEGMENT_COLOR: Record<TimelinePhaseColor, string> = {
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

function priorityClass(p: MilestonePriority): string {
  if (p === "high") return "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300";
  if (p === "medium")
    return "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return "border-border bg-muted/50 text-muted-foreground";
}

function TimelineSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded-lg bg-muted" />
      <div className="h-10 w-full max-w-xs rounded-lg bg-muted" />
      <div className="h-4 w-full rounded-full bg-muted" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/80" />
        ))}
      </div>
    </div>
  );
}

export function ApplicationTimelineClient({
  profile,
}: {
  profile: StudentProfile | null;
}) {
  const [targetIntake, setTargetIntake] = useState(() => pickInitialIntake(profile));
  const [data, setData] = useState<ApplicationTimelinePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetCountry = profile?.target_country?.trim() || "United States";
  const universities =
    profile?.target_universities ?? EMPTY_UNIVERSITIES;

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan/application-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIntake,
          targetCountry,
          targetUniversities: universities,
          currentDate: todayLocalYmd(),
          profileData: profileToPayload(profile),
        }),
      });
      const json: unknown = await res.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "success" in json &&
        (json as { success: unknown }).success === true &&
        "data" in json &&
        typeof (json as { data: unknown }).data === "object" &&
        (json as { data: unknown }).data !== null
      ) {
        setData((json as { data: ApplicationTimelinePayload }).data);
      } else {
        const msg =
          typeof json === "object" &&
          json !== null &&
          "error" in json &&
          typeof (json as { error: unknown }).error === "string"
            ? (json as { error: string }).error
            : "Could not load timeline";
        setError(msg);
        setData(null);
      }
    } catch {
      setError("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [profile, targetCountry, targetIntake, universities]);

  useEffect(() => {
    void fetchTimeline();
  }, [fetchTimeline]);

  const sortedMilestones = useMemo(() => {
    if (!data?.phases?.length) return [];
    const list: ApplicationTimelineMilestone[] = [];
    for (const p of data.phases) {
      list.push(...p.milestones);
    }
    list.sort((a, b) => a.week - b.week || a.date.localeCompare(b.date));
    return list;
  }, [data]);

  const deadlines = data?.upcomingDeadlines ?? [];

  return (
    <div className="relative min-h-0 space-y-6 pb-10">
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

      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Plan
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Your Application Timeline
            </h1>
            <span className="inline-flex shrink-0 items-center rounded-full border border-brand-primary/40 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
              {targetIntake}
            </span>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Week-by-week milestones for{" "}
            <span className="font-medium text-foreground">{targetCountry}</span>
            {universities.length > 0 ? (
              <>
                {" "}
                · {universities.slice(0, 3).join(", ")}
                {universities.length > 3 ? "…" : ""}
              </>
            ) : null}
          </p>
        </div>

        <label className="flex w-full max-w-[min(100%,280px)] flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:shrink-0">
          Target intake
          <select
            value={targetIntake}
            onChange={(e) => setTargetIntake(e.target.value)}
            className="h-11 w-full rounded-xl border border-border/70 bg-background/80 px-3 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            {INTAKE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error ? (
        <GlassCard className="border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </GlassCard>
      ) : null}

      {loading ? (
        <GlassCard className="p-6">
          <TimelineSkeleton />
        </GlassCard>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Calendar className="size-3.5" aria-hidden />
                  Intake target · {data.intakeDate}
                </span>
                <span>{data.totalWeeks} weeks</span>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Phases
                </p>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted/60 shadow-inner">
                  {data.phases.map((phase: ApplicationTimelinePhase) => {
                    const span = Math.max(1, phase.endWeek - phase.startWeek + 1);
                    const flex = span / Math.max(1, data.totalWeeks);
                    return (
                      <div
                        key={`${phase.phaseName}-${phase.startWeek}`}
                        className={cn(
                          "min-w-[4px] transition-opacity hover:opacity-90",
                          SEGMENT_COLOR[phase.color]
                        )}
                        style={{ flex: flex }}
                        title={`${phase.phaseName} (W${phase.startWeek}–${phase.endWeek})`}
                      />
                    );
                  })}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                  {data.phases.map((phase: ApplicationTimelinePhase) => (
                    <li key={phase.phaseName} className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block size-2 shrink-0 rounded-sm",
                          SEGMENT_COLOR[phase.color]
                        )}
                      />
                      <span className="text-foreground">{phase.phaseName}</span>
                      <span>
                        W{phase.startWeek}–{phase.endWeek}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            <section aria-label="Milestones" className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Milestones</h2>
              <ul className="space-y-3">
                {sortedMilestones.map((m, idx) => (
                  <li key={`${m.week}-${m.date}-${m.task}-${idx}`}>
                    <GlassCard
                      className={cn(
                        "p-4 transition-[box-shadow]",
                        m.isOverdue &&
                          "border-red-500/50 bg-red-500/[0.06] shadow-[inset_0_0_0_1px_rgb(239_68_68/0.25)]"
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Week {m.week}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              · {m.date}
                            </span>
                            {m.isOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-600/15 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                                <AlertTriangle className="size-3" aria-hidden />
                                Overdue
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm font-medium leading-snug text-foreground">
                            {m.task}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex w-fit shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
                            priorityClass(m.priority)
                          )}
                        >
                          {m.priority}
                        </span>
                      </div>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <section aria-label="Upcoming deadlines">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                Upcoming deadlines
              </h2>
              <ul className="space-y-3">
                {deadlines.slice(0, 5).map((d: ApplicationTimelineDeadline, i: number) => (
                  <li key={`${d.date}-${d.task}-${i}`}>
                    <GlassCard className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-sm font-medium leading-snug">{d.task}</p>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                          <Clock className="size-3" aria-hidden />
                          {d.daysLeft}d
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{d.date}</p>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </section>

            <GlassCard gradient className="border-brand-primary/25 p-5">
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-md">
                  <Sparkles className="size-5 text-white" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-pink">
                    AI tip
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                    {data.aiTip}
                  </p>
                </div>
              </div>
            </GlassCard>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
