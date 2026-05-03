import { create } from "zustand";

import type { LoanApplication } from "@/lib/types";

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

function nextStepFromApplication(app: LoanApplication | null): number {
  if (!app || app.status !== "draft") return 0;
  const n = app.step_completed + 1;
  return Math.min(Math.max(0, n), 7);
}

export interface ApplicationStoreState {
  hydrated: boolean;
  application: LoanApplication | null;
  currentStep: number;
  saving: boolean;
  error: string | null;
  consentAccepted: boolean;
  resetLocal: () => void;
  setConsentAccepted: (v: boolean) => void;
  setCurrentStep: (n: number) => void;
  loadOrCreateDraft: () => Promise<void>;
  applyServerApplication: (app: LoanApplication | null) => void;
  saveStep: (
    completedStepIndex: number,
    patch: Record<string, unknown>
  ) => Promise<boolean>;
  submitApplication: () => Promise<boolean>;
}

export const useApplicationStore = create<ApplicationStoreState>((set, get) => ({
  hydrated: false,
  application: null,
  currentStep: 0,
  saving: false,
  error: null,
  consentAccepted: false,

  resetLocal: () =>
    set({
      hydrated: false,
      application: null,
      currentStep: 0,
      saving: false,
      error: null,
      consentAccepted: false,
    }),

  setConsentAccepted: (v) => set({ consentAccepted: v }),

  setCurrentStep: (n) =>
    set({ currentStep: Math.min(Math.max(0, n), 7), error: null }),

  applyServerApplication: (app) => {
    set({
      application: app,
      hydrated: true,
      currentStep: nextStepFromApplication(app),
      error: null,
    });
  },

  loadOrCreateDraft: async () => {
    set({ error: null });
    try {
      const res = await fetch("/api/apply/application");
      const json = (await res.json()) as ApiEnvelope<LoanApplication | null>;
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Could not load application");
      }
      if (json.data) {
        get().applyServerApplication(json.data);
        return;
      }
      const post = await fetch("/api/apply/application", { method: "POST" });
      const created = (await post.json()) as ApiEnvelope<LoanApplication>;
      if (!post.ok || !created.success || !created.data) {
        throw new Error(created.error || "Could not start application");
      }
      get().applyServerApplication(created.data);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Something went wrong",
        hydrated: true,
      });
    }
  },

  saveStep: async (completedStepIndex, patch) => {
    set({ saving: true, error: null });
    try {
      const res = await fetch("/api/apply/application", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...patch,
          step_completed: completedStepIndex,
        }),
      });
      const json = (await res.json()) as ApiEnvelope<LoanApplication>;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Could not save");
      }
      const app = json.data;
      set({
        application: app,
        currentStep: Math.min(completedStepIndex + 1, 7),
        saving: false,
      });
      return true;
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Save failed",
        saving: false,
      });
      return false;
    }
  },

  submitApplication: async () => {
    const { consentAccepted } = get();
    if (!consentAccepted) {
      set({ error: "Please confirm consent to submit." });
      return false;
    }
    set({ saving: true, error: null });
    try {
      const res = await fetch("/api/apply/application/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consentAccepted: true }),
      });
      const json = (await res.json()) as ApiEnvelope<LoanApplication>;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Submit failed");
      }
      set({ application: json.data, saving: false, currentStep: 7 });
      return true;
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Submit failed",
        saving: false,
      });
      return false;
    }
  },
}));
