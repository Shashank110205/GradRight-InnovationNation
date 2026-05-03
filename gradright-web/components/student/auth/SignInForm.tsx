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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/components/shared/AppProviders";
import { destinationAfterSignIn } from "@/lib/auth/student-journey-destinations";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function SignInForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    const flowRes = await fetch("/api/user/session-flow");
    const flow = (await flowRes.json()) as {
      authenticated?: boolean;
      role?: string | null;
      onboarding_complete?: boolean;
      wow_completed?: boolean;
    };

    if (!flowRes.ok || !flow.authenticated) {
      router.push("/");
      router.refresh();
      return;
    }

    const dest = destinationAfterSignIn(
      {
        role: flow.role,
        onboarding_complete: Boolean(flow.onboarding_complete),
        wow_completed: Boolean(flow.wow_completed),
      },
      searchParams.get("next"),
      "/dashboard"
    );
    router.push(dest);
    router.refresh();
  }

  const nextParam = searchParams.get("next");
  const signUpHref = nextParam
    ? `/sign-up?next=${encodeURIComponent(nextParam)}`
    : "/sign-up";

  return (
    <Card className="glass-strong border-border/70 shadow-elegant">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue your Grad path — or{" "}
          <Link
            href={signUpHref}
            className="font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            create an account
          </Link>{" "}
          to see your score.
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
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-brand-primary text-white hover:bg-brand-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t-0 pt-0">
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href={signUpHref}
            className="font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            Sign up for your GradScore
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Poonawalla / partner credit team?{" "}
          <Link
            href={`${(process.env.NEXT_PUBLIC_NBFC_ORIGIN ?? "http://localhost:3001").replace(/\/$/, "")}/sign-in`}
            className="font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            Use the GradRight Insights sign-in
          </Link>{" "}
          (separate work accounts).
        </p>
      </CardFooter>
    </Card>
  );
}
