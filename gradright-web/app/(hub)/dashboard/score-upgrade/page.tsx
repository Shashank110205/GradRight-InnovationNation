"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const textAreaClass =
  "min-h-[88px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30";

export default function ScoreUpgradePage() {
  const [preferredUniversities, setPreferredUniversities] = useState("");
  const [budgetNotes, setBudgetNotes] = useState("");
  const [certifications, setCertifications] = useState("");
  const [resumeNotes, setResumeNotes] = useState("");
  const [targetGeography, setTargetGeography] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/user/score-upgrade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preferred_universities: preferredUniversities || undefined,
          budget_notes: budgetNotes || undefined,
          certifications: certifications || undefined,
          resume_notes: resumeNotes || undefined,
          target_geography: targetGeography || undefined,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setStatus("error");
        setMessage(json.error ?? "Could not save right now.");
        return;
      }
      setStatus("done");
      setMessage("Saved. Your next score refresh can use these signals as we connect deeper profiling.");
    } catch {
      setStatus("error");
      setMessage("Network error — try again in a moment.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12 pt-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Improve accuracy
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Deepen your profile — sharpen your GradScore
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Honest inputs here help us move from benchmark intelligence toward a score that feels unmistakably
          yours. No new questions in onboarding — just the details that matter for admits, placement, and
          financing.
        </p>
      </div>

      <GlassCard className="border-brand-primary/20 p-6 md:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-md">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">What we&apos;re collecting</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Short answers are enough for this MVP. You can paste lists or bullets — we&apos;ll structure
              richer flows later.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="universities">Preferred universities or programs</Label>
            <textarea
              id="universities"
              rows={3}
              value={preferredUniversities}
              onChange={(e) => setPreferredUniversities(e.target.value)}
              placeholder="e.g. reach / target / safe buckets, or program names"
              className={textAreaClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget & funding intent</Label>
            <textarea
              id="budget"
              rows={2}
              value={budgetNotes}
              onChange={(e) => setBudgetNotes(e.target.value)}
              placeholder="Scholarship plans, family support, loan comfort — whatever you're comfortable sharing"
              className={textAreaClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certs">Certifications & proofs of skill</Label>
            <Input
              id="certs"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder="e.g. AWS CCP, CFA prep, Kaggle, publications"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume">Resume highlights (text)</Label>
            <textarea
              id="resume"
              rows={3}
              value={resumeNotes}
              onChange={(e) => setResumeNotes(e.target.value)}
              placeholder="Impact bullets, internships, leadership — paste or summarize"
              className={textAreaClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="geo">Target geography nuance</Label>
            <Input
              id="geo"
              value={targetGeography}
              onChange={(e) => setTargetGeography(e.target.value)}
              placeholder="Cities, visa intent, domestic vs abroad emphasis"
            />
          </div>

          {message ? (
            <p
              className={cn(
                "text-sm",
                status === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={status === "saving"}
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 text-white shadow-elegant hover:opacity-95 disabled:opacity-60"
              )}
            >
              {status === "saving" ? "Saving…" : "Save enrichment"}
            </button>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
            >
              Skip for now
            </Link>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
