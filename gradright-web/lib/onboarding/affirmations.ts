import type { OnboardingQuestionKey } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

/** Short, upbeat micro-copy after a selection (onboarding engagement). */
export function affirmationForSelection(
  key: OnboardingQuestionKey,
  option: string,
  context?: { allCountries?: string[] }
): string {
  if (key === "target_country") {
    const list = context?.allCountries ?? parseTargetCountries(option);
    if (list.length >= 2) {
      return "Great combo — we’ll tailor advice across your destinations.";
    }
    const single: Record<string, string> = {
      "United States": "Strong choice — huge program variety and career paths.",
      "United Kingdom": "Love it — shorter programs, sharp industry links.",
      Canada: "Smart pick — balance of quality, cost, and post-study options.",
      Germany: "Excellent — strong STEM and value-focused pathways.",
      Australia: "Nice — great lifestyle and growing tech hubs.",
      "India (Domestic)": "Solid — we’ll focus on domestic ladders and financing.",
    };
    return single[option] ?? "Noted — we’ll personalize around this destination.";
  }

  if (key === "degree_type") {
    const m: Record<string, string> = {
      "Masters (MS/MSc)": "MS track — we’ll weight research, internships, and GRE/IELTS.",
      MBA: "MBA path — we’ll emphasize outcomes, networks, and financing.",
      "MiM / Masters in Management": "MiM fits early-career momentum — great foundation.",
      PhD: "Research depth — we’ll frame long-horizon planning.",
      "PG Diploma": "Skills-first route — we’ll highlight employability signals.",
    };
    return m[option] ?? "Locked in — next we’ll shape your field focus.";
  }

  if (key === "broad_field") {
    const m: Record<string, string> = {
      "Computer Science / IT": "CS/IT — huge demand; we’ll stress projects and internships.",
      Engineering: "Engineering — we’ll align labs, co-ops, and placement signals.",
      "Business / Finance": "Business track — case comps and networking will matter.",
      "Life Sciences / Healthcare": "Life sciences — we’ll factor research and regulation paths.",
      "Arts / Design / Social Sciences": "Creative & social sciences — portfolio and narrative count.",
      Other: "Broad field noted — we’ll keep recommendations flexible.",
    };
    return m[option] ?? "Field saved — tailoring the rest of your path.";
  }

  if (key === "target_intake") {
    if (option.includes("Still exploring")) {
      return "All good — we’ll keep timelines flexible.";
    }
    return "Intake set — your timeline just got real. We’ll pace milestones accordingly.";
  }

  if (key === "current_academic_level") {
    return "Thanks — we’ll calibrate experience and placement timing from here.";
  }

  if (key === "budget_band_usd") {
    if (option.includes("Not sure")) {
      return "No worries — we’ll show ranges so you can decide calmly.";
    }
    return "Budget noted — we’ll align destinations and loan signals responsibly.";
  }

  if (key === "loan_needed") {
    const needs = option !== "No, I have other funding";
    return needs
      ? "We’ll surface eligibility hints without promising approvals."
      : "Clear — we’ll still show financing context for backup planning.";
  }

  return "Nice — keeping going.";
}
