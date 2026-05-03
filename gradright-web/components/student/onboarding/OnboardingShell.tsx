"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { ONBOARDING_EASE } from "@/lib/onboarding/motion-timing";
import { readDashboardPreview } from "@/lib/dashboard-preview";
import { ONBOARDING_QUESTIONS, type GradRightScore } from "@/lib/types";
import { useOnboardingStore } from "@/stores/onboarding-store";

import { ConsentScreen } from "./ConsentScreen";
import { GradRightScoreScreen } from "./GradRightScoreScreen";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingReviewFlashcards } from "./OnboardingReviewFlashcards";
import { OnboardingStep } from "./OnboardingStep";

export function OnboardingShell({
  resumeWowOnly = false,
}: {
  resumeWowOnly?: boolean;
}) {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const gradRightScore = useOnboardingStore((s) => s.gradRightScore);
  const hydrateGradRightScore = useOnboardingStore((s) => s.hydrateGradRightScore);
  const isLoading = useOnboardingStore((s) => s.isLoading);
  const resumeHydrated = useRef(false);

  useEffect(() => {
    if (!resumeWowOnly || resumeHydrated.current) {
      return;
    }
    resumeHydrated.current = true;
    const preview = readDashboardPreview();
    if (preview?.score) {
      hydrateGradRightScore(preview.score);
      return;
    }
    void fetch("/api/user/gradright-score-resume")
      .then((r) => r.json() as Promise<{ success?: boolean; data?: GradRightScore }>)
      .then((json) => {
        if (json.success && json.data) {
          hydrateGradRightScore(json.data);
        }
      })
      .catch(() => {});
  }, [resumeWowOnly, hydrateGradRightScore]);

  const showScoreView =
    gradRightScore !== null || (isLoading && currentStep === 8);

  return (
    <div className="relative min-h-[calc(100vh-0px)] w-full overflow-x-hidden overflow-y-auto">
      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgb(99 102 241 / 0.18), transparent 55%),
            radial-gradient(ellipse 60% 40% at 100% 50%, rgb(236 72 153 / 0.12), transparent 50%),
            radial-gradient(ellipse 50% 35% at 0% 80%, rgb(52 211 153 / 0.1), transparent 45%)
          `,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,oklch(0.145_0_0/0.03)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.145_0_0/0.03)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)]" />

      <div className="relative z-10 flex min-h-[calc(100vh-0px)] w-full flex-col items-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 md:px-6 md:py-12">
        <motion.div layout className="flex w-full max-w-2xl flex-col items-center">
          {!showScoreView ? (
            <OnboardingProgress currentStep={currentStep} />
          ) : null}

          <div className="relative min-h-[320px] w-full">
            <AnimatePresence mode="wait" initial={false}>
              {showScoreView ? (
                <motion.div
                  key="score"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: ONBOARDING_EASE }}
                  className="flex w-full flex-col items-center"
                >
                  <GradRightScoreScreen
                    score={gradRightScore}
                    loading={isLoading && !gradRightScore}
                  />
                </motion.div>
              ) : currentStep >= 8 ? (
                <motion.div
                  key="consent"
                  className="flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ConsentScreen />
                </motion.div>
              ) : currentStep === 7 ? (
                <motion.div
                  key="review"
                  className="flex justify-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.42, ease: ONBOARDING_EASE }}
                >
                  <OnboardingReviewFlashcards />
                </motion.div>
              ) : (
                <motion.div
                  key={`q-${currentStep}`}
                  className="flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <OnboardingStep
                    key={currentStep}
                    question={ONBOARDING_QUESTIONS[currentStep]!}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
