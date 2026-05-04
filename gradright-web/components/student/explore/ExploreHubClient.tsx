"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { DISCOVER_ARTICLES } from "@/lib/discover/articles";
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

export function ExploreHubClient({
  countryHint,
  fieldHint,
  scholarshipPriorityHint,
}: {
  countryHint: string | null;
  fieldHint: string | null;
  scholarshipPriorityHint?: string | null;
}) {
  const personalized = DISCOVER_ARTICLES.filter((a) => {
    if (!countryHint && !fieldHint) return true;
    const c = countryHint?.trim();
    const f = fieldHint?.trim();
    const countryMatch =
      !c ||
      a.countryTags.some(
        (t) =>
          t.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(t.toLowerCase()) ||
          t === "Global"
      );
    const fieldMatch =
      !f ||
      a.fieldTags.some(
        (t) =>
          t.toLowerCase().includes(f.toLowerCase()) ||
          f.toLowerCase().includes(t.toLowerCase())
      );
    return countryMatch && fieldMatch;
  });

  const feed = personalized.length >= 3 ? personalized : [...DISCOVER_ARTICLES];

  return (
    <div className="relative mx-auto max-w-5xl space-y-8 pb-8">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-90"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgb(99 102 241 / 0.14), transparent 55%),
            radial-gradient(ellipse 40% 35% at 100% 10%, rgb(236 72 153 / 0.09), transparent 50%)
          `,
        }}
      />

      <header className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Explore · Trust before conversion
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          What&apos;s possible for{" "}
          <span className="text-gradient">your path</span>?
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Calm explainers, country-aware context, and next steps — no tool dump. Use Discover
          AI (floating button) for roadmap questions anytime.
        </p>
        {scholarshipPriorityHint?.toLowerCase().includes("scholar") ||
        scholarshipPriorityHint?.toLowerCase().includes("afford") ? (
          <p className="max-w-2xl rounded-xl border border-brand-primary/25 bg-brand-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
            <span className="font-semibold text-brand-primary">Based on your profile: </span>
            you skew{" "}
            <span className="font-medium">scholarship-first</span> — we bias guides toward aid
            timelines, program stipends, and conservative loan positioning.
          </p>
        ) : countryHint || fieldHint ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Based on your signals: </span>
            the feed below prioritizes frames that match your country and field chips — add
            profile intelligence anytime to sharpen the ordering further.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
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
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="relative overflow-hidden border-brand-primary/25 bg-gradient-to-br from-brand-primary/12 via-card to-violet-500/10 p-5 lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-secondary/20 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                University explorer
              </p>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Fit, cost signals, and direction — in one flow
              </h2>
              <p className="text-sm text-muted-foreground">
                Start from curiosity; graduate to shortlists with evidence.
              </p>
            </div>
            <Link
              href="/career/navigator"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "inline-flex shrink-0 gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95"
              )}
            >
              <Compass className="size-4" aria-hidden />
              Open explorer
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-center gap-2 border-border/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick paths
          </p>
          <Link
            href="/plan/admission"
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm font-medium transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            Admission predictor
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-primary" />
          </Link>
          <Link
            href="/funding"
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm font-medium transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            Funding confidence
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-primary" />
          </Link>
          <Link
            href="/plan/timeline"
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm font-medium transition hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            Timeline & deadlines
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-primary" />
          </Link>
        </GlassCard>
      </div>

      <section aria-label="Personalized discover feed" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              For you right now
            </h2>
            <p className="text-xs text-muted-foreground">
              Static curated briefs today — modular for news APIs later.
            </p>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline-flex">
            <Sparkles className="size-3" aria-hidden />
            Discover feed
          </span>
        </div>

        <motion.ul
          className="grid gap-4 md:grid-cols-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {feed.slice(0, 6).map((article) => (
            <motion.li key={article.slug} variants={item}>
              <Link href={`/explore/articles/${article.slug}`} className="group block h-full">
                <GlassCard className="flex h-full flex-col gap-3 border-border/70 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
                      <BookOpen className="size-5" aria-hidden />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {article.fieldTags[0] ?? "Guide"}
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
            </motion.li>
          ))}
        </motion.ul>
      </section>
    </div>
  );
}
