"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

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

  const phaseLabel =
    currentStep >= 8
      ? "Consent"
      : currentStep >= 7
        ? "Review"
        : `Step ${currentStep + 1} of ${TOTAL_QUESTIONS}`;

  const canBack = currentStep > 0 && currentStep < 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 w-full max-w-xl px-1"
    >
      <div className="flex w-full items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => prevStep()}
          disabled={!canBack}
          className="rounded-full p-2.5 text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-30"
          aria-label="Previous step"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/80 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-pink shadow-[0_0_20px_rgb(99_102_241/0.45)]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
        <div className="flex min-w-[5rem] flex-col items-end text-[11px] tabular-nums">
          <span className="font-semibold text-foreground">{phaseLabel}</span>
          <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
        </div>
      </div>

      <div className="mt-4 hidden sm:flex sm:items-center sm:gap-1">
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
          const done = currentStep > i;
          const active = currentStep === i;
          return (
            <div key={i} className="flex flex-1 items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors",
                  done && "border-brand-primary bg-brand-primary/15 text-brand-primary",
                  active &&
                    "border-brand-primary bg-background text-brand-primary ring-2 ring-brand-primary/25",
                  !done && !active && "border-muted-foreground/25 text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              {i < TOTAL_QUESTIONS - 1 ? (
                <div
                  className={cn(
                    "h-0.5 min-w-[6px] flex-1 rounded-full transition-colors",
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
