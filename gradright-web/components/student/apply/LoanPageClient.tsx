"use client";

import { useEffect, useRef } from "react";

import { useAwardXP } from "@/hooks/useAwardXP";
import type { StudentProfile } from "@/lib/types";
import { useApplicationStore } from "@/stores/application-store";

import { AcademicDetailsForm } from "./AcademicDetailsForm";
import { DocumentChecklist } from "./DocumentChecklist";
import { DocumentUploadStep } from "./DocumentUploadStep";
import { FinancialDetailsForm } from "./FinancialDetailsForm";
import { LoanProgressBar } from "./LoanProgressBar";
import { PersonalDetailsForm } from "./PersonalDetailsForm";
import { ProgramDetailsForm } from "./ProgramDetailsForm";
import { ReviewStep } from "./ReviewStep";
import { SubmitStep } from "./SubmitStep";

export function LoanPageClient({
  profile,
  defaultFullName,
  defaultInstitute,
  defaultProgramHint,
  defaultLoanInr,
}: {
  profile: StudentProfile;
  defaultFullName: string;
  defaultInstitute: string;
  defaultProgramHint: string;
  defaultLoanInr: number;
}) {
  const { mutate: awardXP } = useAwardXP();
  const loanTabXpRef = useRef(false);
  const hydrated = useApplicationStore((s) => s.hydrated);
  const application = useApplicationStore((s) => s.application);
  const currentStep = useApplicationStore((s) => s.currentStep);
  const error = useApplicationStore((s) => s.error);

  useEffect(() => {
    void useApplicationStore.getState().loadOrCreateDraft();
  }, []);

  useEffect(() => {
    if (!hydrated || loanTabXpRef.current) return;
    loanTabXpRef.current = true;
    awardXP("loan_tab_opened");
  }, [hydrated, awardXP]);

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Loading your application…
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (application?.status === "submitted") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Application submitted
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you. A credit officer will review your file. You can keep using
          GradRight for career and financing prep while you wait.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <LoanProgressBar currentStep={currentStep} />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {currentStep === 0 ? <DocumentChecklist /> : null}
      {currentStep === 1 ? (
        <PersonalDetailsForm
          initial={application}
          defaultFullName={defaultFullName}
        />
      ) : null}
      {currentStep === 2 ? (
        <AcademicDetailsForm
          initial={application}
          defaultInstitute={defaultInstitute}
          defaultProgramHint={defaultProgramHint}
        />
      ) : null}
      {currentStep === 3 ? (
        <ProgramDetailsForm initial={application} profile={profile} />
      ) : null}
      {currentStep === 4 ? (
        <FinancialDetailsForm
          initial={application}
          defaultLoanInr={defaultLoanInr}
        />
      ) : null}
      {currentStep === 5 ? <DocumentUploadStep initial={application} /> : null}
      {currentStep === 6 ? <ReviewStep application={application} /> : null}
      {currentStep === 7 ? <SubmitStep /> : null}
    </div>
  );
}
