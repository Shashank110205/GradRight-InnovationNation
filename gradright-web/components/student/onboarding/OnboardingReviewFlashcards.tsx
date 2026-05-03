"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ONBOARDING_QUESTIONS, parseTargetCountries } from "@/lib/types";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OnboardingReviewFlashcards() {
  const answers = useOnboardingStore((s) => s.answers);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);

  const cards = ONBOARDING_QUESTIONS.map((q) => {
    let value: string;
    if (q.key === "loan_needed") {
      value = answers.loan_needed
        ? "Considering or planning a loan"
        : "Other funding / not planning a loan";
    } else if (q.key === "target_country") {
      const c = parseTargetCountries(answers.target_country);
      value = c.length ? c.join(", ") : "—";
    } else {
      value = String(answers[q.key] ?? "—");
    }
    return { title: q.question.replace(/\s*\(.*\)\s*$/, ""), value, step: q.step };
  });

  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
          Almost there
        </p>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Meet the profile you just shaped
        </h2>
        <p className="text-sm text-muted-foreground">
          A quick flip-book before we personalize your GradRight Score — same voice as discovery, now in recap
          form.
        </p>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((card, i) => (
          <motion.div
            key={card.step}
            initial={{ opacity: 0, rotateY: -8 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="snap-center shrink-0"
            style={{ perspective: 1200 }}
          >
            <div
              className="flex h-[200px] w-[260px] flex-col justify-between rounded-2xl border-2 border-brand-primary/20 bg-gradient-to-br from-brand-primary/12 via-card to-violet-500/10 p-5 shadow-lg shadow-brand-primary/10 md:h-[220px] md:w-[280px]"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-secondary">
                <Sparkles className="size-3.5" />
                Card {i + 1} / {cards.length}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-lg font-semibold leading-snug text-foreground">
                  {card.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          className="h-12 w-full max-w-md bg-brand-primary text-base font-semibold text-white shadow-md shadow-brand-primary/25 hover:bg-brand-primary/90"
          onClick={() => nextStep()}
        >
          Looks good — continue
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Next: a short consent, then your personalized snapshot.
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit gap-2 self-center text-muted-foreground"
        onClick={() => prevStep()}
      >
        <ArrowLeft className="size-4" />
        Back to edit answers
      </Button>
    </div>
  );
}
