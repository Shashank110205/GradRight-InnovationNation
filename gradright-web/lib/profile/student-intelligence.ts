import type { StudentProfile } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

import { getCosts, getJobs } from "@/lib/data";

export type StudentIntelligence = {
  cgpa_band: string;
  ambition_level: string;
  risk_level: string;
  financial_capacity: string;
  scholarship_need: string;
  career_direction: string;
  profile_summary: string;
};

function cgpaBand(p: StudentProfile | null): string {
  if (!p?.cgpa || !p.cgpa_scale || p.cgpa_scale <= 0) return "unknown";
  const r = p.cgpa / p.cgpa_scale;
  if (r >= 0.88) return "top_tier";
  if (r >= 0.75) return "strong";
  if (r >= 0.62) return "solid";
  return "developing";
}

function ambitionFromProfile(p: StudentProfile | null): string {
  const blob = `${p?.five_year_goal ?? ""} ${p?.dream_role ?? ""} ${p?.aspiration_text ?? ""}`.toLowerCase();
  if (/\b(phd|professor|founder|executive|director)\b/.test(blob)) return "high";
  if (/\b(lead|manager|specialist|abroad|global)\b/.test(blob)) return "moderate_high";
  if (blob.trim().length > 80) return "moderate";
  return "emerging";
}

function riskFromProfile(p: StudentProfile | null): string {
  const r = (p?.risk_appetite ?? "").toLowerCase();
  if (r.includes("aggressive")) return "aggressive";
  if (r.includes("conservative")) return "conservative";
  if (r.includes("moderate")) return "moderate";
  const pri = (p?.scholarship_priority ?? "").toLowerCase();
  if (pri.includes("prestige") || pri.includes("salary")) return "moderate_high";
  if (pri.includes("afford") || pri.includes("scholar")) return "cautious";
  return "balanced";
}

function financialCapacity(p: StudentProfile | null): string {
  const b = (p?.budget_band_usd ?? "").toLowerCase();
  if (b.includes("above") || b.includes("80")) return "high";
  if (b.includes("40") || b.includes("60")) return "medium";
  if (b.includes("below") || b.includes("20")) return "constrained";
  if (p?.loan_needed === false) return "self_funded_bias";
  return "unspecified";
}

function scholarshipNeed(p: StudentProfile | null): string {
  const pri = (p?.scholarship_priority ?? "").toLowerCase();
  if (pri.includes("scholar") || pri.includes("afford")) return "high";
  if (p?.funding_value_focus === "affordability") return "high";
  if (pri.includes("prestige")) return "moderate";
  return "medium";
}

function careerDirection(p: StudentProfile | null): string {
  const clarity = (p?.career_path_clarity ?? "").toLowerCase();
  if (clarity.includes("clear")) return "focused";
  if (clarity.includes("explor")) return "exploratory";
  const field = p?.broad_field?.trim();
  const role = p?.dream_role?.trim();
  if (field && role) return `${field} → ${role.slice(0, 48)}`;
  if (field) return field;
  if (p?.extracted_skills?.length) return "skills_led";
  return "forming";
}

function oneLineCostInsight(p: StudentProfile | null): string {
  const targets = parseTargetCountries(p?.target_country ?? "");
  const costs = getCosts(p, 4);
  const germany = targets.some((t) => t.toLowerCase().includes("germany"));
  const usa = targets.some(
    (t) =>
      t.toLowerCase().includes("united states") ||
      t.toLowerCase().includes("usa")
  );
  const gTuition = costs.find((c) => c.country === "Germany")?.tuition_public_usd_year;
  const uTuition = costs.find((c) => c.country === "United States")?.tuition_public_usd_year;
  if (germany && gTuition != null) {
    return `Public-track tuition in Germany in this dataset centers near $${gTuition.toLocaleString()}/year — often materially below US peer bands when both appear in your shortlist.`;
  }
  if (usa && uTuition != null) {
    return `US public-band tuition in the reference set often lands near $${uTuition.toLocaleString()}/year before living costs — pair with stipend questions early if you are scholarship-sensitive.`;
  }
  if (costs[0]) {
    return `For ${costs[0].country}, bundled living + annualized tuition from the reference cost set starts around $${Math.round(costs[0].living_monthly_usd * 12 + costs[0].tuition_public_usd_year).toLocaleString()}/year at a glance.`;
  }
  return "Add target countries in profile intelligence to unlock destination-specific cost benchmarks from the reference data.";
}

export function buildStudentIntelligence(profile: StudentProfile | null): StudentIntelligence {
  if (!profile) {
    return {
      cgpa_band: "unknown",
      ambition_level: "unknown",
      risk_level: "unknown",
      financial_capacity: "unknown",
      scholarship_need: "unknown",
      career_direction: "unknown",
      profile_summary: "Complete onboarding and profile intelligence to unlock a unified intelligence read.",
    };
  }

  const jobs = getJobs(profile, 3);
  const demandHint =
    jobs[0] != null
      ? `Reference hiring demand for ${jobs[0].title} in ${jobs[0].country} is indexed at ${jobs[0].demand_index}/100 in the bundled dataset.`
      : "Job demand signals will sharpen once preferred field and destinations are set.";

  const summaryParts = [
    `CGPA band: ${cgpaBand(profile).replace(/_/g, " ")}.`,
    `Ambition: ${ambitionFromProfile(profile).replace(/_/g, " ")}; career clarity: ${(profile.career_path_clarity ?? "not stated").replace(/_/g, " ")}.`,
    oneLineCostInsight(profile),
    demandHint,
  ];

  return {
    cgpa_band: cgpaBand(profile),
    ambition_level: ambitionFromProfile(profile),
    risk_level: riskFromProfile(profile),
    financial_capacity: financialCapacity(profile),
    scholarship_need: scholarshipNeed(profile),
    career_direction: careerDirection(profile),
    profile_summary: summaryParts.join(" "),
  };
}
