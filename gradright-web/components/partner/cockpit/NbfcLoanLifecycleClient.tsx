"use client";

import { useNbfcPolling } from "@/components/partner/cockpit/useNbfcPolling";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type LifecycleRow = {
  id: string;
  applicant_name: string;
  stage: "Approved" | "Disbursed" | "In Progress";
  risk_classification: string;
  repayment_confidence: number;
  emi_estimate: number;
  decision_flag: "auto_approved" | "human_review_required";
};

type Payload = {
  lifecycle: LifecycleRow[];
  analytics: {
    lifecycle_stage_breakdown: Array<{ stage: string; count: number }>;
    repayment_health_distribution: Array<{ band: string; count: number }>;
  };
};

export function NbfcLoanLifecycleClient() {
  const { data, loading, error } = useNbfcPolling<Payload>("/api/nbfc/lifecycle");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Loan Lifecycle</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Monitor approved pipeline with stage, risk classification, and repayment confidence.
        </p>
      </div>
      {loading ? <p className="text-sm text-slate-500">Loading lifecycle...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="space-y-3">
        {(data?.lifecycle ?? []).map((row) => (
          <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="font-semibold">{row.applicant_name}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Stage: {row.stage} | Risk: {row.risk_classification} | Repayment confidence:{" "}
              {row.repayment_confidence}% | EMI est: INR {Math.round(row.emi_estimate).toLocaleString()} | Decision:{" "}
              {row.decision_flag === "auto_approved" ? "Auto Approved" : "Human Review Required"}
            </p>
          </div>
        ))}
      </div>
      {data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="text-sm font-semibold">Lifecycle Stage Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.analytics.lifecycle_stage_breakdown}>
                <XAxis dataKey="stage" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="text-sm font-semibold">Repayment Health</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.analytics.repayment_health_distribution} dataKey="count" nameKey="band" outerRadius={90} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
