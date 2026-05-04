"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StepKey =
  | "greet"
  | "resume"
  | "aspiration"
  | "country"
  | "priority"
  | "dream";

const PRIORITIES = [
  { id: "prestige", label: "Prestige" },
  { id: "salary", label: "Salary" },
  { id: "scholarship", label: "Scholarship" },
  { id: "affordability", label: "Affordability" },
  { id: "fastest_placement", label: "Fastest placement" },
] as const;

const STEPS: { key: StepKey; title: string; question: string }[] = [
  {
    key: "greet",
    title: "Let’s personalize GradRight",
    question: "Hi, I’d like to understand your ambition better.",
  },
  {
    key: "resume",
    title: "Resume",
    question: "Upload your resume so I can understand your strengths.",
  },
  {
    key: "aspiration",
    title: "Ambition",
    question: "Where do you want to be in 5 years?",
  },
  {
    key: "country",
    title: "Destinations",
    question: "Which countries or regions excite you most?",
  },
  {
    key: "priority",
    title: "Priority",
    question: "What matters most right now?",
  },
  {
    key: "dream",
    title: "Dream role",
    question: "What kind of role or career are you aiming for?",
  },
];

async function postCoach(input: {
  step: StepKey;
  prior_question: string;
  user_message: string;
}): Promise<{ advance: boolean; assistant_message?: string }> {
  const res = await fetch("/api/ai/profile-coach", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { advance?: boolean; assistant_message?: string };
  };
  if (!res.ok || !json.success || !json.data) {
    return { advance: true };
  }
  return {
    advance: Boolean(json.data.advance),
    assistant_message: json.data.assistant_message,
  };
}

export function ProfileIntelligenceUpgrade() {
  const [ix, setIx] = useState(0);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fiveYear, setFiveYear] = useState("");
  const [aspirationExtra, setAspirationExtra] = useState("");
  const [regions, setRegions] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [dreamRole, setDreamRole] = useState("");
  const [coachHint, setCoachHint] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const step = STEPS[ix] ?? STEPS[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/dashboard-brief");
        const json = (await res.json()) as {
          success?: boolean;
          data?: { profile?: Record<string, unknown> | null };
        };
        if (!res.ok || !json.success || !json.data?.profile || cancelled) return;
        const p = json.data.profile;
        const fy = typeof p.five_year_goal === "string" ? p.five_year_goal : "";
        const asp = typeof p.aspiration_text === "string" ? p.aspiration_text : "";
        const reg = typeof p.target_country === "string" ? p.target_country : "";
        const dr = typeof p.dream_role === "string" ? p.dream_role : "";
        const pri = typeof p.scholarship_priority === "string" ? p.scholarship_priority : null;
        const rurl = typeof p.resume_file_url === "string" ? p.resume_file_url : "";
        if (fy.trim()) setFiveYear(fy);
        if (asp.trim()) setAspirationExtra(asp);
        if (reg.trim()) setRegions(reg);
        if (dr.trim()) setDreamRole(dr);
        if (pri && PRIORITIES.some((x) => x.id === pri)) setPriority(pri);
        if (rurl.includes("profile-resumes/") && !rurl.includes("..")) {
          setResumePath(rurl);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goNext = useCallback(() => {
    setCoachHint(null);
    setIx((v) => Math.min(v + 1, STEPS.length - 1));
  }, []);

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/user/profile-resume", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { storage_path?: string };
        error?: string;
      };
      if (!res.ok || !json.success || !json.data?.storage_path) {
        setMessage(json.error ?? "Upload failed — try a smaller PDF or TXT.");
        return;
      }
      setResumePath(json.data.storage_path);
      setMessage("Resume saved — we’ll parse it when you finish.");
    } catch {
      setMessage("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const maybeCoachAndAdvance = async (opts: {
    nextIndex: number;
    prior_question: string;
    user_message: string;
    stepKey: StepKey;
    allowEmpty?: boolean;
  }) => {
    if (opts.allowEmpty && !opts.user_message.trim()) {
      setIx(opts.nextIndex);
      setCoachHint(null);
      return;
    }
    if (!opts.user_message.trim()) {
      setCoachHint("Add a short answer, or use Skip for now below.");
      return;
    }
    const out = await postCoach({
      step: opts.stepKey,
      prior_question: opts.prior_question,
      user_message: opts.user_message,
    });
    if (out.assistant_message) {
      setCoachHint(out.assistant_message);
    }
    if (out.advance) {
      setCoachHint(null);
      setIx(opts.nextIndex);
    }
  };

  const finalize = async () => {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile-enrich", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          five_year_goal: fiveYear.trim() || null,
          aspiration_text: aspirationExtra.trim() || null,
          regions_text: regions.trim() || null,
          scholarship_priority: priority,
          dream_role: dreamRole.trim() || null,
          resume_storage_path: resumePath,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { engine?: { profile_completeness_score?: number } };
      };
      if (!res.ok || !json.success) {
        setStatus("error");
        setMessage(json.error ?? "Could not save profile intelligence.");
        return;
      }
      setStatus("done");
      const score = json.data?.engine?.profile_completeness_score;
      setMessage(
        score != null
          ? `Profile intelligence saved. Completeness about ${score}% — GradRight will adapt across your hub.`
          : "Profile intelligence saved — GradRight will adapt across your hub."
      );
    } catch {
      setStatus("error");
      setMessage("Network error — try again shortly.");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-16 pt-4 md:max-w-xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Profile intelligence
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight md:text-4xl">
          GradRight is learning about you
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          One enriched profile powers your dashboard, Explore, Plan, and Funding
          — without repeating the same story everywhere.
        </p>
      </div>

      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= ix ? "bg-gradient-to-r from-brand-primary to-brand-secondary" : "bg-muted"
            )}
            aria-hidden
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <GlassCard className="border-brand-primary/20 p-6 md:p-8">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-md">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {step.title}
                </p>
                <h2 className="mt-1 font-heading text-lg font-semibold leading-snug md:text-xl">
                  {step.question}
                </h2>
              </div>
            </div>

            {coachHint ? (
              <p className="mb-4 rounded-xl border border-brand-primary/25 bg-brand-soft px-4 py-3 text-sm leading-relaxed text-foreground">
                {coachHint}
              </p>
            ) : null}

            {step.key === "greet" ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                A few quick cards — conversational, not a long form. You can skip
                anything that does not feel relevant yet.
              </p>
            ) : null}

            {step.key === "resume" ? (
              <div className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center transition hover:border-brand-primary/50 hover:bg-muted/30">
                  <UploadCloud className="h-8 w-8 text-brand-primary" aria-hidden />
                  <span className="text-sm font-medium text-foreground">
                    {uploading ? "Uploading…" : "Tap to upload PDF, DOCX, or TXT"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {resumePath ? `Linked: ${resumePath.split("/").pop()}` : "Optional — skip if you prefer"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,application/pdf"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            ) : null}

            {step.key === "aspiration" ? (
              <div className="space-y-4">
                <textarea
                  className="min-h-[100px] w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-2.5 text-sm outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  placeholder="e.g. Staff PM in the US at a product company with global impact…"
                  value={fiveYear}
                  onChange={(e) => setFiveYear(e.target.value)}
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Optional nuance
                  </p>
                  <textarea
                    className="mt-1 min-h-[72px] w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    placeholder="Scholarship-first, ROI-aware, pivot from consulting…"
                    value={aspirationExtra}
                    onChange={(e) => setAspirationExtra(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {step.key === "country" ? (
              <textarea
                className="min-h-[100px] w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="e.g. United States (MS CS), backup Canada…"
                value={regions}
                onChange={(e) => setRegions(e.target.value)}
              />
            ) : null}

            {step.key === "priority" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                      priority === p.id
                        ? "border-brand-primary bg-brand-soft text-foreground shadow-sm"
                        : "border-border/80 bg-card/60 hover:border-brand-primary/40"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ) : null}

            {step.key === "dream" ? (
              <textarea
                className="min-h-[100px] w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="e.g. Product manager for ML platform teams…"
                value={dreamRole}
                onChange={(e) => setDreamRole(e.target.value)}
              />
            ) : null}

            {message && status !== "idle" ? (
              <p
                className={cn(
                  "mt-4 text-sm",
                  status === "error"
                    ? "text-destructive"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {message}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {step.key === "greet" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 text-white shadow-elegant hover:opacity-95"
                  )}
                >
                  Let&apos;s begin
                </button>
              ) : null}

              {step.key === "resume" ? (
                <>
                  <button
                    type="button"
                    onClick={goNext}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 text-white shadow-elegant hover:opacity-95"
                    )}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
                  >
                    Skip for now
                  </button>
                </>
              ) : null}

              {step.key === "aspiration" ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void maybeCoachAndAdvance({
                        nextIndex: ix + 1,
                        prior_question: step.question,
                        user_message: `${fiveYear}\n${aspirationExtra}`,
                        stepKey: "aspiration",
                        allowEmpty: true,
                      })
                    }
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 text-white shadow-elegant hover:opacity-95"
                    )}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
                  >
                    Skip for now
                  </button>
                </>
              ) : null}

              {step.key === "country" ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void maybeCoachAndAdvance({
                        nextIndex: ix + 1,
                        prior_question: step.question,
                        user_message: regions,
                        stepKey: "country",
                        allowEmpty: true,
                      })
                    }
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 text-white shadow-elegant hover:opacity-95"
                    )}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
                  >
                    Skip for now
                  </button>
                </>
              ) : null}

              {step.key === "priority" ? (
                <>
                  <button
                    type="button"
                    disabled={!priority}
                    onClick={goNext}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 text-white shadow-elegant hover:opacity-95 disabled:opacity-50"
                    )}
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(null);
                      goNext();
                    }}
                    className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
                  >
                    Skip for now
                  </button>
                </>
              ) : null}

              {step.key === "dream" ? (
                <>
                  <button
                    type="button"
                    disabled={status === "saving"}
                    onClick={async () => {
                      if (dreamRole.trim()) {
                        const out = await postCoach({
                          step: "dream",
                          prior_question: step.question,
                          user_message: dreamRole,
                        });
                        if (!out.advance) {
                          setCoachHint(
                            out.assistant_message ??
                              "I want to make sure I understand your profile accurately first — could you answer the previous question?"
                          );
                          return;
                        }
                      }
                      await finalize();
                    }}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary px-8 text-white shadow-elegant hover:opacity-95 disabled:opacity-50"
                    )}
                  >
                    {status === "saving" ? "Saving…" : "Finish & save"}
                  </button>
                  <button
                    type="button"
                    disabled={status === "saving"}
                    onClick={() => void finalize()}
                    className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
                  >
                    Save without dream role
                  </button>
                </>
              ) : null}
            </div>

            {status === "done" ? (
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                You&apos;re set — head back to the dashboard to see personalized
                signals update.
              </div>
            ) : null}
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
