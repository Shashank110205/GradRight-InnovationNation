"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoanApplication, StudentProfile } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";
import { useApplicationStore } from "@/stores/application-store";

function readLoanProgram(app: LoanApplication | null) {
  const raw = app?.ocr_extracted_data?.loan_program;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return {
      university: String(o.university ?? ""),
      country: String(o.country ?? ""),
      intake: String(o.intake ?? ""),
      total_cost_usd: String(o.total_cost_usd ?? ""),
    };
  }
  return { university: "", country: "", intake: "", total_cost_usd: "" };
}

export function ProgramDetailsForm({
  initial,
  profile,
}: {
  initial: LoanApplication | null;
  profile: StudentProfile;
}) {
  const saveStep = useApplicationStore((s) => s.saveStep);
  const saving = useApplicationStore((s) => s.saving);

  const defaults = useMemo(() => {
    const countries = parseTargetCountries(String(profile.target_country ?? ""));
    const uni =
      profile.target_universities?.[0]?.trim() ||
      (countries[0] ? `Program in ${countries[0]}` : "");
    return {
      country: countries[0] ?? "",
      intake: profile.target_intake ?? "",
      university: uni,
    };
  }, [profile]);

  const seed = readLoanProgram(initial);
  const [university, setUniversity] = useState(
    seed.university || defaults.university
  );
  const [country, setCountry] = useState(seed.country || defaults.country);
  const [intake, setIntake] = useState(seed.intake || defaults.intake);
  const [total_cost_usd, setTotalCost] = useState(seed.total_cost_usd);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cost = Number(total_cost_usd);
    await saveStep(3, {
      loan_program: {
        university: university.trim(),
        country: country.trim(),
        intake: intake.trim(),
        total_cost_usd: Number.isFinite(cost) ? cost : 0,
      },
    });
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold">
        Target program details
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Where you are headed and the all-in cost picture you are planning for.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="university">University / college</Label>
          <Input
            id="university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intake">Intake</Label>
            <Input
              id="intake"
              value={intake}
              onChange={(e) => setIntake(e.target.value)}
              placeholder="e.g. Fall 2026"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Estimated total program cost (USD)</Label>
          <Input
            id="cost"
            inputMode="decimal"
            value={total_cost_usd}
            onChange={(e) => setTotalCost(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            Save & continue
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
