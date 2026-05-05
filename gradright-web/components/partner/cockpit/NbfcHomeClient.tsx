"use client";

import { useNbfcPolling } from "@/components/partner/cockpit/useNbfcPolling";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardData = {
  total_applicants: number;
  high_confidence_candidates: number;
  average_risk_score: number;
  approval_rate: number;
  analytics: {
    applicant_distribution_by_country: Array<{ country: string; count: number }>;
    risk_segmentation: Array<{ label: string; value: number }>;
    approval_trend: Array<{ period: string; approved: number; rejected: number }>;
    loan_demand_patterns: Array<{ name: string; demand_lakhs: number }>;
    recent_activity: Array<{ id: string; actor: string; status: string; action: string; at: string }>;
  };
  updated_at: string;
};

export function NbfcHomeClient() {
  const { data, loading, error } = useNbfcPolling<DashboardData>("/api/nbfc/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Home</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Underwriting command dashboard for identifying high-quality borrowers quickly.
        </p>
      </div>
      {loading ? <p className="text-sm text-slate-500">Loading metrics...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total applicants" value={String(data.total_applicants)} hint="Live + demo blended dataset" />
          <MetricCard
            label="High-confidence candidates"
            value={String(data.high_confidence_candidates)}
            hint="Approval likelihood >= 75%"
          />
          <MetricCard label="Average risk score" value={String(data.average_risk_score)} hint="Scoring engine aligned index" />
          <MetricCard label="Approval rate" value={`${data.approval_rate}%`} hint="Approved over decided cases" />
        </div>
      ) : null}
      {data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Applicants by Country">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.analytics.applicant_distribution_by_country}>
                <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Risk Segmentation">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.analytics.risk_segmentation} dataKey="value" nameKey="label" outerRadius={92}>
                  {data.analytics.risk_segmentation.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={entry.label === "Low" ? "#16a34a" : entry.label === "Medium" ? "#f59e0b" : "#dc2626"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Approval Trend">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.analytics.approval_trend}>
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="approved" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Loan Demand Pattern (Lakhs INR)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.analytics.loan_demand_patterns}>
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="demand_lakhs" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : null}
      {data ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="font-semibold">Recent Activity</h3>
          <div className="mt-3 space-y-2">
            {data.analytics.recent_activity.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-sm font-medium">{item.actor}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {item.action} | Status: {item.status} | {new Date(item.at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
