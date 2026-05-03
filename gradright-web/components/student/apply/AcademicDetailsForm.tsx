"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { LoanApplication } from "@/lib/types";
import { useApplicationStore } from "@/stores/application-store";

export function AcademicDetailsForm({
  initial,
  defaultInstitute,
  defaultProgramHint,
}: {
  initial: LoanApplication | null;
  defaultInstitute: string;
  defaultProgramHint: string;
}) {
  const saveStep = useApplicationStore((s) => s.saveStep);
  const saving = useApplicationStore((s) => s.saving);

  const [institute, setInstitute] = useState(
    initial?.institute ?? defaultInstitute
  );
  const [program, setProgram] = useState(
    initial?.program ?? defaultProgramHint
  );
  const [admission_confirmed, setAdmissionConfirmed] = useState(
    initial?.admission_confirmed ?? false
  );
  const [offer_letter_url, setOfferLetterUrl] = useState(
    initial?.offer_letter_url ?? ""
  );
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  async function onOfferFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/apply/documents/upload", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { storage_path?: string };
        error?: string;
      };
      if (!res.ok || !json.success || !json.data?.storage_path) {
        throw new Error(json.error || "Upload failed");
      }
      setOfferLetterUrl(json.data.storage_path);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveStep(2, {
      institute: institute.trim(),
      program: program.trim(),
      admission_confirmed,
      offer_letter_url: offer_letter_url.trim() || null,
    });
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold">Academic details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Current admitting institute and program. Upload your offer letter if you
        have one.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="institute">Institute</Label>
          <Input
            id="institute"
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="program">Program</Label>
          <Input
            id="program"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="admission"
            checked={admission_confirmed}
            onCheckedChange={(c) => setAdmissionConfirmed(c === true)}
          />
          <Label htmlFor="admission" className="font-normal">
            Admission is confirmed (offer received)
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer">Offer letter (PDF or image)</Label>
          <Input
            id="offer"
            type="file"
            accept=".pdf,image/*"
            disabled={uploading}
            onChange={(e) => void onOfferFile(e.target.files?.[0] ?? null)}
          />
          {uploadErr ? (
            <p className="text-xs text-destructive">{uploadErr}</p>
          ) : null}
          {offer_letter_url ? (
            <p className="text-xs text-muted-foreground">
              Saved: {offer_letter_url}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || uploading}>
            Save & continue
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
