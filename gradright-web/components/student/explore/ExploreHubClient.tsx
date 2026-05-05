"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel";
import { UserSnapshotCard } from "@/components/shared/UserSnapshotCard";
import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { EXPLORE_CHAT_STORAGE_KEY } from "@/lib/explore/explore-chat-bridge";
import type { ExploreBadge, ExploreExperiencePayload } from "@/lib/explore/explore-wow";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function badgeLabel(b: ExploreBadge): string {
  switch (b) {
    case "best_fit":
      return "Best fit";
    case "high_roi":
      return "High ROI";
    case "safe_option":
      return "Safe option";
    default:
      return b;
  }
}

function SectionNextStep({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-primary/25 bg-brand-primary/5 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
        Next step for you
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{children}</p>
    </div>
  );
}

function openMentorWith(text: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("gr-mentor-prefill", { detail: { text } }));
}

export function ExploreHubClient(payload: ExploreExperiencePayload) {
  const {
    profile,
    studentIntelligence,
    profileCompleteness,
    signalsReady,
    universities,
    jobs,
    countries,
    scholarships,
    articles,
    exploreChatSeed,
    wowTrustSnapshot,
  } = payload;

  const countryHint = profile?.target_country?.trim() ?? null;
  const fieldHint = profile?.broad_field?.trim() ?? null;

  const chatContextBlob = useMemo(
    () =>
      JSON.stringify({
        explore_focus: exploreChatSeed,
        intelligence: {
          cgpa_band: studentIntelligence.cgpa_band,
          risk_level: studentIntelligence.risk_level,
          financial_capacity: studentIntelligence.financial_capacity,
          career_direction: studentIntelligence.career_direction,
        },
        targets: {
          country: countryHint,
          field: fieldHint,
        },
      }),
    [exploreChatSeed, studentIntelligence, countryHint, fieldHint]
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(EXPLORE_CHAT_STORAGE_KEY, chatContextBlob);
    } catch {
      /* ignore */
    }
  }, [chatContextBlob]);

  return (
    <div className="relative mx-auto max-w-5xl space-y-10 pb-8">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-90"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgb(99 102 241 / 0.14), transparent 55%),
            radial-gradient(ellipse 40% 35% at 100% 10%, rgb(236 72 153 / 0.09), transparent 50%)
          `,
        }}
      />

      <UserSnapshotCard snapshot={wowTrustSnapshot} showExploreLink={false} />

      <header className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Explore · For you
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          What&apos;s possible for{" "}
          <span className="text-gradient">your path</span>?
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Every recommendation below is filtered through your targets, field, CGPA band, funding
          posture, and risk read — with plain-language explainability and a finance link on each
          university pack.
        </p>

        {!signalsReady || profileCompleteness < 35 ? (
          <GlassCard className="border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-foreground">
              Complete your profile to unlock accurate insights
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add <span className="font-medium text-foreground">target countries</span> and{" "}
              <span className="font-medium text-foreground">broad field</span> in profile
              intelligence so Explore stops guessing — tiles stay in explain mode until signals are
              set.
            </p>
            <Link
              href="/dashboard/score-upgrade"
              prefetch
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "mt-3 inline-flex gap-2 rounded-xl"
              )}
            >
              <Target className="size-4" aria-hidden />
              Enrich profile intelligence
            </Link>
          </GlassCard>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
            <Sparkles className="size-3.5" aria-hidden />
            For you
          </span>
          {countryHint ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <MapPin className="size-3.5 text-brand-primary" aria-hidden />
              {countryHint}
            </span>
          ) : null}
          {fieldHint ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <GraduationCap className="size-3.5 text-brand-secondary" aria-hidden />
              {fieldHint}
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            CGPA band: {studentIntelligence.cgpa_band.replace(/_/g, " ")}
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            Risk: {studentIntelligence.risk_level.replace(/_/g, " ")}
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            Funding: {studentIntelligence.financial_capacity.replace(/_/g, " ")}
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="relative overflow-hidden border-brand-primary/25 bg-gradient-to-br from-brand-primary/12 via-card to-violet-500/10 p-5 lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-secondary/20 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your best-fit universities
              </p>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Ranked to your CGPA band, field fit, and destination mix
              </h2>
              <p className="text-sm text-muted-foreground">
                Finance row ties public-band tuition + living to a reference salary from your job
                cluster — directional, not a guarantee.
              </p>
            </div>
            <Link
              href="/career/navigator"
              prefetch
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "inline-flex shrink-0 gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95"
              )}
            >
              <Compass className="size-4" aria-hidden />
              Open navigator
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-center gap-2 border-border/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick paths
          </p>
          <Link
            href="/plan/admission"
            prefetch
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm font-medium transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            Admission predictor
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-primary" />
          </Link>
          <Link
            href="/funding"
            prefetch
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm font-medium transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            Funding confidence
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-primary" />
          </Link>
          <Link
            href="/plan/timeline"
            prefetch
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm font-medium transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            Timeline & deadlines
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-primary" />
          </Link>
        </GlassCard>
      </div>

      {/* Universities */}
      <section aria-label="Your best-fit universities" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Your best-fit universities
            </h2>
            <p className="text-xs text-muted-foreground">
              Ranked packs from the bundled reference set — not a generic catalog.
            </p>
          </div>
        </div>
        {!signalsReady || universities.length === 0 ? (
          <GlassCard className="border-dashed p-6 text-center text-sm text-muted-foreground">
            Add destinations + field to see university packs tailored to your CGPA band (
            {studentIntelligence.cgpa_band.replace(/_/g, " ")}) and funding posture.
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {universities.map((row) => (
              <GlassCard
                key={row.university.id}
                className="flex flex-col gap-3 border-border/80 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                    For you
                  </span>
                  {row.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    >
                      {badgeLabel(b)}
                    </span>
                  ))}
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {row.university.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {row.university.country} · {row.university.ranking_band} band
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground">{row.explanation.reason_short}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {row.explanation.reason_detailed}
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Est. tuition / yr</p>
                    <p className="font-semibold text-foreground">
                      ${row.finance.estimated_tuition_usd_year.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Est. living / yr</p>
                    <p className="font-semibold text-foreground">
                      ${row.finance.estimated_living_year_usd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ref. salary</p>
                    <p className="font-semibold text-foreground">
                      ${row.finance.reference_salary_usd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROI (approx yrs)</p>
                    <p className="font-semibold text-foreground">
                      {row.finance.roi_years_approx != null ? row.finance.roi_years_approx : "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Loan likely?</p>
                    <p className="font-semibold text-foreground">
                      {row.finance.loan_likely ? "Yes — plan envelope early" : "Lower pressure — still model liquidity"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Scholarship lens</p>
                    <p className="text-foreground">{row.finance.scholarship_chance_label}</p>
                  </div>
                </div>
                <ExplainabilityPanel
                  whyRecommended={row.explainability.why}
                  whatCouldGoWrong={row.explainability.risk}
                  whatToDoNext={row.explainability.next}
                />
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full justify-center rounded-xl"
                  )}
                  onClick={() =>
                    openMentorWith(
                      `Context: ${row.explanation.reason_detailed}\nQuestion: Walk me through tradeoffs for ${row.university.name} versus a safer backup on cost and visa.`
                    )
                  }
                >
                  Ask Explore Intelligence about this pack
                </button>
                <SectionNextStep>
                  Compare this pack with one lower living-cost country, then log assumptions in
                  Funding.
                </SectionNextStep>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Jobs */}
      <section aria-label="Career outcomes for you" className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Career outcomes for you
        </h2>
        {!signalsReady || jobs.length === 0 ? (
          <GlassCard className="border-dashed p-6 text-center text-sm text-muted-foreground">
            Set field + destinations to unlock job clusters matched to your intelligence read.
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((row) => (
              <GlassCard
                key={row.job.id}
                className="space-y-3 border-border/80 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                    For you
                  </span>
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">{row.job.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {row.job.country} · demand {row.job.demand_index}
                </p>
                <p className="text-sm font-medium text-foreground">{row.explanation.reason_short}</p>
                <p className="text-xs text-muted-foreground">{row.explanation.reason_detailed}</p>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                  <p className="font-semibold text-foreground">Recommended degrees</p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {row.recommended_degrees.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold text-foreground">Top universities for this lane</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {row.top_universities.map((u) => (
                      <li key={u.id}>
                        {u.name}{" "}
                        <span className="text-muted-foreground/80">
                          ({u.country}, {u.ranking_band})
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold text-foreground">
                    Placement outlook (reference blend)
                  </p>
                  <p className="text-foreground">
                    {row.placement_outlook_pct != null
                      ? `~${row.placement_outlook_pct}% directional horizon vs. your latest snapshot + demand mix`
                      : "Complete onboarding risk pass for a stored placement horizon."}
                  </p>
                </div>
                <ExplainabilityPanel
                  whyRecommended={row.explainability.why}
                  whatCouldGoWrong={row.explainability.risk}
                  whatToDoNext={row.explainability.next}
                />
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full justify-center rounded-xl"
                  )}
                  onClick={() =>
                    openMentorWith(
                      `Career focus: ${row.job.title} in ${row.job.country}. ${row.explanation.reason_detailed}`
                    )
                  }
                >
                  Ask about this outcome
                </button>
                <SectionNextStep>
                  Tie this role to two university packs above, then stress-test living + tuition in
                  Funding.
                </SectionNextStep>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Countries / visa */}
      <section aria-label="Where you should go" className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Where you should go</h2>
        {!signalsReady || countries.length === 0 ? (
          <GlassCard className="border-dashed p-6 text-center text-sm text-muted-foreground">
            Target countries unlock visa difficulty, post-study work months, and conversion heuristics
            from the bundled policy set.
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {countries.map((row) => (
              <GlassCard
                key={row.country}
                className="space-y-3 border-border/80 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                    For you
                  </span>
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">{row.country}</h3>
                <p className="text-sm font-medium text-foreground">{row.explanation.reason_short}</p>
                <p className="text-xs text-muted-foreground">{row.explanation.reason_detailed}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                    <p className="text-muted-foreground">Post-study work</p>
                    <p className="font-semibold text-foreground">
                      {row.post_study_work_months != null ? `${row.post_study_work_months} mo` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2">
                    <p className="text-muted-foreground">Visa difficulty</p>
                    <p className="font-semibold text-foreground">{row.visa_difficulty_label}</p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-border/60 bg-muted/20 p-2">
                    <p className="text-muted-foreground">Job conversion (heuristic)</p>
                    <p className="font-semibold text-foreground">
                      {row.job_conversion_pct != null
                        ? `~${row.job_conversion_pct}% reference blend (work rights × demand)`
                        : "Add job cluster signals by tightening field + destination."}
                    </p>
                  </div>
                  {row.visa ? (
                    <p className="col-span-2 text-xs text-muted-foreground">{row.visa.summary}</p>
                  ) : null}
                </div>
                <ExplainabilityPanel
                  whyRecommended={row.explainability.why}
                  whatCouldGoWrong={row.explainability.risk}
                  whatToDoNext={row.explainability.next}
                />
                <SectionNextStep>
                  Validate salary thresholds for {row.country} on official immigration pages, then map
                  against your offer targets.
                </SectionNextStep>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Scholarships */}
      <section aria-label="How you can fund this" className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">How you can fund this</h2>
        {!signalsReady || scholarships.length === 0 ? (
          <GlassCard className="border-dashed p-6 text-center text-sm text-muted-foreground">
            Scholarships filter on host country + field focus — complete targets to see aid aligned to
            your plan.
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scholarships.map((row) => (
              <GlassCard
                key={row.scholarship.id}
                className="space-y-3 border-border/80 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                    For you
                  </span>
                  <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {row.scholarship.competitiveness}
                  </span>
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {row.scholarship.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {row.scholarship.host_country} · {row.scholarship.coverage}
                </p>
                <p className="text-sm font-medium text-foreground">{row.explanation.reason_short}</p>
                <p className="text-xs text-muted-foreground">{row.explanation.reason_detailed}</p>
                <ExplainabilityPanel
                  whyRecommended={row.explainability.why}
                  whatCouldGoWrong={row.explainability.risk}
                  whatToDoNext={row.explainability.next}
                />
                <SectionNextStep>
                  Draft one impact story for this award, then pair it with a partial funding path in
                  Funding.
                </SectionNextStep>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Articles */}
      <section aria-label="Guides matched to you" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Guides matched to you</h2>
            <p className="text-xs text-muted-foreground">
              Curated frames — only entries that score on your countries, field, and intelligence
              signals.
            </p>
          </div>
        </div>
        {articles.length === 0 ? (
          <GlassCard className="border-dashed p-6 text-center text-sm text-muted-foreground">
            No guide frames matched your current signals without diluting to generic content. Add
            profile depth or broaden field tags to unlock more matches.
          </GlassCard>
        ) : (
          <motion.ul
            className="grid gap-4 md:grid-cols-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {articles.map((article) => (
              <motion.li key={article.slug} variants={item} className="flex flex-col gap-3">
                <Link href={`/explore/articles/${article.slug}`} prefetch className="group block h-full">
                  <GlassCard className="flex h-full flex-col gap-3 border-border/70 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
                        <BookOpen className="size-5" aria-hidden />
                      </div>
                      <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                        For you
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-semibold leading-snug text-foreground group-hover:text-brand-primary">
                      {article.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{article.dek}</p>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                      Read frame
                      <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                    </span>
                  </GlassCard>
                </Link>
                <SectionNextStep>
                  After reading, capture one action in your timeline — small moves beat passive scrolling.
                </SectionNextStep>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>
    </div>
  );
}
