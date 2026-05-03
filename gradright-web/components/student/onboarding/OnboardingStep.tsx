"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Footprints, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { affirmationForSelection } from "@/lib/onboarding/affirmations";
import type { OnboardingQuestionKey } from "@/lib/types";
import {
  ONBOARDING_EASE,
  ONBOARDING_INSIGHT_DWELL_MS,
  ONBOARDING_OPTION_STAGGER_CHILD,
  ONBOARDING_OPTION_STAGGER_DELAY,
} from "@/lib/onboarding/motion-timing";
import { joinTargetCountries, parseTargetCountries } from "@/lib/types";
import { useOnboardingStore } from "@/stores/onboarding-store";

type QuestionDef = {
  step: number;
  key: OnboardingQuestionKey;
  question: string;
  options: readonly string[];
  multiSelect?: boolean;
};

interface OnboardingStepProps {
  question: QuestionDef;
}

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: ONBOARDING_OPTION_STAGGER_CHILD,
      delayChildren: ONBOARDING_OPTION_STAGGER_DELAY,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 30 },
  },
};

export function OnboardingStep({ question }: OnboardingStepProps) {
  const currentStepIndex = useOnboardingStore((s) => s.currentStep);
  const answers = useOnboardingStore((s) => s.answers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const nextStep = useOnboardingStore((s) => s.nextStep);

  const [locked, setLocked] = useState(false);
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<string[]>(() =>
    question.key === "target_country"
      ? parseTargetCountries(answers.target_country)
      : []
  );

  const insightAdvanceRef = useRef<number | null>(null);

  function clearInsightAdvance() {
    if (insightAdvanceRef.current != null) {
      window.clearTimeout(insightAdvanceRef.current);
      insightAdvanceRef.current = null;
    }
  }

  function scheduleInsightAdvance() {
    clearInsightAdvance();
    insightAdvanceRef.current = window.setTimeout(() => {
      insightAdvanceRef.current = null;
      nextStep();
    }, ONBOARDING_INSIGHT_DWELL_MS);
  }

  useEffect(() => {
    return () => clearInsightAdvance();
  }, []);

  function optionSelected(option: string): boolean {
    if (question.key === "loan_needed") {
      const optNeedsLoan = option !== "No, I have other funding";
      return answers.loan_needed === optNeedsLoan;
    }
    if (question.multiSelect && question.key === "target_country") {
      return multiSelected.includes(option);
    }
    return answers[question.key] === option;
  }

  function handleSelectSingle(option: string) {
    if (locked) return;
    setLocked(true);
    setAnswer(question.key, option);
    setAffirmation(
      affirmationForSelection(question.key, option, {
        allCountries:
          question.key === "target_country"
            ? parseTargetCountries(
                question.multiSelect ? joinTargetCountries([...multiSelected, option]) : option
              )
            : undefined,
      })
    );
    scheduleInsightAdvance();
  }

  function toggleMulti(option: string) {
    if (locked) return;
    setMultiSelected((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    );
    setAffirmation(null);
  }

  function confirmMulti() {
    if (locked || multiSelected.length === 0) return;
    setLocked(true);
    const joined = joinTargetCountries(multiSelected);
    setAnswer("target_country", joined);
    setAffirmation(
      affirmationForSelection("target_country", joined, {
        allCountries: multiSelected,
      })
    );
    scheduleInsightAdvance();
  }

  const isMulti = Boolean(question.multiSelect && question.key === "target_country");
  const choiceCols =
    question.options.length > 4
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : "sm:grid-cols-2";

  return (
    <div className="flex w-full max-w-xl flex-col">
      <AnimatePresence mode="wait">
        {affirmation && locked ? (
          <motion.div
            key="reaction"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="w-full"
          >
            <GlassCard gradient className="relative overflow-hidden px-5 py-8 sm:px-8 md:p-10">
              <motion.div
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elegant"
              >
                <Sparkles className="h-7 w-7 text-white" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6 text-balance text-center font-heading text-lg font-semibold leading-snug text-foreground sm:text-xl md:text-2xl"
              >
                {affirmation}
              </motion.p>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Tailoring what&apos;s next — your strategist is lining up context.
              </p>
              <button
                type="button"
                onClick={() => {
                  clearInsightAdvance();
                  nextStep();
                }}
                className="mt-6 min-h-11 w-full touch-manipulation text-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline active:opacity-80"
              >
                Skip ahead →
              </button>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key={`q-${question.step}`}
            initial={{ opacity: 0, x: 36, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -28, filter: "blur(4px)" }}
            transition={{ duration: 0.42, ease: ONBOARDING_EASE }}
            className="flex w-full flex-col gap-5 sm:gap-6"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-pink backdrop-blur-md">
                <Footprints className="h-3.5 w-3.5" />
                Step {currentStepIndex + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                Guided discovery — one thoughtful tap at a time
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-balance font-heading text-2xl font-bold leading-[1.18] tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {question.question}
              </h2>
              {isMulti ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  Tap every destination you&apos;re seriously considering — you can refine this later.
                </motion.p>
              ) : null}
            </div>

            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="show"
              className={cn("grid grid-cols-1 gap-3", choiceCols)}
            >
              {question.options.map((option) => {
                const isSel = optionSelected(option);
                return (
                  <motion.button
                    key={option}
                    type="button"
                    variants={listItem}
                    whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => (isMulti ? toggleMulti(option) : handleSelectSingle(option))}
                    disabled={locked && !isMulti}
                    className={cn(
                      "group relative min-h-[3.25rem] touch-manipulation overflow-hidden rounded-2xl border px-4 py-3.5 text-left shadow-sm ring-0 transition-[box-shadow,ring-color,border-color] sm:min-h-0 sm:py-4",
                      "hover:border-brand-primary/35 hover:shadow-[0_12px_40px_-16px_rgb(99_102_241/0.35)] hover:ring-2 hover:ring-brand-primary/25 pressable",
                      "disabled:pointer-events-none disabled:opacity-70",
                      isSel
                        ? "border-brand-primary/50 bg-gradient-to-br from-brand-primary/12 to-violet-500/10 ring-2 ring-brand-primary/20"
                        : "border-border/60 bg-gradient-to-br from-background/80 to-muted/30"
                    )}
                  >
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                    <span className="relative flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold leading-snug md:text-base">{option}</span>
                      {isMulti && isSel ? (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
                          <Check className="size-4" strokeWidth={2.5} />
                        </span>
                      ) : null}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>

            {isMulti ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <Button
                  type="button"
                  className="min-h-12 w-full touch-manipulation rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary text-base font-semibold text-white shadow-elegant ring-glow hover:opacity-95"
                  disabled={locked || multiSelected.length === 0}
                  onClick={() => confirmMulti()}
                >
                  {multiSelected.length === 0
                    ? "Select at least one destination"
                    : `Continue with ${multiSelected.length} destination${multiSelected.length > 1 ? "s" : ""}`}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
