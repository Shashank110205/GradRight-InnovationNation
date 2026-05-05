"use client";

import { useNbfcPolling } from "@/components/partner/cockpit/useNbfcPolling";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = {
  id: string;
  applicant_name: string;
  current_status: string;
  document_completion_level: number;
  last_activity_timestamp: string;
  reason: string;
};

type Payload = {
  approved: Row[];
  rejected: Row[];
  analytics: {
    approval_ratio: { approved: number; rejected: number };
    rejection_reason_distribution: Array<{ reason: string; count: number }>;
  };
};

export function NbfcApplicationsOverviewClient() {
  const { data, loading, error } = useNbfcPolling<Payload>("/api/nbfc/applications-overview");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Applications</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Approved and rejected applications with status, document completion, and last activity.
        </p>
      </div>
      {loading ? <p className="text-sm text-slate-500">Loading applications...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Bucket title="Approved" items={data?.approved ?? []} />
        <Bucket title="Rejected" items={data?.rejected ?? []} />
      </div>
      {data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="text-sm font-semibold">Approval Ratio</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={[
                    { label: "Approved", value: data.analytics.approval_ratio.approved },
                    { label: "Rejected", value: data.analytics.approval_ratio.rejected },
                  ]}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={90}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="text-sm font-semibold">Rejection Reasons</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.analytics.rejection_reason_distribution}>
                <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Bucket({ title, items }: { title: string; items: Row[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p className="font-medium">{item.applicant_name}</p>
            <p className="text-slate-600 dark:text-slate-400">
              Status: {item.current_status} | Documents: {item.document_completion_level}% | Last
              Activity: {item.last_activity_timestamp || "NA"}
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.reason || "Decision pending detailed note."}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
