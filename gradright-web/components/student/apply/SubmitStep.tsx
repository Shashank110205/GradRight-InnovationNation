"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useApplicationStore } from "@/stores/application-store";

export function SubmitStep() {
  const submitApplication = useApplicationStore((s) => s.submitApplication);
  const setConsentAccepted = useApplicationStore((s) => s.setConsentAccepted);
  const consentAccepted = useApplicationStore((s) => s.consentAccepted);
  const saving = useApplicationStore((s) => s.saving);
  const error = useApplicationStore((s) => s.error);

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold">Submit application</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Final step. Confirm consent and submit to begin partner credit review.
      </p>

      <p className="text-sm text-muted-foreground border border-border rounded-md p-3 mt-4">
        Your application will be reviewed by a trained credit officer from our
        lending partner. This is not an automated loan approval. Your data is
        encrypted and shared only with your explicit consent. You can withdraw
        your application at any time before a decision is made.
      </p>

      <div className="mt-4 flex items-start gap-2">
        <Checkbox
          id="consent"
          checked={consentAccepted}
          onCheckedChange={(v) => setConsentAccepted(v === true)}
        />
        <Label htmlFor="consent" className="font-normal leading-snug">
          I understand this is not an automated approval, and I consent to
          sharing my details with the lending partner for credit assessment.
        </Label>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          disabled={saving || !consentAccepted}
          onClick={() => void submitApplication()}
        >
          Submit to Poonawalla team
        </Button>
      </div>
    </GlassCard>
  );
}
