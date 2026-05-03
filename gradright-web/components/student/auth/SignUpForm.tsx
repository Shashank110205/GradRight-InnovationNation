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

const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .max(120, "Name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignUpForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const nextQuery = searchParams.get("next");
  const signInHref = nextQuery
    ? `/sign-in?next=${encodeURIComponent(nextQuery)}`
    : "/sign-in";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setAuthError(null);
    setAuthInfo(null);

    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: values.fullName.trim(),
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setAuthInfo(
      "Account created. Check your email to confirm your address, then sign in."
    );
  }

  return (
    <Card className="glass-strong border-border/70 shadow-elegant">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Create your account</CardTitle>
        <CardDescription>
          Free sign-up — then we&apos;ll build your personalized GradScore and
          dashboard. Already registered?{" "}
          <Link
            href={signInHref}
            className="font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            Log in
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {authError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not sign up</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          ) : null}

          {authInfo ? (
            <Alert>
              <AlertTitle>Almost there</AlertTitle>
              <AlertDescription>{authInfo}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input
              id="signup-name"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
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
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Confirm password</Label>
            <Input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-brand-primary text-white hover:bg-brand-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account & see my score"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t-0 pt-0">
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-brand-primary underline-offset-4 hover:underline">
            ← Back to home
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
