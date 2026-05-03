"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NBFCDecision } from "@/lib/types";

type DialogMode = NBFCDecision | null;

export function DecisionActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<DialogMode>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: NBFCDecision) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/nbfc/applications/${applicationId}/decision`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            notes: notes.trim() || undefined,
          }),
        }
      );
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error ?? "Request failed");
        return;
      }
      setOpen(null);
      setNotes("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function openFor(d: NBFCDecision) {
    setError(null);
    setOpen(d);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Credit decision
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          onClick={() => openFor("approved")}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => openFor("rejected")}
        >
          Reject
        </Button>
        <Button
          type="button"
          className="bg-amber-500 text-amber-950 hover:bg-amber-400 dark:bg-amber-500 dark:text-amber-950"
          onClick={() => openFor("manual_review")}
        >
          Flag for manual review
        </Button>
      </div>

      <Dialog open={open != null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>
              {open === "approved"
                ? "Approve application"
                : open === "rejected"
                  ? "Reject application"
                  : "Flag for manual review"}
            </DialogTitle>
            <DialogDescription>
              This updates the application status and is recorded for audit. Add
              optional notes for the file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label
              htmlFor="nbfc-notes"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Notes (optional)
            </label>
            <textarea
              id="nbfc-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              placeholder="Internal rationale — not shared with the applicant."
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting || open == null}
              variant={
                open === "rejected"
                  ? "destructive"
                  : open === "approved"
                    ? "default"
                    : "secondary"
              }
              className={
                open === "approved"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : open === "manual_review"
                    ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                    : undefined
              }
              onClick={() => open && void submit(open)}
            >
              {submitting ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
