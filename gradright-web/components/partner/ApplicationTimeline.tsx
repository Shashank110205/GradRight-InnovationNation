import type { LoanApplication } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ApplicationTimeline({
  application,
}: {
  application: LoanApplication;
}) {
  const steps: { label: string; at: string | null; done: boolean }[] = [
    {
      label: "Submitted",
      at: application.submitted_at,
      done: !!application.submitted_at,
    },
    {
      label: "Under review",
      at:
        application.status === "under_review" ||
        application.status === "manual_review"
          ? application.updated_at
          : application.status === "approved" || application.status === "rejected"
            ? application.updated_at
            : null,
      done:
        application.status !== "draft" &&
        application.status !== "submitted",
    },
    {
      label: "Decision recorded",
      at: application.nbfc_decision_at,
      done: !!application.nbfc_decision_at,
    },
  ];

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l border-slate-200 pl-6 dark:border-slate-700">
          {steps.map((s) => (
            <li key={s.label} className="relative">
              <span
                className={`absolute -left-[25px] mt-1.5 size-3 rounded-full border-2 ${
                  s.done
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950"
                }`}
              />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {s.label}
              </p>
              {s.at ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(s.at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              ) : (
                <p className="text-xs text-slate-400">—</p>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Current status:{" "}
          <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
            {application.status.replace(/_/g, " ")}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
