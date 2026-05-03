"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { ConfettiBurst } from "@/components/shell/ConfettiBurst";
import { CountUp } from "@/components/shell/CountUp";
import { ScoreRing } from "@/components/shell/ScoreRing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GradRightScore, OnboardingAnswers } from "@/lib/types";
import {
  DASHBOARD_ENTRY_TRANSITION_MS,
  SCORE_REVEAL_AUTO_ADVANCE_MS,
} from "@/lib/onboarding/motion-timing";
import {
  admissionOutlookLabel,
  financingReadinessLabel,
  pickAspirationHeadline,
  placementOutlookLabel,
  salaryPotentialLine,
} from "@/lib/gradscore/wow-aspiration";
import { parseTargetCountries } from "@/lib/types";

function compositeFitScore(score: GradRightScore): number {
  const fits = score.university_matches.map((m) => m.fit_percentage);
  if (!fits.length) return 72;
  const avg = fits.reduce((a, b) => a + b, 0) / fits.length;
  return Math.min(96, Math.max(54, Math.round(avg)));
}

function flagForCountry(name: string): string {
  const map: Record<string, string> = {
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Canada: "🇨🇦",
    Germany: "🇩🇪",
    Australia: "🇦🇺",
    "India (Domestic)": "🇮🇳",
  };
  return map[name] ?? "🌍";
}

function financeLabel(band: GradRightScore["loan_eligibility_band"]): string {
  if (band === "likely") return "High";
  if (band === "moderate") return "Medium";
  return "Stretch";
}

const COMMAND_CENTER_SUBLINES = [
  "Calibrating your academic path…",
  "Mapping financing readiness…",
  "Preparing your personalized roadmap…",
] as const;

const bodyVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const bodyItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
};

export function ScoreRevealCarousel({
  score,
  answers,
}: {
  score: GradRightScore;
  answers: OnboardingAnswers;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [finishingWow, setFinishingWow] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [hubHandoff, setHubHandoff] = useState<"idle" | "building">("idle");
  const [hubSubLineIdx, setHubSubLineIdx] = useState(0);

  useEffect(() => {
    if (hubHandoff !== "building") return;
    setHubSubLineIdx(0);
    const interval = window.setInterval(() => {
      setHubSubLineIdx((i) => (i + 1) % COMMAND_CENTER_SUBLINES.length);
    }, 780);
    const nav = window.setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, DASHBOARD_ENTRY_TRANSITION_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(nav);
    };
  }, [hubHandoff, router]);

  async function completeWowAndEnterHub() {
    setFinishError(null);
    setFinishingWow(true);
    try {
      const res = await fetch("/api/user/wow-complete", { method: "POST" });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !json.success) {
        setFinishError(json.error ?? "Could not unlock dashboard");
        return;
      }
      setHubHandoff("building");
    } finally {
      setFinishingWow(false);
    }
  }

  function scrollToImproveScore() {
    document
      .getElementById("gradright-trust-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const countries = parseTargetCountries(answers.target_country);
  const primaryPlace = countries[0] ?? "Your destinations";
  const ringValue = compositeFitScore(score);
  const peerPct = Math.max(2, 100 - ringValue);
  const salaryMid = Math.round((score.salary_band_low_lpa + score.salary_band_high_lpa) / 2);
  const isBusiness = answers.broad_field?.includes("Business") ?? false;

  const gradHeadline =
    score.grad_score_display_title ?? "Your Preliminary GradScore";
  const trustLine =
    score.score_confidence_user_message ??
    "Confidence: Medium (benchmark data + profile data)";
  const coverageLine =
    score.score_data_coverage_percentage != null
      ? `Data coverage: ${Math.round(score.score_data_coverage_percentage)}%`
      : null;
  const benchmarkNote =
    score.placement_intelligence_tier !== "live_market"
      ? "Using benchmark intelligence where live feeds are unavailable."
      : null;

  const aspiration = pickAspirationHeadline(score, answers);

  const cards = [
    {
      id: "score",
      title: gradHeadline,
      body: (
        <motion.div
          variants={bodyVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          <motion.p
            variants={bodyItem}
            className="max-w-[320px] text-center font-heading text-base font-semibold leading-snug text-foreground/95 md:text-lg"
          >
            {aspiration}
          </motion.p>
          <motion.div variants={bodyItem} className="mt-6 grid place-items-center">
            <ScoreRing
              value={ringValue}
              label="Fit index"
              sublabel={`Top ${peerPct}% of early profiles like yours`}
            />
          </motion.div>
          <motion.div
            variants={bodyItem}
            className="mt-6 grid w-full max-w-[340px] grid-cols-2 gap-2 text-left text-[11px] leading-snug"
          >
            <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2 backdrop-blur-sm">
              <p className="font-semibold text-foreground/90">Admission outlook</p>
              <p className="mt-0.5 text-muted-foreground">{admissionOutlookLabel(score)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2 backdrop-blur-sm">
              <p className="font-semibold text-foreground/90">Placement outlook</p>
              <p className="mt-0.5 text-muted-foreground">{placementOutlookLabel(score)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2 backdrop-blur-sm">
              <p className="font-semibold text-foreground/90">Salary potential</p>
              <p className="mt-0.5 text-muted-foreground">{salaryPotentialLine(score)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2 backdrop-blur-sm">
              <p className="font-semibold text-foreground/90">Financing readiness</p>
              <p className="mt-0.5 text-muted-foreground">{financingReadinessLabel(score)}</p>
            </div>
          </motion.div>
          <motion.p
            variants={bodyItem}
            className="mt-4 max-w-[300px] text-center text-xs leading-relaxed text-muted-foreground"
          >
            {trustLine}
            {coverageLine ? (
              <>
                <br />
                <span className="text-foreground/80">{coverageLine}</span>
              </>
            ) : null}
            {benchmarkNote ? (
              <>
                <br />
                <span className="mt-1 inline-block text-[11px] text-muted-foreground/90">
                  {benchmarkNote}
                </span>
              </>
            ) : null}
          </motion.p>
          <motion.p
            variants={bodyItem}
            className="mt-3 max-w-[280px] text-center text-xs italic text-muted-foreground/90"
          >
            Your dashboard reveals your next best moves.
          </motion.p>
        </motion.div>
      ),
    },
    {
      id: "country",
      title: "Your study map",
      body: (
        <motion.div variants={bodyVariants} initial="hidden" animate="show" className="text-center">
          <motion.div variants={bodyItem} className="text-6xl drop-shadow-sm md:text-7xl">
            {countries.length ? flagForCountry(countries[0]!) : "🌍"}
          </motion.div>
          <motion.div variants={bodyItem} className="mt-3 px-2 font-heading text-xl font-bold tracking-tight md:text-2xl">
            {countries.length > 1 ? countries.join(" · ") : primaryPlace}
          </motion.div>
          <motion.div variants={bodyItem} className="mt-1 text-sm text-muted-foreground">
            {answers.broad_field ?? "Field TBD"} · {answers.degree_type ?? "Program TBD"}
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "salary",
      title: "Salary outlook",
      body: (
        <motion.div variants={bodyVariants} initial="hidden" animate="show" className="text-center">
          <motion.div variants={bodyItem} className="font-heading text-5xl font-bold tracking-tight text-gradient md:text-6xl">
            ₹<CountUp to={salaryMid} />
            <span className="text-2xl font-semibold text-muted-foreground md:text-3xl">LPA</span>
          </motion.div>
          <motion.p variants={bodyItem} className="mt-2 text-sm text-muted-foreground">
            Indicative mid-point from your field & destinations — not an offer.
          </motion.p>
          <motion.div variants={bodyItem} className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs backdrop-blur-sm">
              Low ₹{score.salary_band_low_lpa}L
            </span>
            <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs backdrop-blur-sm">
              High ₹{score.salary_band_high_lpa}L
            </span>
          </motion.div>
        </motion.div>
      ),
    },
    {
      id: "blocker",
      title: "Sharpest lever",
      body: (
        <motion.div variants={bodyVariants} initial="hidden" animate="show" className="text-center">
          <motion.div variants={bodyItem} className="text-6xl md:text-7xl">
            ⚡
          </motion.div>
          <motion.div variants={bodyItem} className="mt-3 font-heading text-2xl font-bold">
            {isBusiness ? "Tests & quant profile" : "GRE / English readiness"}
          </motion.div>
          <motion.p variants={bodyItem} className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {score.risk_one_liner}
          </motion.p>
        </motion.div>
      ),
    },
    {
      id: "finance",
      title: "Finance comfort",
      body: (
        <motion.div variants={bodyVariants} initial="hidden" animate="show" className="text-center">
          <motion.div variants={bodyItem} className="font-heading text-5xl font-bold text-gradient md:text-6xl">
            {financeLabel(score.loan_eligibility_band)}
          </motion.div>
          <motion.p variants={bodyItem} className="mt-3 text-sm text-muted-foreground">
            Early loan eligibility band from your budget and funding intent.
          </motion.p>
        </motion.div>
      ),
    },
    {
      id: "advice",
      title: "GradRight take",
      body: (
        <motion.div variants={bodyVariants} initial="hidden" animate="show" className="text-center">
          <motion.div variants={bodyItem} className="text-6xl md:text-7xl">
            🧠
          </motion.div>
          <motion.blockquote
            variants={bodyItem}
            className="mt-4 font-heading text-base font-semibold leading-relaxed text-foreground/95 md:text-lg"
          >
            &ldquo;Lock a shortlist, draft a story for your SOP, and book a test date. Small moves now compound
            into admits later.&rdquo;
          </motion.blockquote>
        </motion.div>
      ),
    },
  ];

  useEffect(() => {
    if (step >= cards.length - 1) return;
    const t = window.setTimeout(() => {
      setStep((s) => Math.min(s + 1, cards.length - 1));
    }, SCORE_REVEAL_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [step, cards.length]);

  const c = cards[step]!;

  return (
    <div id="gradright-wow-reveal" className="relative w-full max-w-md">
      <LayoutGroup>
        <div className="mb-6 flex items-center justify-center gap-1.5 px-2">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setStep(idx)}
              className="relative h-2 overflow-hidden rounded-full bg-muted/90 transition-colors"
              style={{ width: idx === step ? 36 : 10 }}
              aria-label={`Go to slide: ${card.title}`}
              aria-current={idx === step}
            >
              {idx === step ? (
                <motion.span
                  layoutId="reveal-progress"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-pink"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
            </button>
          ))}
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 32, scale: 0.96, rotateX: -6 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: -24, scale: 0.96, rotateX: 6 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 1200 }}
          className="relative"
        >
          {step === 0 ? <ConfettiBurst count={48} /> : null}
          <GlassCard
            gradient
            className="relative overflow-hidden p-8 text-center shadow-[0_24px_80px_-24px_rgb(99_102_241/0.35)] md:p-9"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              {c.title}
            </motion.div>
            <div className="mt-7 min-h-[200px] md:min-h-[220px]">{c.body}</div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex flex-col items-center gap-3 text-center"
      >
        {step < cards.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Skip ahead →
          </button>
        ) : (
          <>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <button
                type="button"
                disabled={finishingWow || hubHandoff === "building"}
                onClick={() => void completeWowAndEnterHub()}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 py-4 text-base font-semibold text-white shadow-elegant ring-glow pressable hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
                )}
              >
                {finishingWow ? "Unlocking…" : "Unlock My Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
            <button
              type="button"
              onClick={() => scrollToImproveScore()}
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              See how to improve this score
            </button>
            {finishError ? (
              <p className="text-xs text-destructive">{finishError}</p>
            ) : null}
            <p className="max-w-xs text-xs text-muted-foreground">
              Full snapshot below — scroll when you&apos;re ready, or jump ahead with the link above.
            </p>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {hubHandoff === "building" ? (
          <motion.div
            key="hub-handoff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-background/88 px-6 backdrop-blur-xl"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="max-w-md text-center"
            >
              <p className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Building your GradRight Command Center…
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={hubSubLineIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="mt-5 text-sm font-medium text-brand-primary"
                >
                  {COMMAND_CENTER_SUBLINES[hubSubLineIdx]}
                </motion.p>
              </AnimatePresence>
              <div className="mx-auto mt-8 flex h-1.5 max-w-[200px] overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: DASHBOARD_ENTRY_TRANSITION_MS / 1000,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
