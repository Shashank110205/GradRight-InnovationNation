"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import { Label } from "@/components/ui/label";
import type { DocumentRecord, LoanApplication } from "@/lib/types";
import { useApplicationStore } from "@/stores/application-store";

const DOC_TYPES = [
  { value: "marksheet", label: "Marksheet / transcript" },
  { value: "offer_letter", label: "Offer letter" },
  { value: "income_proof", label: "Income proof" },
  { value: "pan", label: "PAN card" },
  { value: "aadhaar", label: "Aadhaar" },
] as const;

export function DocumentUploadStep({
  initial,
}: {
  initial: LoanApplication | null;
}) {
  const saveStep = useApplicationStore((s) => s.saveStep);
  const saving = useApplicationStore((s) => s.saving);

  const [documents, setDocuments] = useState<DocumentRecord[]>(
    initial?.documents?.length ? initial.documents : []
  );
  const [docType, setDocType] =
    useState<(typeof DOC_TYPES)[number]["value"]>("marksheet");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function addDocument(file: File | null) {
    if (!file || documents.length >= 5) return;
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const up = await fetch("/api/apply/documents/upload", {
        method: "POST",
        body: fd,
      });
      const upJson = (await up.json()) as {
        success: boolean;
        data?: { storage_path?: string; file_name?: string };
        error?: string;
      };
      if (!up.ok || !upJson.success || !upJson.data?.storage_path) {
        throw new Error(upJson.error || "Upload failed");
      }

      const path = upJson.data.storage_path;
      let extracted_fields: Record<string, unknown> | null = null;
      let ocr_status: DocumentRecord["ocr_status"] = "pending";

      try {
        const ocrRes = await fetch("/api/apply/ocr", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            storage_path: path,
            document_type: docType,
          }),
        });
        const ocrJson = (await ocrRes.json()) as {
          success: boolean;
          data?: { fields?: Record<string, unknown> };
        };
        if (ocrRes.ok && ocrJson.success && ocrJson.data?.fields) {
          extracted_fields = ocrJson.data.fields;
          ocr_status = "extracted";
        } else {
          ocr_status = "failed";
        }
      } catch {
        ocr_status = "failed";
      }

      const rec: DocumentRecord = {
        document_type: docType,
        storage_path: path,
        file_name: upJson.data.file_name ?? file.name,
        uploaded_at: new Date().toISOString(),
        ocr_status,
        extracted_fields,
      };
      setDocuments((d) => [...d, rec]);
      setMsg(
        ocr_status === "extracted"
          ? "Uploaded — extracted fields where possible."
          : "Uploaded — OCR had limited signal; you can still continue."
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onContinue() {
    await saveStep(5, { documents });
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold">
        Supporting documents
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Up to five files. We run OCR when possible to suggest form values—you
        stay in control of what gets submitted.
      </p>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="doc_type">Document type</Label>
          <select
            id="doc_type"
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
            value={docType}
            onChange={(e) =>
              setDocType(e.target.value as (typeof DOC_TYPES)[number]["value"])
            }
          >
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc_file">File</Label>
          <input
            id="doc_file"
            type="file"
            accept=".pdf,image/*"
            disabled={busy || documents.length >= 5}
            onChange={(e) => void addDocument(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </div>
        {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
        {documents.length > 0 ? (
          <ul className="space-y-1 text-sm text-foreground">
            {documents.map((d) => (
              <li
                key={d.storage_path}
                className="flex justify-between gap-2"
              >
                <span className="truncate">{d.file_name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {d.ocr_status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={() => void onContinue()}
          disabled={saving || busy}
        >
          Continue to review
        </Button>
      </div>
    </GlassCard>
  );
}
