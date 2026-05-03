import { Suspense } from "react";

import { SignInForm } from "@/components/student/auth/SignInForm";
import { PartnerLoginForm } from "@/components/partner/partner-login-form";
import { isNbfcPortalInstance } from "@/lib/portal-mode";

function SignInFallback() {
  return (
    <div
      className="glass-strong h-64 w-full max-w-md animate-pulse rounded-3xl border border-border/60"
      aria-hidden
    />
  );
}

function PartnerLoginFallback() {
  return (
    <div
      className="h-64 w-full max-w-md animate-pulse rounded-xl border border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/50"
      aria-hidden
    />
  );
}

export default function SignInPage() {
  if (isNbfcPortalInstance()) {
    return (
      <Suspense fallback={<PartnerLoginFallback />}>
        <PartnerLoginForm />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
