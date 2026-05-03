import { Suspense } from "react";

import { SignUpForm } from "@/components/student/auth/SignUpForm";
import { PartnerSignupForm } from "@/components/partner/partner-signup-form";
import { isNbfcPortalInstance } from "@/lib/portal-mode";

function SignUpFallback() {
  return (
    <div
      className="glass-strong h-72 w-full max-w-md animate-pulse rounded-3xl border border-border/60"
      aria-hidden
    />
  );
}

function PartnerSignupFallback() {
  return (
    <div
      className="h-72 w-full max-w-md animate-pulse rounded-xl border border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/50"
      aria-hidden
    />
  );
}

export default function SignUpPage() {
  if (isNbfcPortalInstance()) {
    return (
      <Suspense fallback={<PartnerSignupFallback />}>
        <PartnerSignupForm />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpForm />
    </Suspense>
  );
}
