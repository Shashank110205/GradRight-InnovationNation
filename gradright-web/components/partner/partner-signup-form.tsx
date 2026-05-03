"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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

const schema = z
  .object({
    organizationName: z.string().min(1, "Organization name is required").max(200),
    contactName: z.string().min(1, "Contact name is required").max(120),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid work email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const studentOrigin =
  process.env.NEXT_PUBLIC_STUDENT_ORIGIN?.replace(/\/$/, "") ||
  "http://localhost:3000";

export function PartnerSignupForm() {
  const supabase = useSupabase();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: "",
      contactName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setAuthError(null);
    setAuthInfo(null);

    const displayName = `${values.contactName.trim()} · ${values.organizationName.trim()}`;

    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    if (!data.session) {
      setAuthInfo(
        "Account created. Confirm via the link in your inbox, then sign in here on this host (port 3001). Your partner role is applied automatically on first sign-in when ALLOW_NBFC_SELF_SIGNUP=true."
      );
      return;
    }

    const completeRes = await fetch("/api/auth/complete-partner-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName: values.organizationName.trim(),
        contactName: values.contactName.trim(),
      }),
    });

    const completeJson = (await completeRes.json().catch(() => null)) as {
      success?: boolean;
      data?: { role?: string };
      error?: string;
    } | null;

    if (
      !completeRes.ok ||
      !completeJson?.success ||
      completeJson?.data?.role !== "nbfc_supervisor"
    ) {
      setAuthError(
        completeJson?.error ??
          "Signed up but could not activate partner access. Set ALLOW_NBFC_SELF_SIGNUP=true for local signup, or ask an admin for an NBFC account."
      );
      return;
    }

    window.location.assign("/nbfc/applications");
  }

  return (
    <Card className="border-slate-200 bg-white/95 shadow-lg dark:border-slate-800 dark:bg-slate-900/90">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Poonawalla Fincorp · GradRight Insights
        </p>
        <CardTitle className="font-heading text-2xl text-slate-900 dark:text-slate-50">
          Create partner access
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          For credit and partnership teams only — separate from student GradRight
          accounts. Use your official work email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {authError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not complete signup</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          ) : null}

          {authInfo ? (
            <Alert>
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>{authInfo}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="partner-org">Organization</Label>
            <Input
              id="partner-org"
              type="text"
              autoComplete="organization"
              aria-invalid={!!errors.organizationName}
              {...register("organizationName")}
              className="border-slate-300 dark:border-slate-600"
            />
            {errors.organizationName ? (
              <p className="text-sm text-destructive">
                {errors.organizationName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-contact">Your name</Label>
            <Input
              id="partner-contact"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.contactName}
              {...register("contactName")}
              className="border-slate-300 dark:border-slate-600"
            />
            {errors.contactName ? (
              <p className="text-sm text-destructive">
                {errors.contactName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-signup-email">Work email</Label>
            <Input
              id="partner-signup-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
              className="border-slate-300 dark:border-slate-600"
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-signup-password">Password</Label>
            <Input
              id="partner-signup-password"
              type="password"
              autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="partner-signup-confirm">Confirm password</Label>
            <Input
              id="partner-signup-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
              className="border-slate-300 dark:border-slate-600"
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create partner account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have access?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Student or parent?{" "}
          <Link
            href={`${studentOrigin}/sign-up`}
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            GradRight student sign-up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
