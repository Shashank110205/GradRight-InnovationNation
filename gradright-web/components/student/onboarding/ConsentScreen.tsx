"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";

import { ONBOARDING_EASE } from "@/lib/onboarding/motion-timing";
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
      transition={{ duration: 0.38, ease: ONBOARDING_EASE }}
      className="flex w-full max-w-lg flex-col gap-6"
    >
      <GlassCard gradient className="p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Final step before your score
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
            Trust, then reveal
          </p>
          <h2 className="text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
            How we use what you shared
          </h2>
          <p className="text-sm text-muted-foreground">
            Your consent lets us personalize your GradRight Score and dashboard with the same premium tone you
            felt in discovery — transparent, strategic, never spammy.
          </p>
        </div>

        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-foreground marker:text-brand-primary">
          <li>
            We use your study plans, field, budget, and funding intent to model placement and financing signals —
            always as guidance, not a guarantee.
          </li>
          <li>
            Outputs stay in-product for your journey — not sold for unrelated third-party marketing.
          </li>
          <li>
            AI helps explain and narrate; it does not auto-approve loans or replace lender decisions.
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
          className="min-h-12 flex-1 touch-manipulation rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary text-base font-semibold text-white shadow-elegant hover:opacity-95"
          disabled={!checked || isLoading}
          onClick={() => submitOnboarding()}
        >
          {isLoading ? "Building your score…" : "Reveal My GradRight Score"}
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
