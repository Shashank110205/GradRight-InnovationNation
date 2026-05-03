"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/components/shared/AppProviders";
import { safeNextPath } from "@/lib/auth/safe-next-path";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

const studentOrigin =
  process.env.NEXT_PUBLIC_STUDENT_ORIGIN?.replace(/\/$/, "") ||
  "http://localhost:3000";

const NBFC_DEFAULT = "/nbfc/applications";

/** Only same-origin NBFC console paths — student `next` must not bounce NBFC logins. */
function safeNbfcPostLoginPath(raw: string | null): string {
  const candidate = safeNextPath(raw, NBFC_DEFAULT);
  if (candidate.startsWith("/nbfc")) {
    return candidate;
  }
  return NBFC_DEFAULT;
}

export function PartnerLoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    /**
     * Backfill the `public.users` row + role for accounts created via the
     * email-confirmation flow (where signup never reached this endpoint
     * because `auth.signUp` returned `session = null`). Idempotent on the
     * server. Also lets us surface a real error when the signed-in account
     * is not authorized for the partner portal, instead of silently bouncing
     * through middleware back to /sign-in.
     */
    let role: string | null = null;
    try {
      const ensureRes = await fetch("/api/auth/complete-partner-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const ensureJson = (await ensureRes.json().catch(() => null)) as {
        success?: boolean;
        data?: { role?: string };
        error?: string;
      } | null;

      if (!ensureRes.ok) {
        await supabase.auth.signOut();
        setAuthError(
          ensureJson?.error ??
            "Could not initialize partner session. Ask an admin to provision your NBFC supervisor account."
        );
        return;
      }
      role = ensureJson?.data?.role ?? null;
    } catch (e) {
      console.error("[partner-login] ensure role", e);
      await supabase.auth.signOut();
      setAuthError(
        "Could not reach the partner authentication service. Try again."
      );
      return;
    }

    if (role !== "nbfc_supervisor") {
      await supabase.auth.signOut();
      setAuthError(
        "This account is not authorized for the partner portal. Use the GradRight student portal for student accounts, or contact your admin to provision NBFC supervisor access."
      );
      return;
    }

    const dest = safeNbfcPostLoginPath(searchParams.get("next"));
    router.push(dest);
    router.refresh();
  }

  return (
    <Card className="border-slate-200 bg-white/95 shadow-lg dark:border-slate-800 dark:bg-slate-900/90">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Poonawalla Fincorp · GradRight Insights
        </p>
        <CardTitle className="font-heading text-2xl text-slate-900 dark:text-slate-50">
          Partner sign-in
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Credit and partnership teams: review loan leads, placement outlook, and
          documents students have consented to share. Access is limited to approved
          supervisor accounts (separate from student GradRight logins).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {authError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not sign in</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="partner-email">Work email</Label>
            <Input
              id="partner-email"
              type="email"
              autoComplete="username"
              aria-invalid={!!errors.email}
              {...register("email")}
              className="border-slate-300 dark:border-slate-600"
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-password">Password</Label>
            <Input
              id="partner-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
              className="border-slate-300 dark:border-slate-600"
            />
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in to console"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Need partner access?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">
          Student or parent?{" "}
          <Link
            href={`${studentOrigin}/sign-in`}
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Open the GradRight student portal
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
