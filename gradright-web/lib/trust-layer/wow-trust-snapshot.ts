import { getJobs } from "@/lib/data";
import type { UniversityRow } from "@/lib/data/types";
import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import type { StudentIntelligence } from "@/lib/profile/student-intelligence";
import type { RiskLabel, StudentProfile } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function humanizeRiskLevel(level: string): string {
  return level.replace(/_/g, " ");
}

function cgpaAdmissionBoost(band: string): number {
  if (band === "top_tier") return 10;
  if (band === "strong") return 7;
  if (band === "solid") return 4;
  if (band === "developing") return 0;
  return 2;
}

function riskLabelAdmissionDelta(label: RiskLabel | null | undefined): number {
  if (label === "low") return 6;
  if (label === "medium") return 0;
  if (label === "high") return -8;
  return 0;
}

function inferDelayMonths(targetIntake: string | null | undefined): number {
  if (!targetIntake?.trim()) return 3;
  const y = targetIntake.match(/20(\d{2})/);
  if (y) {
    const year = 2000 + parseInt(y[1], 10);
    const gapYears = Math.max(0, year - new Date().getFullYear());
    const months = Math.min(12, Math.max(3, gapYears * 4 + 2));
    return months;
  }
  return 3;
}

function inferDelayDropPct(
  riskLabel: RiskLabel | null | undefined,
  cgpaBand: string,
  delayMonths: number
): number {
  let base = 3 + Math.min(4, Math.floor(delayMonths / 3));
  if (riskLabel === "high") base += 4;
  if (riskLabel === "medium") base += 2;
  if (cgpaBand === "developing") base += 2;
  return Math.min(18, base);
}

export type WowTrustSnapshot = {
  ready: boolean;
  identityLine: string;
  supportingLine: string;
  admissionConfidencePct: number;
  loanConfidencePct: number;
  careerSuccessPct: number;
  delayMonths: number;
  delayDropPct: number;
  delayNarrative: string;
  bestPathSteps: [string, string, string];
  explainWhy: string;
  explainRisk: string;
  explainNext: string;
  expandedPlanText: string;
  topUniversityLinks: { name: string; country: string }[];
};

export function buildWowTrustSnapshot(input: {
  profile: StudentProfile | null;
  intelligence: StudentIntelligence;
  risk: LatestRiskScoreSummary | null;
  topUniversities: UniversityRow[];
}): WowTrustSnapshot {
  const { profile, intelligence, risk, topUniversities } = input;
  const countries = parseTargetCountries(profile?.target_country ?? "");
  const field = (profile?.broad_field ?? "").trim();
  const ready = Boolean(profile && countries.length > 0 && field.length > 0);

  const countryLabel =
    countries[0]?.trim() || profile?.target_country?.trim() || "your destinations";
  const fieldLabel = field || "your field";
  const riskWord = humanizeRiskLevel(intelligence.risk_level || "balanced");

  const identityLine = ready
    ? `You are a ${riskWord} learner targeting ${countryLabel} in ${fieldLabel}.`
    : "Your personalized snapshot unlocks once targets and field are set.";

  const careerHint =
    intelligence.career_direction !== "unknown" && intelligence.career_direction !== "forming"
      ? intelligence.career_direction
      : intelligence.profile_summary.split(".")[0]?.trim() || "your stated goals";

  const supportingLine = ready
    ? `Your profile shows strong potential in ${careerHint}.`
    : "Complete your profile to unlock your personalized plan — we will wire every metric to your real targets.";

  let admissionCore = risk?.placement_prob_6m != null ? risk.placement_prob_6m * 100 : 56;
  admissionCore += cgpaAdmissionBoost(intelligence.cgpa_band);
  admissionCore += riskLabelAdmissionDelta(risk?.risk_label);

  const admissionConfidencePct = ready ? clampPct(admissionCore) : 0;

  let loanConfidencePct = 52;
  if (intelligence.financial_capacity === "high" || intelligence.financial_capacity === "self_funded_bias") {
    loanConfidencePct += 18;
  }
  if (intelligence.financial_capacity === "constrained") loanConfidencePct -= 14;
  if (intelligence.financial_capacity === "medium") loanConfidencePct += 6;
  if (profile?.loan_needed === false) loanConfidencePct += 12;
  loanConfidencePct += (admissionConfidencePct - 55) * 0.12;
  loanConfidencePct = ready ? clampPct(loanConfidencePct) : 0;

  const job = getJobs(profile, 1)[0];
  const demand = job?.demand_index ?? 62;
  const placementForCareer = risk?.placement_prob_6m != null ? risk.placement_prob_6m * 100 : admissionCore * 0.85;
  const salaryBoost = job ? Math.min(12, job.median_salary_usd / 15000) : 0;
  const careerSuccessPct = ready
    ? clampPct(placementForCareer * 0.55 + demand * 0.38 + salaryBoost)
    : 0;

  const delayMonths = inferDelayMonths(profile?.target_intake);
  const delayDropPct = inferDelayDropPct(risk?.risk_label, intelligence.cgpa_band, delayMonths);
  const delayNarrative = ready
    ? `If you delay by ${delayMonths} months, modeled admission confidence can soften by about ${delayDropPct}% versus staying on your current cadence — intake windows compress and evidence slots fill.`
    : "Once your plan is set, we will model how intake timing affects your confidence bands.";

  const u1 = topUniversities[0];
  const u2 = topUniversities[1];
  const hasEnglish = profile?.ielts_score != null || profile?.toefl_score != null;
  const step1 = !hasEnglish
    ? "Raise IELTS/TOEFL to the median band your targets expect — it unlocks visa + admissions in one move."
    : "Tighten CGPA + transcript narrative in profile intelligence so reviewers see verified academic slope.";
  const step2 =
    u1 && u2
      ? `Aim application cycles at ${u1.name} and ${u2.name} — both already rank in your reference shortlist for ${fieldLabel}.`
      : u1
        ? `Anchor story + evidence toward ${u1.name}, and add one safer backup in the same country tier.`
        : "Add two dream programs in profile intelligence so we can name your top reference packs.";
  const step3 =
    "Run a funding envelope (scholarship + loan + liquidity) before seat deposits — tie it to living + tuition from Explore.";

  const bestPathSteps: [string, string, string] = [step1, step2, step3];

  const explainWhy =
    "These confidence bars blend your latest GradScore placement read (when present), CGPA band, funding posture from profile intelligence, and bundled job demand — transparent heuristics, not a lender or visa decision.";

  const explainRisk =
    "Percentages move as you verify documents, refresh tests, and rerun your GradScore — use them to prioritize, not as guarantees.";

  const explainNext =
    "Open “Show my best path”, execute the first two moves this week, then revisit Funding with updated numbers.";

  const topUniversityLinks = topUniversities.slice(0, 2).map((u) => ({ name: u.name, country: u.country }));
  const expandedPlanText = [
    topUniversityLinks.length
      ? `Universities in motion: ${topUniversityLinks.map((u) => `${u.name} (${u.country})`).join(" · ")}.`
      : "Add ranked programs to connect university choice with finance.",
    job
      ? `Career anchor role: ${job.title} (${job.country}) at ${job.demand_index}/100 demand in the bundled set.`
      : "Sharpen field + destination to attach a career demand anchor.",
    `Funding posture reads ${humanizeRiskLevel(intelligence.financial_capacity)} — align scholarships before loan sizing.`,
  ].join("\n\n");

  return {
    ready,
    identityLine,
    supportingLine,
    admissionConfidencePct,
    loanConfidencePct,
    careerSuccessPct,
    delayMonths,
    delayDropPct,
    delayNarrative,
    bestPathSteps,
    explainWhy,
    explainRisk,
    explainNext,
    expandedPlanText,
    topUniversityLinks,
  };
}
