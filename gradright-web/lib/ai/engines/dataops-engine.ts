/**
 * DataOps engine — ranking, prioritization, signal simulation (shared `GEMINI_API_KEY` / Groq).
 * Pure deterministic helpers below are pluggable: later swap implementations for live feeds
 * without changing dashboard / explore / funding surfaces.
 */

import type { StudentMasterProfile } from "@/lib/profile/student-master-profile";

export type DataopsEngineReadContext = {
  userId: string;
};

export function describeDataopsEngine(): string {
  return "dataops";
}

export type SimulatedUniversityFit = {
  label: string;
  fit_score_0_to_100: number;
  rationale: string;
};

export type SimulatedScholarshipTier = {
  tier: string;
  priority_score_0_to_100: number;
  note: string;
};

export type DataopsSignalsPreview = {
  university_fit_ranked: SimulatedUniversityFit[];
  scholarship_priority_ranked: SimulatedScholarshipTier[];
  market_opportunity_hint: string;
  visa_deadline_hint: string;
  news_relevance_axes: string[];
  /** Human reassurance — noise filter framing */
  signal_clarity_reassurance: string;
};

function fieldToken(f: string | null): string {
  const s = (f ?? "").toLowerCase();
  if (s.includes("computer") || s.includes("data")) return "cs_data";
  if (s.includes("business") || s.includes("finance")) return "business";
  if (s.includes("bio") || s.includes("health")) return "life_sciences";
  return "general";
}

/** Deterministic “intelligence” layer — same inputs → same ranking (demo-safe). */
export function simulateDataOpsSignals(
  master: StudentMasterProfile
): DataopsSignalsPreview {
  const countries = master.pathway.target_countries;
  const primary = countries[0]?.toLowerCase() ?? "";
  const field = fieldToken(master.pathway.broad_field);
  const cgpa = master.academic.cgpa;
  const gpaBoost =
    cgpa != null ? Math.min(25, Math.max(0, (cgpa / (master.academic.cgpa_scale || 10)) * 25)) : 10;

  const uniTemplates: SimulatedUniversityFit[] = [];
  if (primary.includes("united states") || primary.includes("usa")) {
    uniTemplates.push(
      {
        label: "US — research-intensive (STEM-aligned)",
        fit_score_0_to_100: Math.round(58 + gpaBoost * 0.4),
        rationale: `Weighted for ${master.pathway.broad_field ?? "your field"} and current academic signals.`,
      },
      {
        label: "US — professional / career-track masters",
        fit_score_0_to_100: Math.round(52 + gpaBoost * 0.35),
        rationale: "Balances placement narrative with internship and project depth.",
      }
    );
  } else if (primary.includes("canada")) {
    uniTemplates.push(
      {
        label: "Canada — PGWP-friendly pathways",
        fit_score_0_to_100: Math.round(60 + gpaBoost * 0.38),
        rationale: "Emphasizes pathway clarity and intake timing vs. your stated goals.",
      }
    );
  } else if (primary.includes("united kingdom") || primary === "uk") {
    uniTemplates.push(
      {
        label: "UK — one-year intensive programs",
        fit_score_0_to_100: Math.round(55 + gpaBoost * 0.36),
        rationale: "Fits accelerated timelines when budget sensitivity is elevated.",
      }
    );
  } else {
    uniTemplates.push(
      {
        label: "Global mix — reach / match / safety framing",
        fit_score_0_to_100: Math.round(50 + gpaBoost * 0.42),
        rationale: "Uses destination list + field to simulate fit bands until live feeds attach.",
      }
    );
  }

  if (field === "cs_data") {
    uniTemplates.push({
      label: "Technical depth track (projects + skills)",
      fit_score_0_to_100: Math.round(62 + Math.min(18, (master.extracted.skills?.length ?? 0) * 1.2)),
      rationale: "Ranks programs that reward provable build experience.",
    });
  }

  const scholarshipTiers: SimulatedScholarshipTier[] = [
    {
      tier: "Merit / profile composite",
      priority_score_0_to_100: Math.min(
        95,
        45 + (master.intelligence.profile_completeness_score ?? 0) * 0.45
      ),
      note: "Higher when aspirations, scores, and extracurriculars are coherent.",
    },
    {
      tier: "Need-aware & aid-first schools",
      priority_score_0_to_100:
        master.funding.inferred_funding_comfort === "cautious" ? 88 : 62,
      note: "Weighted up when funding comfort skews cautious.",
    },
    {
      tier: "External fellowships & national programs",
      priority_score_0_to_100: 55,
      note: "Parallel track — deadlines often earlier than admission rounds.",
    },
  ];

  const market =
    field === "business"
      ? "Simulated demand tilt: finance & analytics hiring cycles remain cyclical — strengthen quant + communication proof."
      : field === "cs_data"
        ? "Simulated demand tilt: software + ML adjacent roles stay broad — differentiate with shipped work and measurable impact."
        : "Simulated demand tilt: cross-functional literacy (communication + domain depth) lifts shortlist quality.";

  const visa =
    primary.includes("united states") || primary.includes("usa")
      ? "Visa awareness: prioritize intake-aligned I-20 / DS-160 milestones early when US-bound."
      : primary.includes("canada")
        ? "Visa awareness: study permit processing windows vary — anchor offer acceptance to biometrics scheduling."
        : "Visa awareness: confirm country-specific financial proof timelines before deposit deadlines.";

  const newsAxes = [
    `${master.pathway.broad_field ?? "Field"} × ${countries.slice(0, 2).join(" / ") || "destinations"}`,
    master.aspirations.scholarship_priority
      ? `Scholarship stance: ${master.aspirations.scholarship_priority}`
      : "Scholarship stance: not specified",
    master.risk?.risk_label
      ? `Placement pressure zone: ${master.risk.risk_label}`
      : "Placement pressure zone: pending",
  ];

  return {
    university_fit_ranked: uniTemplates
      .sort((a, b) => b.fit_score_0_to_100 - a.fit_score_0_to_100)
      .slice(0, 5),
    scholarship_priority_ranked: scholarshipTiers,
    market_opportunity_hint: market,
    visa_deadline_hint: visa,
    news_relevance_axes: newsAxes,
    signal_clarity_reassurance:
      "This highlights what matters most for your next decision — not everything is urgent at once. What can wait often becomes clearer after your next milestone.",
  };
}
