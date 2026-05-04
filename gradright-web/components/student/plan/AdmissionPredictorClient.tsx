"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel";
import { GlassCard } from "@/components/shell/GlassCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ONBOARDING_QUESTIONS } from "@/lib/types";
import type { APIResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

import type { AdmissionPredictorResponse } from "@/lib/validations/plan";

const DEGREE_OPTIONS = ONBOARDING_QUESTIONS.find((q) => q.key === "degree_type")
  ?.options as readonly string[];

const COUNTRY_OPTIONS = ONBOARDING_QUESTIONS.find((q) => q.key === "target_country")
  ?.options as readonly string[];

const R = 52;
const C = 2 * Math.PI * R;

function ProbabilityRing({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const offset = C - (pct / 100) * C;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative grid size-[160px] place-items-center sm:size-[180px]">
        <svg
          width={160}
          height={160}
          viewBox="0 0 120 120"
          className="-rotate-90 text-muted/35 sm:size-[180px]"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="url(#admission-ring-grad)"
            strokeWidth={8}
            strokeLinecap="round"
            style={{
              strokeDasharray: C,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          <defs>
            <linearGradient id="admission-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="55%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
            {pct}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Modeled chance
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="size-40 rounded-full sm:size-44" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <GlassCard key={i} className="p-4">
            <Skeleton className="mb-3 h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-4/5" />
          </GlassCard>
        ))}
      </div>
      <GlassCard className="p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
      </GlassCard>
    </div>
  );
}

export function AdmissionPredictorClient() {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<AdmissionPredictorResponse | null>(null);

  const [cgpa, setCgpa] = useState("");
  const [degree, setDegree] = useState(DEGREE_OPTIONS[0] ?? "");
  const [graduationYear, setGraduationYear] = useState("2026");

  const [gre, setGre] = useState("");
  const [gmat, setGmat] = useState("");
  const [ielts, setIelts] = useState("");
  const [toefl, setToefl] = useState("");

  const [country, setCountry] = useState(COUNTRY_OPTIONS[0] ?? "United States");
  const [uni1, setUni1] = useState("");
  const [uni2, setUni2] = useState("");
  const [uni3, setUni3] = useState("");
  const [course, setCourse] = useState("");
  const [workYrs, setWorkYrs] = useState("0");
  const [pubs, setPubs] = useState("0");
  const [extras, setExtras] = useState("0");

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => String(y + i));
  }, []);

  const primaryUniLabel = useMemo(() => {
    return [uni1, uni2, uni3].map((s) => s.trim()).filter(Boolean)[0] ?? "your target";
  }, [uni1, uni2, uni3]);

  function parseNum(s: string): number | undefined {
    const t = s.trim();
    if (t === "") return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  }

  function buildBody() {
    const cgpaNum = Number(cgpa);
    const targetUniversity = [uni1, uni2, uni3]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" | ");

    return {
      cgpa: cgpaNum,
      degree,
      targetUniversity,
      targetCourse: course.trim(),
      country,
      testScores: {
        gre: parseNum(gre),
        gmat: parseNum(gmat),
        ielts: parseNum(ielts),
        toefl: parseNum(toefl),
      },
      workExperienceYears: Math.min(80, Math.max(0, Number(workYrs) || 0)),
      publications: Math.min(500, Math.max(0, Number(pubs) || 0)),
      extracurriculars: Math.min(500, Math.max(0, Number(extras) || 0)),
    };
  }

  async function onSubmit() {
    const body = buildBody();
    if (
      body.cgpa < 0 ||
      body.cgpa > 10 ||
      Number.isNaN(body.cgpa) ||
      !body.targetUniversity ||
      !body.targetCourse
    ) {
      setErr("Enter CGPA (0–10), at least one target university, and your course.");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/plan/admission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as APIResponse<AdmissionPredictorResponse>;
      if (!json.success || !json.data) {
        throw new Error(json.error || "Could not run admission predictor");
      }
      setResult(json.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  const stepValid =
    step === 1
      ? cgpa.trim() !== "" && degree && graduationYear
      : step === 2
        ? true
        : country && course.trim() !== "" && [uni1, uni2, uni3].some((u) => u.trim());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Admission predictor
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Rule-engine estimate plus a short AI summary—use alongside official admissions data.
        </p>
      </div>

      {!result && !busy && (
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStep(n)}
                className={cn(
                  "h-2 flex-1 rounded-full transition",
                  step >= n ? "bg-brand-primary" : "bg-muted"
                )}
                aria-label={`Step ${n}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cgpa">CGPA (0–10)</Label>
                <Input
                  id="cgpa"
                  inputMode="decimal"
                  placeholder="e.g. 8.2"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree">Degree type</Label>
                <select
                  id="degree"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                >
                  {DEGREE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grad-year">Graduation year</Label>
                <select
                  id="grad-year"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground sm:col-span-2">
                All optional—leave blank if not taken yet.
              </p>
              <div className="space-y-2">
                <Label htmlFor="gre">GRE (260–340)</Label>
                <Input
                  id="gre"
                  inputMode="numeric"
                  placeholder="Optional"
                  value={gre}
                  onChange={(e) => setGre(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gmat">GMAT (200–805)</Label>
                <Input
                  id="gmat"
                  inputMode="numeric"
                  placeholder="Optional"
                  value={gmat}
                  onChange={(e) => setGmat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ielts">IELTS (0–9)</Label>
                <Input
                  id="ielts"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={ielts}
                  onChange={(e) => setIelts(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toefl">TOEFL iBT (0–120)</Label>
                <Input
                  id="toefl"
                  inputMode="numeric"
                  placeholder="Optional"
                  value={toefl}
                  onChange={(e) => setToefl(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="u1">Target university 1</Label>
                  <Input
                    id="u1"
                    placeholder="Primary target"
                    value={uni1}
                    onChange={(e) => setUni1(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="u2">Target university 2</Label>
                  <Input
                    id="u2"
                    placeholder="Optional"
                    value={uni2}
                    onChange={(e) => setUni2(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="u3">Target university 3</Label>
                  <Input
                    id="u3"
                    placeholder="Optional"
                    value={uni3}
                    onChange={(e) => setUni3(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Target course / program</Label>
                <Input
                  id="course"
                  placeholder="e.g. MS Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="work">Work experience (years)</Label>
                  <Input
                    id="work"
                    inputMode="decimal"
                    value={workYrs}
                    onChange={(e) => setWorkYrs(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pubs">Publications (count)</Label>
                  <Input
                    id="pubs"
                    inputMode="numeric"
                    value={pubs}
                    onChange={(e) => setPubs(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extras">Extracurriculars (count)</Label>
                  <Input
                    id="extras"
                    inputMode="numeric"
                    value={extras}
                    onChange={(e) => setExtras(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {err && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1 || busy}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </Button>
            <div className="flex gap-2 sm:ml-auto">
              {step < 3 ? (
                <Button
                  type="button"
                  disabled={!stepValid || busy}
                  onClick={() => setStep((s) => Math.min(3, s + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button type="button" disabled={!stepValid || busy} onClick={onSubmit}>
                  {busy ? "Calculating…" : "See results"}
                </Button>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {busy && (
        <GlassCard gradient className="p-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Running predictor…
          </p>
          <ResultsSkeleton />
        </GlassCard>
      )}

      {result && !busy && (
        <div className="space-y-6">
          <GlassCard gradient className="p-6 sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <ProbabilityRing value={result.admissionProbability} />
              </div>
              <div className="grid flex-1 gap-4 md:grid-cols-3">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Safety schools
                  </h3>
                  <ul className="space-y-2 text-sm leading-snug">
                    {result.safetySchools.map((s, i) => (
                      <li
                        key={`s-${i}`}
                        className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Match schools
                  </h3>
                  <ul className="space-y-2 text-sm leading-snug">
                    {result.matchSchools.map((s, i) => (
                      <li
                        key={`m-${i}`}
                        className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reach schools
                  </h3>
                  <ul className="space-y-2 text-sm leading-snug">
                    {result.reachSchools.map((s, i) => (
                      <li
                        key={`r-${i}`}
                        className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <blockquote className="rounded-xl border border-white/10 bg-background/30 px-4 py-3 text-sm italic leading-relaxed text-foreground">
                {result.aiSummary}
              </blockquote>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Strengths
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyStrengths.map((t, i) => (
                      <span
                        key={`st-${i}`}
                        className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-900 dark:text-emerald-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Growth unlocks
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyWeaknesses.map((t, i) => (
                      <span
                        key={`wk-${i}`}
                        className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-950 dark:text-amber-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setResult(null)}>
                Edit inputs
              </Button>
              <Link
                href="/funding"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "bg-brand-primary text-white hover:bg-brand-primary/90"
                )}
              >
                Build a calm funding plan
              </Link>
            </div>
          </GlassCard>

          <ExplainabilityPanel
            resultLabel="Modeled admission chance"
            resultSummary={`About ${result.admissionProbability}% modeled alignment for ${primaryUniLabel} — illustrative, not a guarantee.`}
            whyPoints={[
              "Combines your academic inputs, tests, work/research signals, and how aggressive your target list is versus typical benchmarks.",
              ...result.keyStrengths.slice(0, 3).map((s) => `Strength signal: ${s}`),
            ]}
            improvePoints={[
              ...result.keyWeaknesses.slice(0, 4).map((w) => `Growth unlock: ${w}`),
              "Add verified profile details (score upgrade) to tighten confidence bands.",
            ]}
            nextStepHref="/dashboard/score-upgrade"
            nextStepLabel="Improve prediction inputs"
            askExplainSeed={`I'm seeing about ${result.admissionProbability}% on the admission predictor for ${primaryUniLabel}. Walk me through what inputs usually move this number and what the model can't see.`}
            askChallengeSeed={`From a strategic perspective on my ${result.admissionProbability}% outlook for ${primaryUniLabel}: what would change this estimate most, and where should I stay humble?`}
          />
        </div>
      )}
    </div>
  );
}
