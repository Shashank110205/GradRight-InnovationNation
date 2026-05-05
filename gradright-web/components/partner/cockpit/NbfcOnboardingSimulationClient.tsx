"use client";

import { useNbfcPolling } from "@/components/partner/cockpit/useNbfcPolling";

type Step = { step: number; title: string; detail: string };
type Payload = {
  students: Array<{
    id: string;
    name: string;
    onboarding_state: string;
    onboarding_progress: number;
    checklist: Record<string, string>;
  }>;
  flow: Step[];
  outcomes: string[];
  controls: string[];
};

export function NbfcOnboardingSimulationClient() {
  const { data, loading, error } = useNbfcPolling<Payload>("/api/nbfc/onboarding", 30000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Onboarding</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Agentic AI video-call onboarding simulation for approved borrowers.
        </p>
      </div>
      {loading ? <p className="text-sm text-slate-500">Loading simulation...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <h3 className="mb-2 text-sm font-semibold">Onboarding Pipeline</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-2 py-2 text-left">Student</th>
              <th className="px-2 py-2 text-left">State</th>
              <th className="px-2 py-2 text-left">Progress</th>
              <th className="px-2 py-2 text-left">Checklist</th>
              <th className="px-2 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.students ?? []).map((s) => (
              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-2">{s.name}</td>
                <td className="px-2 py-2">{s.onboarding_state}</td>
                <td className="px-2 py-2">{s.onboarding_progress}%</td>
                <td className="px-2 py-2 text-xs">
                  KYC: {s.checklist.kyc}, Income: {s.checklist.income_proof}, Admission:{" "}
                  {s.checklist.admission_proof}
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(data?.controls ?? []).map((c) => (
                      <button key={c} type="button" className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600">
                        {c}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="space-y-3">
        {(data?.flow ?? []).map((step) => (
          <div key={step.step} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Step {step.step}
            </p>
            <h2 className="mt-1 font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{step.detail}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="text-sm font-semibold">Expected Outcomes</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {(data?.outcomes ?? []).map((outcome) => (
            <li key={outcome}>- {outcome}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
