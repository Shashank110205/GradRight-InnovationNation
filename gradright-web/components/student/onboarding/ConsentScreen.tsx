"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ConsentScreen() {
  const [checked, setChecked] = useState(false);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const submitOnboarding = useOnboardingStore((s) => s.submitOnboarding);
  const isLoading = useOnboardingStore((s) => s.isLoading);
  const error = useOnboardingStore((s) => s.error);

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -28 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full max-w-lg flex-col gap-6"
    >
      <GlassCard gradient className="p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
          Before your score
        </p>
        <h2 className="text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
          How we use your answers
        </h2>
        <p className="text-sm text-muted-foreground">
          We need your consent to personalize your GradRight Score and
          dashboard.
        </p>
      </div>

      <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-foreground marker:text-brand-primary">
        <li>
          We collect your study plans, field, budget, and loan intent to model
          placement and financing signals.
        </li>
        <li>
          Data is used to show matches, salary ranges, and eligibility hints —
          not sold to third parties for unrelated marketing.
        </li>
        <li>
          AI assists with explanations and copy; it does not auto-approve loans
          or replace lender decisions.
        </li>
      </ul>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-start gap-3 rounded-xl border border-muted bg-card/50 p-4">
        <Checkbox
          id="consent"
          checked={checked}
          onCheckedChange={(v) => setChecked(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="consent" className="cursor-pointer text-sm leading-snug">
          I consent to GradRight processing my information as described above
        </Label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          className="h-11 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary font-semibold text-white shadow-elegant hover:opacity-95"
          disabled={!checked || isLoading}
          onClick={() => submitOnboarding()}
        >
          {isLoading ? "Building your score…" : "Get My GradRight Score"}
        </Button>
      </div>
      </GlassCard>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit gap-2 self-center text-muted-foreground"
        onClick={() => prevStep()}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>
    </motion.div>
  );
}
