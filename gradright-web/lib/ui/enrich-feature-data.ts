/**
 * Client-side decision enricher — turns `/api/features/*` payloads into clear guidance
 * without changing APIs or backend contracts.
 */
import type { FeatureModuleView } from "@/lib/ui/feature-module-view-type";

export type FeatureEnrichProfile = {
  cgpa: number | null;
  internship_count: number;
  skills: string[];
  target_country: string | null;
  broad_field: string | null;
  target_role: string | null;
  five_year_goal: string | null;
  profile_completeness: number | null;
  grad_score: number | null;
};

const EMPTY_SENTINEL =
  "You're one step away from unlocking this insight — add goals and destinations under Improve Profile.";

/** Canonical actions every module should expose (deduped with API actions). */
export const CANONICAL_ACTION_SEEDS = [
  "Add 1 internship in next 2 months",
  "Shortlist 3 safe universities",
  "Prepare for IELTS/GRE",
  "Strengthen SOP",
] as const;

function dedupeLines(lines: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function humanizeCurrency(line: string): string {
  return line
    .replace(/Under \$30,?000/gi, "Under ₹25 lakh / year")
    .replace(/\$30,?000\s*[–-]\s*\$50,?000/gi, "₹25–₹42 lakh / year")
    .replace(/\$50,?000\s*[–-]\s*\$80,?000/gi, "₹42–₹67 lakh / year")
    .replace(/Above \$80,?000/gi, "Above ₹67 lakh / year")
    .replace(/\$([0-9][0-9,]*)/g, "₹$1");
}

function pickGapFocus(p: FeatureEnrichProfile): string {
  if (p.cgpa != null && p.cgpa < 7) {
    return "strengthening academic evidence and balancing reach with safer admits";
  }
  if (p.internship_count === 0) {
    return "adding practical experience recruiters and committees recognize";
  }
  if ((p.skills?.length ?? 0) >= 5) {
    return "translating your strengths into essays, résumé bullets, and test timing";
  }
  return "test timing and a sharper application narrative";
}

function buildReadinessPercent(p: FeatureEnrichProfile, raw: Record<string, unknown>): number {
  const gs =
    p.grad_score ??
    (typeof raw.grad_score === "number" ? raw.grad_score : null) ??
    (typeof raw.profile_completeness === "number" ? raw.profile_completeness : null) ??
    p.profile_completeness ??
    0;
  const n = typeof gs === "number" && Number.isFinite(gs) ? gs : 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function needsSyntheticSummary(summary: string): boolean {
  if (!summary.trim()) return true;
  if (summary === EMPTY_SENTINEL) return true;
  if (summary.length < 36) return true;
  return false;
}

export function extractEnrichProfileFromRaw(
  raw: Record<string, unknown> | null | undefined
): FeatureEnrichProfile | null {
  if (!raw || typeof raw !== "object") return null;

  const profile = raw.profile as Record<string, unknown> | undefined;
  const hub = raw.profile_hub as Record<string, unknown> | undefined;
  const piRaw =
    (hub?.profile_intelligence as Record<string, unknown> | undefined) ??
    (raw.profile_intelligence as Record<string, unknown> | undefined);
  const resume =
    piRaw?.resume && typeof piRaw.resume === "object"
      ? (piRaw.resume as Record<string, unknown>)
      : hub?.resume_snapshot && typeof hub.resume_snapshot === "object"
        ? (hub.resume_snapshot as Record<string, unknown>)
        : undefined;
  const goals =
    piRaw?.goals && typeof piRaw.goals === "object"
      ? (piRaw.goals as Record<string, unknown>)
      : hub?.goals_snapshot && typeof hub.goals_snapshot === "object"
        ? (hub.goals_snapshot as Record<string, unknown>)
        : undefined;

  const cgpaRaw = resume?.cgpa;
  const cgpa =
    typeof cgpaRaw === "number" && Number.isFinite(cgpaRaw)
      ? Math.min(10, Math.max(0, cgpaRaw))
      : typeof profile?.cgpa === "number" && Number.isFinite(profile.cgpa)
        ? Number(profile.cgpa)
        : null;

  let internship_count = 0;
  if (typeof profile?.internship_count === "number") {
    internship_count = Math.max(0, profile.internship_count);
  }
  if (Array.isArray(resume?.internships)) {
    internship_count = Math.max(internship_count, resume.internships.length);
  }

  const skills = Array.isArray(resume?.skills)
    ? resume.skills.filter((s): s is string => typeof s === "string").map((s) => s.trim())
    : [];

  const sys = hub?.system as Record<string, unknown> | undefined;
  const pc =
    typeof sys?.profile_completeness === "number"
      ? sys.profile_completeness
      : typeof profile?.profile_completeness_score === "number"
        ? profile.profile_completeness_score
        : typeof raw.profile_completeness === "number"
          ? raw.profile_completeness
          : typeof raw.profileHubCompleteness === "number"
            ? raw.profileHubCompleteness
            : null;

  const target_country =
    typeof profile?.target_country === "string"
      ? profile.target_country
      : typeof raw.target_country === "string"
        ? raw.target_country
        : null;

  const broad_field =
    typeof profile?.broad_field === "string"
      ? profile.broad_field
      : typeof raw.broad_field === "string"
        ? raw.broad_field
        : null;

  const target_role = typeof goals?.target_role === "string" ? goals.target_role.trim() : null;
  const five_year_goal =
    typeof goals?.five_year_goal === "string" ? goals.five_year_goal.trim() : null;

  const grad_score =
    typeof raw.grad_score === "number" && Number.isFinite(raw.grad_score)
      ? raw.grad_score
      : null;

  return {
    cgpa,
    internship_count,
    skills,
    target_country,
    broad_field,
    target_role,
    five_year_goal,
    profile_completeness: pc != null ? Math.min(100, Math.max(0, pc)) : null,
    grad_score,
  };
}

export function mergeEnrichProfile(
  a: FeatureEnrichProfile | null,
  b: FeatureEnrichProfile | null | undefined
): FeatureEnrichProfile | null {
  if (!a && !b) return null;
  if (!a) return b ?? null;
  if (!b) return a;
  return {
    cgpa: b.cgpa ?? a.cgpa,
    internship_count: Math.max(a.internship_count, b.internship_count),
    skills: b.skills.length >= a.skills.length ? b.skills : a.skills,
    target_country: b.target_country ?? a.target_country,
    broad_field: b.broad_field ?? a.broad_field,
    target_role: b.target_role ?? a.target_role,
    five_year_goal: b.five_year_goal ?? a.five_year_goal,
    profile_completeness: b.profile_completeness ?? a.profile_completeness,
    grad_score: b.grad_score ?? a.grad_score,
  };
}

/**
 * Enrich normalized module view with derived insights, mandatory actions, and fallback summary.
 */
export function enrichFeatureData(
  rawData: Record<string, unknown>,
  profileInput: FeatureEnrichProfile | null | undefined,
  base: FeatureModuleView
): FeatureModuleView {
  const extracted = extractEnrichProfileFromRaw(rawData);
  const profile = mergeEnrichProfile(extracted, profileInput);
  const p = profile ?? {
    cgpa: null,
    internship_count: 0,
    skills: [],
    target_country: null,
    broad_field: null,
    target_role: null,
    five_year_goal: null,
    profile_completeness: null,
    grad_score: null,
  };

  let insights = [...base.insights];
  let reasons = [...base.reasons];

  if (p.cgpa != null && p.cgpa < 7) {
    const line = "Your academic score may limit top-tier university options.";
    if (!insights.some((x) => x.toLowerCase().includes("academic"))) {
      insights = [line, ...insights];
    }
    if (!reasons.some((x) => x.includes("CGPA") || x.includes("academic"))) {
      reasons.push(
        "Admissions teams weigh trajectory — offset a lower band with testing, projects, and realistic tiering."
      );
    }
  }

  if (p.internship_count === 0) {
    const line = "Lack of practical experience is reducing your chances.";
    if (!insights.some((x) => x.toLowerCase().includes("practical"))) {
      insights = [line, ...insights];
    }
    if (!reasons.some((x) => x.includes("internship") || x.includes("experience"))) {
      reasons.push("Programs reward proof you can ship work — internships and structured projects count.");
    }
  }

  if (p.skills.length >= 5) {
    const line = "Your technical skills are a strong advantage.";
    if (!insights.some((x) => x.toLowerCase().includes("technical skills"))) {
      insights = [line, ...insights];
    }
  }

  insights = dedupeLines(insights, 16);
  reasons = dedupeLines(reasons, 12);

  const readiness = buildReadinessPercent(p, rawData);
  const goalLabel =
    p.target_role?.trim() ||
    p.five_year_goal?.slice(0, 48)?.trim() ||
    p.broad_field?.trim() ||
    "your goals";
  const countryLabel = p.target_country?.trim() || "your target destinations";
  const gap = pickGapFocus(p);

  let summary = base.summary.trim();
  if (needsSyntheticSummary(summary)) {
    summary = `You are currently ${readiness}% ready for ${goalLabel} in ${countryLabel}. Your main focus should be ${gap}.`;
  }

  const forcedActions = [...CANONICAL_ACTION_SEEDS];
  const actions = dedupeLines([...base.actions, ...forcedActions], 14);

  const metrics =
    base.metrics.length > 0
      ? base.metrics
      : [
          ...(readiness > 0
            ? [{ label: "Readiness signal", value: `${readiness}%` }]
            : []),
          ...(p.profile_completeness != null
            ? [{ label: "Profile", value: `${Math.round(p.profile_completeness)}% complete` }]
            : []),
        ];

  return {
    summary: humanizeCurrency(summary),
    insights: (insights.length ? insights : [EMPTY_SENTINEL]).map(humanizeCurrency),
    reasons: (reasons.length
      ? reasons
      : [
          "Clear priorities beat scattered effort — lock one gap this month and evidence it on your profile.",
        ]).map(humanizeCurrency),
    actions: (actions.length ? actions : [...CANONICAL_ACTION_SEEDS]).map(humanizeCurrency),
    metrics,
  };
}

export { EMPTY_SENTINEL };
