import { create } from "zustand";

import { saveDashboardPreview } from "@/lib/dashboard-preview";
import type {
  GradRightScore,
  OnboardingAnswers,
  OnboardingQuestionKey,
} from "@/lib/types";

const emptyAnswers: OnboardingAnswers = {
  target_country: "",
  degree_type: "",
  broad_field: "",
  target_intake: "",
  current_academic_level: "",
  budget_band_usd: "",
  loan_needed: false,
};

function loanLabelToBoolean(label: string): boolean {
  return label !== "No, I have other funding";
}

/** Module 1 — steps 0–6 = questions, 7 = review flashcards, 8 = consent. */
export interface OnboardingState {
  currentStep: number;
  answers: OnboardingAnswers;
  gradRightScore: GradRightScore | null;
  isLoading: boolean;
  error: string | null;
  setAnswer: (key: OnboardingQuestionKey, value: string | boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitOnboarding: () => Promise<void>;
  hydrateGradRightScore: (score: GradRightScore) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 0,
  answers: { ...emptyAnswers },
  gradRightScore: null,
  isLoading: false,
  error: null,

  setAnswer: (key, value) => {
    set((state) => {
      const nextVal =
        key === "loan_needed"
          ? typeof value === "boolean"
            ? value
            : loanLabelToBoolean(String(value))
          : String(value);

      return {
        answers: {
          ...state.answers,
          [key]: nextVal,
        } as OnboardingAnswers,
      };
    });
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 8) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1, error: null });
    }
  },

  submitOnboarding: async () => {
    set({ isLoading: true, error: null });
    try {
      const { answers } = get();
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers,
          consentAccepted: true as const,
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: GradRightScore;
        error?: string;
      };

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Could not complete onboarding");
      }

      saveDashboardPreview(json.data);
      set({ gradRightScore: json.data, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Something went wrong",
        isLoading: false,
      });
    }
  },

  hydrateGradRightScore: (score) => {
    saveDashboardPreview(score);
    set({ gradRightScore: score, isLoading: false, error: null });
  },

  reset: () =>
    set({
      currentStep: 0,
      answers: { ...emptyAnswers },
      gradRightScore: null,
      isLoading: false,
      error: null,
    }),
}));
