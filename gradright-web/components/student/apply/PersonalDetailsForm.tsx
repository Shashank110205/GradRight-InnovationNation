"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shell/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoanApplication } from "@/lib/types";
import { useApplicationStore } from "@/stores/application-store";

export function PersonalDetailsForm({
  initial,
  defaultFullName,
}: {
  initial: LoanApplication | null;
  defaultFullName: string;
}) {
  const saveStep = useApplicationStore((s) => s.saveStep);
  const saving = useApplicationStore((s) => s.saving);

  const [full_name, setFullName] = useState(
    initial?.full_name ?? defaultFullName
  );
  const [dob, setDob] = useState(initial?.dob ?? "");
  const [pan_number, setPan] = useState(initial?.pan_number ?? "");
  const [aadhaar_last4, setAadhaar] = useState(initial?.aadhaar_last4 ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveStep(1, {
      full_name: full_name.trim(),
      dob: dob || null,
      pan_number: pan_number.trim().toUpperCase() || null,
      aadhaar_last4: aadhaar_last4.trim() || null,
      address: address.trim(),
    });
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-heading text-lg font-semibold">Personal details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter exactly as per KYC documents to avoid verification delays.
      </p>
      <p className="mt-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Reassurance: PAN and Aadhaar details are used only for lender verification and remain
        encrypted.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pan">PAN</Label>
            <Input
              id="pan"
              value={pan_number}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              maxLength={10}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaar">Aadhaar last 4 digits</Label>
            <Input
              id="aadhaar"
              inputMode="numeric"
              value={aadhaar_last4}
              onChange={(e) =>
                setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              maxLength={4}
              className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            autoComplete="street-address"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            Save personal details
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
