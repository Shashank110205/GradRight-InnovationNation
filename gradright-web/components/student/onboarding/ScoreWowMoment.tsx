"use client";

import { motion } from "framer-motion";
import { ArrowRight, Compass, LineChart, Sparkles } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GradRightScore, OnboardingAnswers } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

const cardMotion = {
  hidden: { opacity: 0, y: 16, rotateX: -6 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: 0.12 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function ScoreWowMoment({
  score,
  answers,
}: {
  score: GradRightScore;
  answers: OnboardingAnswers;
}) {
  const countries = parseTargetCountries(answers.target_country);

  const cards = [
    {
      icon: Compass,
      title: "Your map",
      body:
        countries.length > 1
          ? `${countries.join(" · ")} — we’ll balance advice across markets.`
          : countries[0]
            ? `${countries[0]} is locked in as your anchor destination.`
            : "Destinations saved — refine anytime in your dashboard.",
      accent: "from-sky-500/15 to-brand-primary/10",
    },
    {
      icon: LineChart,
      title: "Your trajectory",
      body: `Early outlook: ${score.risk_label} risk band · indicative ₹${score.salary_band_low_lpa}–${score.salary_band_high_lpa} LPA — not a promise, just a directional snapshot.`,
      accent: "from-violet-500/15 to-brand-secondary/10",
    },
    {
      icon: Sparkles,
      title: "Your edge",
      body:
        score.university_matches[0]?.cluster ??
        "We’ll keep sharpening fit scores as you add academics and tests.",
      accent: "from-amber-500/15 to-brand-accent/15",
    },
  ];

  return (
    <section className="w-full space-y-6">
      <div className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
          The wow moment
        </p>
        <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
          You just built your first personalized study-abroad storyboard
        </h3>
        <p className="text-sm text-muted-foreground">
          Three flashcards — your marketing-style recap before the dashboard.
        </p>
      </div>

      <div
        className="grid gap-4 md:grid-cols-3"
        style={{ perspective: 1400 }}
      >
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            custom={i}
            variants={cardMotion}
            initial="hidden"
            animate="show"
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-5 shadow-lg",
              c.accent
            )}
          >
            <c.icon className="mb-3 size-8 text-brand-primary" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {c.title}
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
              {c.body}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-primary/35 bg-brand-primary/5 px-6 py-8 text-center"
      >
        <p className="max-w-md text-base font-semibold text-foreground">
          Ready to see this as a living dashboard — milestones, financing nudges,
          and sharper predictions as you add detail?
        </p>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ size: "lg" }),
            "group h-12 gap-2 bg-brand-primary px-8 text-base font-semibold text-white shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90"
          )}
        >
          View my personalized dashboard
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </section>
  );
}
