"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

import { ScoreRevealCarousel } from "@/components/student/onboarding/ScoreRevealCarousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { saveDashboardPreview } from "@/lib/dashboard-preview";
import type { GradRightScore, RiskLabel } from "@/lib/types";
import { useOnboardingStore } from "@/stores/onboarding-store";

function riskAccent(label: RiskLabel): string {
  if (label === "low") return "text-emerald-600 dark:text-emerald-400";
  if (label === "medium") return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function loanPillClass(band: GradRightScore["loan_eligibility_band"]): string {
  if (band === "likely")
    return "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300";
  if (band === "moderate")
    return "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-200";
  return "bg-red-500/15 text-red-700 ring-1 ring-red-500/30 dark:text-red-300";
}

function loanLabel(band: GradRightScore["loan_eligibility_band"]): string {
  if (band === "likely") return "Likely";
  if (band === "moderate") return "Moderate";
  return "Unlikely";
}

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function GradRightScoreScreen({
  score,
  loading,
}: {
  score: GradRightScore | null;
  loading: boolean;
}) {
  const answers = useOnboardingStore((s) => s.answers);

  useEffect(() => {
    if (score) {
      saveDashboardPreview(score);
    }
  }, [score]);

  if (loading || !score) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-8 py-2">
        <Skeleton className="mx-auto h-64 w-full max-w-md rounded-2xl" />
        <Skeleton className="h-9 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-10 py-2">
      <ScoreRevealCarousel score={score} answers={answers} />

      <section
        id="gradright-trust-section"
        className="w-full max-w-2xl scroll-mt-24 rounded-2xl border border-border/60 bg-card/40 p-6 shadow-sm backdrop-blur-sm md:p-8"
      >
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          Your score evolves as more verified academic, career, and market inputs are added. Nothing here is a
          guarantee — it&apos;s a compass to prioritize your next moves.
        </p>
        <Accordion type="single" collapsible className="mt-5 w-full">
          <AccordionItem value="improve" className="border-none">
            <AccordionTrigger className="justify-center py-2 text-sm font-semibold text-brand-primary hover:no-underline">
              What improves this score?
            </AccordionTrigger>
            <AccordionContent className="pb-2 pt-0 text-center text-sm text-muted-foreground">
              <ul className="mx-auto max-w-md list-inside list-disc space-y-1.5 text-left">
                <li>Internships and projects aligned to your target roles</li>
                <li>Certifications that signal depth in your field</li>
                <li>Clearer target fit — programs, geographies, and outcomes</li>
                <li>Profile depth — academics, tests, and financing signals</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <div className="relative w-full">
        <div className="absolute inset-x-0 -top-6 flex justify-center">
          <span className="rounded-full border border-border/60 bg-muted/40 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
            Full snapshot
          </span>
        </div>

        <motion.div
          className="mt-6 flex w-full flex-col gap-8 rounded-2xl border border-border/50 bg-card/30 p-6 shadow-sm backdrop-blur-sm md:p-8"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
              Your GradRight Score
            </p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Numbers behind the carousel
            </h2>
            <p className="text-sm text-muted-foreground">
              Same data as above — organized for a closer read. Refine your profile anytime for sharper
              predictions.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground/90">
              {score.score_confidence_user_message ??
                "Confidence: Medium (benchmark data + profile data)"}
              {score.score_data_coverage_percentage != null ? (
                <>
                  {" "}
                  · Data coverage ~{Math.round(score.score_data_coverage_percentage)}%
                </>
              ) : null}
            </p>
          </motion.div>

          <motion.section variants={fadeUp} className="space-y-3">
            <h3 className="text-lg font-semibold">Your top university matches</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {score.university_matches.map((m) => (
                <div
                  key={m.cluster}
                  className="flex flex-col gap-3 rounded-xl border border-muted bg-card/80 p-4 shadow-sm"
                >
                  <p className="text-sm font-medium leading-snug">{m.cluster}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fit</span>
                      <span>{m.fit_percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${m.fit_percentage}%` }}
                        transition={{
                          duration: 0.7,
                          ease: [0.22, 1, 0.36, 1],
                          delay: 0.15,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.example_universities.join(" · ")}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            variants={fadeUp}
            className="rounded-2xl border border-muted bg-gradient-to-br from-brand-primary/10 via-card to-violet-500/5 p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold">Your estimated salary range</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Indicative range from your field and destination choice (not an offer or guarantee).
            </p>
            <p className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              ₹{score.salary_band_low_lpa} – ₹{score.salary_band_high_lpa}{" "}
              <span className="text-xl font-semibold text-muted-foreground md:text-2xl">LPA</span>
            </p>
          </motion.section>

          <motion.section variants={fadeUp} className="space-y-3">
            <h3 className="text-lg font-semibold">Loan eligibility</h3>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize",
                  loanPillClass(score.loan_eligibility_band)
                )}
              >
                {loanLabel(score.loan_eligibility_band)}
              </span>
              <p className="text-sm text-muted-foreground">
                Non-binding estimate from your early profile; lenders make final calls.
              </p>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Risk note</h3>
            <p
              className={cn(
                "text-sm leading-relaxed md:text-base",
                riskAccent(score.risk_label)
              )}
            >
              {score.risk_one_liner}
            </p>
          </motion.section>

          <motion.div variants={fadeUp} className="flex justify-center pb-2">
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10"
              )}
              onClick={() =>
                document
                  .getElementById("gradright-wow-reveal")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Back to score reveal — finish to unlock dashboard
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
