"use client";

import { useNbfcPolling } from "@/components/partner/cockpit/useNbfcPolling";

type MatchRecord = {
  id: string;
  applicant_name: string;
  cgpa: number | null;
  target_country: string;
  loan_requirement_inr: number;
  risk_score: number;
  risk_label: "low" | "medium" | "high";
  repayment_probability: number;
  approval_probability: number;
  decision_flag: "auto_approved" | "human_review_required";
  deterministic_explanation: string;
};

export function NbfcPotentialMatchesClient() {
  const { data, loading, error } = useNbfcPolling<MatchRecord[]>("/api/nbfc/matches");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Potential Matches</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Candidates derived from profile hub, onboarding, risk, and application signals.
        </p>
      </div>
      {loading ? <p className="text-sm text-slate-500">Loading matches...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left dark:border-slate-700">
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">CGPA</th>
              <th className="px-3 py-2">Target Country</th>
              <th className="px-3 py-2">Loan Requirement</th>
              <th className="px-3 py-2">Risk Score</th>
              <th className="px-3 py-2">Repayment Prob.</th>
              <th className="px-3 py-2">Approval</th>
              <th className="px-3 py-2">Decision</th>
              <th className="px-3 py-2">Why Suitable</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((m) => (
              <tr key={m.id} className="border-b border-slate-100 align-top dark:border-slate-800">
                <td className="px-3 py-3 font-medium">{m.applicant_name}</td>
                <td className="px-3 py-3">{m.cgpa ?? "NA"}</td>
                <td className="px-3 py-3">{m.target_country || "NA"}</td>
                <td className="px-3 py-3">INR {Math.round(m.loan_requirement_inr).toLocaleString()}</td>
                <td className="px-3 py-3">{m.risk_score}</td>
                <td className="px-3 py-3">{m.repayment_probability}%</td>
                <td className="px-3 py-3">{m.approval_probability}%</td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold dark:bg-slate-800">
                    {m.decision_flag === "auto_approved" ? "Auto Approved" : "Human Review Required"}
                  </span>
                  <span
                    className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
                      m.risk_label === "low"
                        ? "bg-emerald-100 text-emerald-700"
                        : m.risk_label === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {m.risk_label === "low" ? "Low Risk" : m.risk_label === "medium" ? "Medium Risk" : "High Risk"}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-400">
                  {m.deterministic_explanation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
