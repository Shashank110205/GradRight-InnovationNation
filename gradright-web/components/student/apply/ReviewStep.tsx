"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import type { LoanApplication } from "@/lib/types";
import { formatLoanAmount } from "@/lib/utils/calculations";
import { useApplicationStore } from "@/stores/application-store";

function programBlock(app: LoanApplication | null) {
  const raw = app?.ocr_extracted_data?.loan_program;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return {
      university: String(o.university ?? "—"),
      country: String(o.country ?? "—"),
      intake: String(o.intake ?? "—"),
      total_cost_usd: String(o.total_cost_usd ?? "—"),
    };
  }
  return null;
}

export function ReviewStep({ application }: { application: LoanApplication | null }) {
  const saveStep = useApplicationStore((s) => s.saveStep);
  const setCurrentStep = useApplicationStore((s) => s.setCurrentStep);
  const saving = useApplicationStore((s) => s.saving);

  const prog = programBlock(application);

  async function finishReview() {
    await saveStep(6, {});
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold">Review</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Quick pass before you submit. Use edit to jump back to a section.
      </p>

      <div className="mt-6 space-y-6 text-sm">
        <section className="space-y-1 border-b border-border pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-foreground">Personal</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(1)}
            >
              Edit
            </Button>
          </div>
          <p className="text-muted-foreground">
            {application?.full_name ?? "—"} · PAN{" "}
            {application?.pan_number ?? "—"}
          </p>
          <p className="text-muted-foreground">{application?.address ?? "—"}</p>
        </section>

        <section className="space-y-1 border-b border-border pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-foreground">Academic</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(2)}
            >
              Edit
            </Button>
          </div>
          <p className="text-muted-foreground">
            {application?.institute ?? "—"} — {application?.program ?? "—"}
          </p>
          <p className="text-muted-foreground">
            Offer file: {application?.offer_letter_url ?? "—"}
          </p>
        </section>

        <section className="space-y-1 border-b border-border pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-foreground">Target program</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(3)}
            >
              Edit
            </Button>
          </div>
          {prog ? (
            <p className="text-muted-foreground">
              {prog.university}, {prog.country} · Intake {prog.intake} · ~$
              {prog.total_cost_usd} total cost
            </p>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </section>

        <section className="space-y-1 border-b border-border pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-foreground">Financial</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(4)}
            >
              Edit
            </Button>
          </div>
          <p className="text-muted-foreground">
            Loan requested:{" "}
            {application?.loan_amount_requested != null
              ? formatLoanAmount(application.loan_amount_requested)
              : "—"}
          </p>
          <p className="text-muted-foreground">
            Family income (annual):{" "}
            {application?.family_income_annual != null
              ? formatLoanAmount(application.family_income_annual)
              : "—"}
          </p>
          <p className="text-muted-foreground">
            Co-borrower: {application?.co_borrower_name ?? "—"} (
            {application?.co_borrower_relation ?? "—"}) · Collateral:{" "}
            {application?.collateral_available ? "Yes" : "No"}
          </p>
        </section>

        <section className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-foreground">Documents</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(5)}
            >
              Edit
            </Button>
          </div>
          <p className="text-muted-foreground">
            {application?.documents?.length
              ? `${application.documents.length} file(s) uploaded`
              : "No files uploaded"}
          </p>
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={() => void finishReview()} disabled={saving}>
          Looks good — continue
        </Button>
      </div>
    </GlassCard>
  );
}
