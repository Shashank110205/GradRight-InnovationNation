"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { useSupabase } from "@/components/shared/AppProviders";
import { ApplicationsTable } from "@/components/partner/ApplicationsTable";
import { NbfcBestApplicantsStrip } from "@/components/partner/NbfcBestApplicantsStrip";
import { NbfcPortfolioInsight } from "@/components/partner/NbfcPortfolioInsight";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NBFC_DEMO_PIPELINE } from "@/lib/partner/nbfc-demo-leads";
import type { NBFCApplicationListItem, RiskLabel } from "@/lib/types";
import type { LoanApplicationStatus } from "@/lib/types";

const RISKS: RiskLabel[] = ["low", "medium", "high"];
const STATUSES: LoanApplicationStatus[] = [
  "submitted",
  "under_review",
  "manual_review",
  "approved",
  "rejected",
];
const PROGRAMS = [
  { value: "", label: "All programs" },
  { value: "cs", label: "CS / Tech" },
  { value: "engineering", label: "Engineering" },
  { value: "business", label: "Business" },
  { value: "life_sciences", label: "Life sciences" },
  { value: "other", label: "Other" },
] as const;

function CountryFilterInput({
  valueFromUrl,
  onApply,
}: {
  valueFromUrl: string;
  onApply: (v: string) => void;
}) {
  const [v, setV] = useState(valueFromUrl);
  useEffect(() => setV(valueFromUrl), [valueFromUrl]);
  return (
    <input
      id="nbfc-country"
      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-950"
      placeholder="e.g. United States"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        if (v !== valueFromUrl) onApply(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onApply(v);
      }}
    />
  );
}

export function ApplicationsPageClient({
  items,
  query,
}: {
  items: NBFCApplicationListItem[];
  query: {
    risk: string;
    status: string;
    country: string;
    program: string;
  };
}) {
  const supabase = useSupabase();
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const channel = supabase
      .channel("nbfc-loan-applications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_applications",
        },
        () => {
          startTransition(() => router.refresh());
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, router, startTransition]);

  function pushFilters(next: Partial<typeof query>) {
    const params = new URLSearchParams();
    const merged = { ...query, ...next };
    if (merged.risk) params.set("risk", merged.risk);
    if (merged.status) params.set("status", merged.status);
    if (merged.country.trim()) params.set("country", merged.country.trim());
    if (merged.program) params.set("program", merged.program);
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/nbfc/applications?${qs}` : "/nbfc/applications"));
  }

  const heading = useMemo(
    () => `${items.length} lead${items.length === 1 ? "" : "s"} in view`,
    [items.length]
  );

  const showDemo = items.length === 0;
  const displayItems = showDemo ? NBFC_DEMO_PIPELINE : items;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">
          Loan lead queue
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Students who completed GradRight onboarding and shared loan applications
          appear here with placement outlook, risk band, and documents—so your team
          can prioritize outreach to the most suitable candidates.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50 md:flex-row md:flex-wrap md:items-end">
        <div className="grid gap-2">
          <Label htmlFor="nbfc-risk" className="text-slate-700 dark:text-slate-300">
            Risk level
          </Label>
          <select
            id="nbfc-risk"
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-950"
            value={query.risk}
            onChange={(e) => pushFilters({ risk: e.target.value })}
          >
            <option value="">All</option>
            {RISKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nbfc-status" className="text-slate-700 dark:text-slate-300">
            Status
          </Label>
          <select
            id="nbfc-status"
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-950"
            value={query.status}
            onChange={(e) => pushFilters({ status: e.target.value })}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-[160px] flex-1 gap-2">
          <Label htmlFor="nbfc-country" className="text-slate-700 dark:text-slate-300">
            Country
          </Label>
          <CountryFilterInput
            valueFromUrl={query.country}
            onApply={(country) => pushFilters({ country })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nbfc-program" className="text-slate-700 dark:text-slate-300">
            Program type
          </Label>
          <select
            id="nbfc-program"
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-950"
            value={query.program}
            onChange={(e) => pushFilters({ program: e.target.value })}
          >
            {PROGRAMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-slate-300 dark:border-slate-600"
          onClick={() =>
            pushFilters({ risk: "", status: "", country: "", program: "" })
          }
        >
          Clear filters
        </Button>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {heading}
      </p>

      <NbfcPortfolioInsight items={displayItems} />
      <NbfcBestApplicantsStrip items={displayItems} />

      {showDemo ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No live applications match these filters. Below is a{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              synthetic pipeline
            </span>{" "}
            so demos still feel like a real intelligence desk.
          </p>
          <ApplicationsTable items={NBFC_DEMO_PIPELINE} allowDetailNav={false} />
        </div>
      ) : (
        <ApplicationsTable items={items} />
      )}
    </div>
  );
}
