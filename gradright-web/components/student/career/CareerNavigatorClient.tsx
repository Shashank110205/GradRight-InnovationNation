"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { GlassCard } from "@/components/shell/GlassCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  CareerNavigatorPostBody,
  CareerNavigatorResponse,
} from "@/lib/validations/career-navigator";

const TARGET_FIELDS: CareerNavigatorPostBody["targetField"][] = [
  "Software/Tech",
  "Data Science",
  "Finance/MBA",
  "Healthcare",
  "Engineering",
  "Other",
];

const BUDGET_OPTIONS: CareerNavigatorPostBody["budgetRange"][] = [
  "Under 20L",
  "20-40L",
  "40-60L",
  "60L+",
];

const COUNTRY_OPTIONS = [
  "USA",
  "UK",
  "Canada",
  "Germany",
  "Australia",
] as const;

const FLAG: Record<string, string> = {
  USA: "🇺🇸",
  UK: "🇬🇧",
  Canada: "🇨🇦",
  Germany: "🇩🇪",
  Australia: "🇦🇺",
};

type ApiPayload = CareerNavigatorResponse & {
  _meta?: { source: "gemini" | "fallback" };
};

function difficultyStyles(d: CareerNavigatorResponse["topRecommendations"][0]["admissionDifficulty"]) {
  switch (d) {
    case "safety":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "match":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
    case "reach":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function visaStyles(v: CareerNavigatorResponse["topRecommendations"][0]["visaFriendliness"]) {
  switch (v) {
    case "high":
      return "bg-primary/10 text-primary";
    case "medium":
      return "bg-muted text-foreground";
    case "low":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted";
  }
}

function NavigatorSkeleton() {
  return (
    <div className="animate-in fade-in space-y-4 duration-300">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
      <GlassCard className="overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted/80" />
            <div className="h-4 w-52 animate-pulse rounded bg-muted/80" />
          </div>
          <div className="shrink-0 space-y-2 text-right">
            <div className="ml-auto h-14 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted/80" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/70" />
          ))}
        </div>
      </GlassCard>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted/70" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted/70" />
            <div className="mt-4 h-12 animate-pulse rounded-lg bg-muted/60" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export function CareerNavigatorClient() {
  const [currentDegree, setCurrentDegree] = useState("");
  const [currentCGPA, setCurrentCGPA] = useState(8);
  const [targetField, setTargetField] =
    useState<CareerNavigatorPostBody["targetField"]>("Software/Tech");
  const [budgetRange, setBudgetRange] =
    useState<CareerNavigatorPostBody["budgetRange"]>("20-40L");
  const [preferredCountries, setPreferredCountries] = useState<
    CareerNavigatorPostBody["preferredCountries"]
  >(["USA", "Canada"]);
  const [careerGoal, setCareerGoal] = useState("");
  const [workExperienceYears, setWorkExperienceYears] = useState(0);

  const [phase, setPhase] = useState<"form" | "loading" | "results">("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiPayload | null>(null);
  const hydratedFromProfile = useRef(false);

  const careerGoalLeft = useMemo(
    () => 200 - careerGoal.length,
    [careerGoal.length]
  );

  useEffect(() => {
    if (hydratedFromProfile.current) return;
    hydratedFromProfile.current = true;
    void (async () => {
      try {
        const [briefRes, hubRes] = await Promise.all([
          fetch("/api/user/dashboard-brief", { cache: "no-store", credentials: "include" }),
          fetch("/api/profile-hub", { cache: "no-store", credentials: "include" }),
        ]);
        const briefJson = (await briefRes.json()) as {
          success?: boolean;
          data?: { profile?: Record<string, unknown> | null };
        };
        const hubJson = (await hubRes.json()) as {
          success?: boolean;
          data?: { profile_hub?: Record<string, unknown> | null };
        };

        const p = briefJson.success ? briefJson.data?.profile ?? null : null;
        const ph = hubJson.success ? hubJson.data?.profile_hub ?? null : null;
        const pi = ph?.profile_intelligence as
          | {
              resume?: { cgpa?: number };
              goals?: { target_role?: string; domain?: string; five_year_goal?: string };
            }
          | undefined;

        if (p) {
          if (typeof p.degree_type === "string" && p.degree_type.trim()) {
            setCurrentDegree(p.degree_type.trim());
          }
          if (typeof p.cgpa === "number" && Number.isFinite(p.cgpa) && p.cgpa > 0) {
            setCurrentCGPA(Math.min(10, Math.max(5, p.cgpa)));
          } else if (typeof pi?.resume?.cgpa === "number" && Number.isFinite(pi.resume.cgpa)) {
            setCurrentCGPA(Math.min(10, Math.max(5, pi.resume.cgpa)));
          }
          if (typeof p.work_experience_years === "number" && Number.isFinite(p.work_experience_years)) {
            setWorkExperienceYears(Math.min(10, Math.max(0, Math.round(p.work_experience_years))));
          }
          if (typeof p.budget_band_usd === "string") {
            const b = p.budget_band_usd;
            if (b.includes("Under")) setBudgetRange("Under 20L");
            else if (b.includes("30,000") || b.includes("50,000")) setBudgetRange("20-40L");
            else if (b.includes("80,000")) setBudgetRange("40-60L");
            else if (b.includes("Above")) setBudgetRange("60L+");
          }
          if (typeof p.broad_field === "string" && p.broad_field.trim()) {
            const f = p.broad_field.toLowerCase();
            if (f.includes("computer") || f.includes("software")) setTargetField("Software/Tech");
            else if (f.includes("data") || f.includes("ai")) setTargetField("Data Science");
            else if (f.includes("business") || f.includes("mba") || f.includes("finance"))
              setTargetField("Finance/MBA");
            else if (f.includes("health")) setTargetField("Healthcare");
            else if (f.includes("engineer")) setTargetField("Engineering");
          }
          if (typeof p.target_country === "string" && p.target_country.trim()) {
            const tc = p.target_country.toLowerCase();
            const next: CareerNavigatorPostBody["preferredCountries"] = [];
            if (tc.includes("united states") || tc.includes("usa")) next.push("USA");
            if (tc.includes("uk") || tc.includes("united kingdom")) next.push("UK");
            if (tc.includes("canada")) next.push("Canada");
            if (tc.includes("germany")) next.push("Germany");
            if (tc.includes("australia")) next.push("Australia");
            if (next.length) setPreferredCountries(next);
          }
        }
        if (typeof pi?.goals?.five_year_goal === "string" && pi.goals.five_year_goal.trim()) {
          setCareerGoal(pi.goals.five_year_goal.trim().slice(0, 200));
        } else if (
          typeof pi?.goals?.target_role === "string" &&
          pi.goals.target_role.trim()
        ) {
          setCareerGoal(`Target role: ${pi.goals.target_role.trim()}`.slice(0, 200));
        }
      } catch {
        // keep manual defaults if profile fetch fails
      }
    })();
  }, []);

  function toggleCountry(c: (typeof COUNTRY_OPTIONS)[number]) {
    setPreferredCountries((prev) => {
      const has = prev.includes(c);
      if (has) {
        const next = prev.filter((x) => x !== c);
        return next.length ? next : prev;
      }
      return [...prev, c];
    });
  }

  function resetAll() {
    setPhase("form");
    setResult(null);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("loading");

    const body: CareerNavigatorPostBody = {
      currentDegree: currentDegree.trim() || "Not specified",
      currentCGPA,
      targetField,
      budgetRange,
      preferredCountries,
      careerGoal: careerGoal.trim(),
      workExperienceYears,
    };

    try {
      const res = await fetch("/api/career/career-navigator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        throw new Error("Please sign in again.");
      }
      if (res.status === 429) {
        throw new Error("Too many requests. Try again in a minute.");
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Request failed");
      }

      const json = (await res.json()) as ApiPayload;
      setResult(json);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("form");
    }
  }

  const top = result?.topRecommendations?.[0];
  const rest = result?.topRecommendations?.slice(1, 5) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          AI Career Navigator
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Structured university fit — programs, costs, ROI, and visa context tailored
          to your profile (typical wait 10–15 seconds).
        </p>
      </div>

      {phase === "form" && (
        <form onSubmit={onSubmit} className="space-y-6">
          <GlassCard className="p-4 sm:p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="degree">Current degree</Label>
                <Input
                  id="degree"
                  className="mt-1.5"
                  placeholder="e.g. B.Tech Computer Science"
                  value={currentDegree}
                  onChange={(e) => setCurrentDegree(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cgpa">
                  CGPA:{" "}
                  <span className="tabular-nums text-foreground">
                    {currentCGPA.toFixed(1)}
                  </span>{" "}
                  / 10
                </Label>
                <input
                  id="cgpa"
                  type="range"
                  min={5}
                  max={10}
                  step={0.1}
                  value={currentCGPA}
                  onChange={(e) => setCurrentCGPA(Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer accent-primary"
                />
              </div>

              <div>
                <Label htmlFor="targetField">Target field</Label>
                <select
                  id="targetField"
                  value={targetField}
                  onChange={(e) =>
                    setTargetField(
                      e.target.value as CareerNavigatorPostBody["targetField"]
                    )
                  }
                  className="mt-1.5 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {TARGET_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="budget">Budget range (INR)</Label>
                <select
                  id="budget"
                  value={budgetRange}
                  onChange={(e) =>
                    setBudgetRange(
                      e.target.value as CareerNavigatorPostBody["budgetRange"]
                    )
                  }
                  className="mt-1.5 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="exp">
                  Work experience:{" "}
                  <span className="tabular-nums">{workExperienceYears}</span>{" "}
                  years
                </Label>
                <input
                  id="exp"
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={workExperienceYears}
                  onChange={(e) =>
                    setWorkExperienceYears(Number(e.target.value))
                  }
                  className="mt-3 h-2 w-full cursor-pointer accent-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <span className="text-sm font-medium leading-none">
                  Preferred countries
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COUNTRY_OPTIONS.map((c) => {
                    const on = preferredCountries.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCountry(c)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          on
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <span aria-hidden>{FLAG[c]}</span>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="goal">Career goal</Label>
                <textarea
                  id="goal"
                  maxLength={200}
                  rows={3}
                  placeholder="What roles or impact do you want in the next 5 years?"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  className="mt-1.5 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {careerGoalLeft} characters left
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-6" size="lg">
              Show Recommendations
            </Button>
          </GlassCard>
        </form>
      )}

      {phase === "loading" && <NavigatorSkeleton />}

      {phase === "results" && result && top && (
        <div className="animate-in fade-in space-y-6 duration-300">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={resetAll}>
              ← Back
            </Button>
            {result._meta?.source === "fallback" && (
              <span className="text-xs text-muted-foreground">
                Showing curated fallback matches (AI unavailable or unparsed).
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
              Best country: {result.bestCountryForYou}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
              Best field: {result.bestFieldForYou}
            </span>
          </div>

          <GlassCard className="overflow-hidden p-4 sm:p-6" gradient>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl" aria-hidden>
                    {FLAG[top.country] ?? "🎓"}
                  </span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                    #1 pick
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      difficultyStyles(top.admissionDifficulty)
                    )}
                  >
                    {top.admissionDifficulty}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs capitalize",
                      visaStyles(top.visaFriendliness)
                    )}
                  >
                    Visa: {top.visaFriendliness}
                  </span>
                </div>
                <h2 className="font-heading text-xl font-bold leading-tight sm:text-2xl">
                  {top.university}
                </h2>
                <p className="text-sm font-medium text-muted-foreground">
                  {top.country} · {top.program}
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {top.whyThisFits}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <div className="text-left sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    ROI score
                  </p>
                  <p className="font-heading text-5xl font-bold tabular-nums text-primary sm:text-6xl">
                    {Math.round(top.roiScore)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Tuition (est.)
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {top.estimatedCost.tuition}{" "}
                  <span className="text-muted-foreground">
                    {top.estimatedCost.currency}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Living (est.)
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {top.estimatedCost.living}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Avg starting salary (est.)
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {top.avgStartingSalary}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Employment rate (est.)
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {Math.round(top.employmentRate)}%
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rest.map((r) => (
              <GlassCard key={r.rank} className="flex flex-col p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {FLAG[r.country] ?? "🎓"}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    #{r.rank}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs capitalize",
                      difficultyStyles(r.admissionDifficulty)
                    )}
                  >
                    {r.admissionDifficulty}
                  </span>
                </div>
                <h3 className="mt-2 font-heading text-base font-semibold leading-snug">
                  {r.university}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {r.country} · {r.program}
                </p>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-foreground/85">
                  {r.whyThisFits}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">ROI</span>{" "}
                    <span className="font-semibold tabular-nums">
                      {Math.round(r.roiScore)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Salary</span>{" "}
                    <span className="font-medium">{r.avgStartingSalary}</span>
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    Cost: {r.estimatedCost.tuition} + living ·{" "}
                    {r.estimatedCost.currency}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="border-dashed bg-muted/20 p-4 sm:p-5">
            <p className="text-sm italic leading-relaxed text-foreground/90">
              {result.reasoning}
            </p>
          </GlassCard>

          <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
            <AccordionItem value="alt" className="border-none">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Alternative paths
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {result.alternativePaths.map((ap) => (
                  <div key={ap.path} className="rounded-lg bg-muted/30 p-3">
                    <p className="font-medium">{ap.path}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Pros:{" "}
                      </span>
                      {ap.pros.join("; ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-rose-700 dark:text-rose-400">
                        Cons:{" "}
                      </span>
                      {ap.cons.join("; ")}
                    </p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <GlassCard className="p-4 sm:p-6">
            <h3 className="font-heading text-lg font-semibold">Next steps</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
              {result.nextSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </GlassCard>

          <div className="flex justify-center pb-4">
            <Link
              href="/funding"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "min-h-11 px-6"
              )}
            >
              Calculate Loan for {top.university}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
