"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { ONBOARDING_EASE } from "@/lib/onboarding/motion-timing";
import {
  onboardingFoundationHint,
  onboardingJourneyStageLabel,
} from "@/lib/onboarding/progress-stages";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";

const TOTAL_QUESTIONS = 7;

interface OnboardingProgressProps {
  /** 0–6 questions, 7 review, 8 consent */
  currentStep: number;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const prevStep = useOnboardingStore((s) => s.prevStep);

  const progressPct =
    currentStep >= 8
      ? 100
      : currentStep >= 7
        ? 92
        : ((currentStep + 1) / TOTAL_QUESTIONS) * 100;

  const stepLabel =
    currentStep >= 8
      ? "Consent"
      : currentStep >= 7
        ? "Review"
        : `Step ${currentStep + 1} of ${TOTAL_QUESTIONS}`;

  const stageLabel = onboardingJourneyStageLabel(currentStep);
  const foundation = onboardingFoundationHint(currentStep);

  const canBack = currentStep > 0 && currentStep < 8;
  const isLastQuestion = currentStep === 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: ONBOARDING_EASE }}
      className="mb-6 w-full max-w-xl px-1 sm:mb-8"
    >
      <div className="flex w-full items-center gap-2 sm:gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => prevStep()}
          disabled={!canBack}
          className="min-h-11 min-w-11 shrink-0 rounded-full p-2.5 text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
          aria-label="Previous step"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <div className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/80 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-pink shadow-[0_0_20px_rgb(99_102_241/0.45)]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: isLastQuestion ? 100 : 120, damping: isLastQuestion ? 18 : 22 }}
          />
        </div>
        <div className="flex min-w-[5.5rem] flex-col items-end text-[10px] tabular-nums sm:min-w-[6rem] sm:text-[11px]">
          <span className="font-semibold leading-tight text-foreground">{stepLabel}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-pink sm:text-[11px]">
            {stageLabel}
          </span>
          <span className="mt-0.5 text-muted-foreground">{Math.round(progressPct)}%</span>
        </div>
      </div>

      {foundation ? (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          {foundation}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-1">
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
          const done = currentStep > i;
          const active = currentStep === i;
          return (
            <div key={i} className="flex flex-1 items-center gap-0.5 sm:gap-1">
              <motion.div
                initial={false}
                animate={
                  active
                    ? { scale: [1, 1.08, 1], transition: { duration: 0.5, ease: ONBOARDING_EASE } }
                    : {}
                }
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-semibold transition-colors sm:h-7 sm:w-7 sm:text-[10px]",
                  done && "border-brand-primary bg-brand-primary/15 text-brand-primary",
                  active &&
                    "border-brand-primary bg-background text-brand-primary ring-2 ring-brand-primary/25",
                  !done && !active && "border-muted-foreground/25 text-muted-foreground"
                )}
              >
                {i + 1}
              </motion.div>
              {i < TOTAL_QUESTIONS - 1 ? (
                <div
                  className={cn(
                    "h-0.5 min-w-[4px] flex-1 rounded-full transition-colors sm:min-w-[6px]",
                    i < currentStep ? "bg-brand-primary/60" : "bg-muted"
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
