"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StudentProfile } from "@/lib/types";
import type { RiskScorePostBody } from "@/lib/validations/risk-score-input";

export function CareerRiskGenerateForm({
  profile,
  onSubmit,
  busy,
  error,
  submitLabel,
  /** When true (e.g. recalculate), always show CGPA / internship fields for edits. */
  detailedFields,
}: {
  profile: StudentProfile;
  onSubmit: (body: RiskScorePostBody) => void;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  detailedFields: boolean;
}) {
  const [instituteTier, setInstituteTier] = useState<
    NonNullable<RiskScorePostBody["institute_tier"]>
  >(profile.institute_tier ?? "Other");
  const [cgpa, setCgpa] = useState(
    profile.cgpa != null ? String(profile.cgpa) : ""
  );
  const [cgpaScale, setCgpaScale] = useState(
    String(profile.cgpa_scale ?? 10)
  );
  const [internshipMonths, setInternshipMonths] = useState(
    String(profile.internship_months_total ?? 0)
  );
  const [certCount, setCertCount] = useState(
    String(profile.certification_count ?? 0)
  );
  const [workYears, setWorkYears] = useState(
    String(profile.work_experience_years ?? 0)
  );

  const needsCgpaDetail = useMemo(
    () => profile.cgpa == null,
    [profile.cgpa]
  );
  const needsInternshipDetail = useMemo(
    () =>
      (profile.internship_months_total ?? 0) === 0 &&
      (profile.internship_count ?? 0) === 0,
    [profile.internship_count, profile.internship_months_total]
  );

  const showCgpaFields = needsCgpaDetail || detailedFields;
  const showInternshipField = needsInternshipDetail || detailedFields;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: RiskScorePostBody = {
      institute_tier: instituteTier,
    };

    if (showCgpaFields) {
      const c = Number.parseFloat(cgpa);
      const s = Number.parseFloat(cgpaScale);
      if (!Number.isNaN(c) && c >= 0) body.cgpa = c;
      if (!Number.isNaN(s) && s > 0) body.cgpa_scale = s;
    }

    if (showInternshipField) {
      const im = Number.parseInt(internshipMonths, 10);
      if (!Number.isNaN(im) && im >= 0) {
        body.internship_months_total = im;
      }
    }

    const cc = Number.parseInt(certCount, 10);
    if (!Number.isNaN(cc) && cc >= 0) {
      body.certification_count = cc;
    }

    const wy = Number.parseInt(workYears, 10);
    if (!Number.isNaN(wy) && wy >= 0) {
      body.work_experience_years = wy;
    }

    onSubmit(body);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Generate your risk score
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We combine your profile with the placement rule engine, then add a short
          AI summary. Fields below refine signals that are missing from your
          profile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="institute_tier">Institute tier</Label>
          <select
            id="institute_tier"
            value={instituteTier}
            onChange={(e) =>
              setInstituteTier(
                e.target.value as NonNullable<RiskScorePostBody["institute_tier"]>
              )
            }
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="IIT/IIM">IIT / IIM</option>
            <option value="NIT/Tier2">NIT / Tier 2</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="work_years">Work experience (years)</Label>
          <Input
            id="work_years"
            type="number"
            min={0}
            value={workYears}
            onChange={(e) => setWorkYears(e.target.value)}
          />
        </div>

        {showCgpaFields ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="cgpa">CGPA</Label>
              <Input
                id="cgpa"
                inputMode="decimal"
                placeholder="e.g. 8.2"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cgpa_scale">CGPA scale</Label>
              <Input
                id="cgpa_scale"
                inputMode="decimal"
                placeholder="10"
                value={cgpaScale}
                onChange={(e) => setCgpaScale(e.target.value)}
              />
            </div>
          </>
        ) : null}

        {showInternshipField ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="internship_months">Internship months (total)</Label>
            <Input
              id="internship_months"
              type="number"
              min={0}
              value={internshipMonths}
              onChange={(e) => setInternshipMonths(e.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cert_count">Certifications count</Label>
          <Input
            id="cert_count"
            type="number"
            min={0}
            value={certCount}
            onChange={(e) => setCertCount(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? "Scoring…" : submitLabel}
      </Button>
    </form>
  );
}
