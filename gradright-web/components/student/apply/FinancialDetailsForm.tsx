"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoanApplication } from "@/lib/types";
import { useApplicationStore } from "@/stores/application-store";

export function FinancialDetailsForm({
  initial,
  defaultLoanInr,
}: {
  initial: LoanApplication | null;
  defaultLoanInr: number;
}) {
  const saveStep = useApplicationStore((s) => s.saveStep);
  const saving = useApplicationStore((s) => s.saving);

  const [family_income_annual, setIncome] = useState(
    initial?.family_income_annual != null
      ? String(initial.family_income_annual)
      : "1200000"
  );
  const [loan_amount_requested, setLoan] = useState(
    initial?.loan_amount_requested != null
      ? String(initial.loan_amount_requested)
      : String(defaultLoanInr)
  );
  const [co_borrower_name, setCoName] = useState(
    initial?.co_borrower_name ?? ""
  );
  const [co_borrower_relation, setCoRel] = useState(
    initial?.co_borrower_relation ?? ""
  );
  const [collateral_available, setCollateral] = useState(
    initial?.collateral_available ?? false
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const inc = Number(family_income_annual.replace(/,/g, ""));
    const loan = Number(loan_amount_requested.replace(/,/g, ""));
    await saveStep(4, {
      family_income_annual: inc,
      loan_amount_requested: loan,
      co_borrower_name: co_borrower_name.trim() || null,
      co_borrower_relation: co_borrower_relation.trim() || null,
      collateral_available,
    });
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold">Financial details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Income, co-borrower, and collateral context that lenders use for education loan underwriting.
      </p>
      <p className="mt-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Confidence tip: accurate numbers improve approval quality and reduce follow-up calls.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="income">Annual family income (₹)</Label>
            <Input
              id="income"
              inputMode="numeric"
              value={family_income_annual}
              onChange={(e) => setIncome(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loan_amt">Loan amount requested (₹)</Label>
            <Input
              id="loan_amt"
              inputMode="numeric"
              value={loan_amount_requested}
              onChange={(e) => setLoan(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="co_name">Co-borrower name</Label>
            <Input
              id="co_name"
              value={co_borrower_name}
              onChange={(e) => setCoName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co_rel">Relationship to applicant</Label>
            <Input
              id="co_rel"
              value={co_borrower_relation}
              onChange={(e) => setCoRel(e.target.value)}
              placeholder="e.g. Parent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="collateral"
            checked={collateral_available}
            onCheckedChange={(v) => setCollateral(v === true)}
          />
          <Label htmlFor="collateral" className="font-normal">
            Collateral available (property / FD / similar)
          </Label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            Save financial details
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
