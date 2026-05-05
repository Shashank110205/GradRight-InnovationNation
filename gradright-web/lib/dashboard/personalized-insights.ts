import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import { getUniversities } from "@/lib/data";
import type { UniversityRow } from "@/lib/data/types";
import {
  buildStudentIntelligence,
  type StudentIntelligence,
} from "@/lib/profile/student-intelligence";
import type { StudentProfile } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

function engineReadiness(snapshot: Record<string, unknown> | undefined): {
  strengths: string[];
  improvement_areas: string[];
} | null {
  if (!snapshot) return null;
  const raw = snapshot.engine_readiness;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { strengths?: unknown; improvement_areas?: unknown };
  const strengths = Array.isArray(o.strengths)
    ? o.strengths.filter((x): x is string => typeof x === "string")
    : [];
  const improvement_areas = Array.isArray(o.improvement_areas)
    ? o.improvement_areas.filter((x): x is string => typeof x === "string")
    : [];
  if (!strengths.length && !improvement_areas.length) return null;
  return { strengths, improvement_areas };
}

export type DashboardPersonalizedLinesPrecomputed = {
  intelligence: StudentIntelligence;
  topUniversity: UniversityRow | null;
  /** Prefer hub `system.profile_completeness` over DB when present. */
  profileHubCompleteness?: number | null;
};

/** Short, profile-grounded lines for the dashboard hero (no static peer percent fiction). */
export function buildDashboardPersonalizedLines(
  profile: StudentProfile | null,
  risk: LatestRiskScoreSummary | null,
  precomputed?: DashboardPersonalizedLinesPrecomputed | null
): string[] {
  const lines: string[] = [];
  const intel =
    precomputed?.intelligence ?? buildStudentIntelligence(profile);

  const completeness = Math.min(
    100,
    Math.max(
      0,
      precomputed?.profileHubCompleteness ??
        profile?.profile_completeness_score ??
        0
    )
  );
  const countries = parseTargetCountries(profile?.target_country ?? "");
  if (!countries.length && completeness < 35) {
    lines.push(
      "Add your target countries and field in profile intelligence — the dashboard will then rank reference costs, news, and university signals to match your plan."
    );
  }

  if (countries.some((c) => c.toLowerCase().includes("germany")) &&
      countries.some((c) => c.toLowerCase().includes("united states") || c.toLowerCase().includes("usa"))) {
    lines.push(
      "Because you are weighing Germany alongside the United States, public-band tuition in Germany is typically much lower than comparable US programs in our reference cost set — use that spread when stress-testing loan size."
    );
  } else if (countries.some((c) => c.toLowerCase().includes("germany"))) {
    lines.push(
      "Because you are targeting Germany, annualized tuition in the reference university set is usually modest versus Anglo destinations — keep liquidity focused on blocked account and living costs."
    );
  } else if (
    countries.some(
      (c) =>
        c.toLowerCase().includes("united states") || c.toLowerCase().includes("usa")
    )
  ) {
    lines.push(
      "Because you are targeting the United States, expect higher sticker tuition and stronger nominal salaries in the bundled job benchmarks — model total cost of attendance, not headline salary alone."
    );
  }

  const uni = precomputed
    ? (precomputed.topUniversity ?? null)
    : (getUniversities(profile, 1)[0] ?? null);
  const uniLabel = uni?.name?.replace(/\s+cohort pack$/i, "") ?? "";
  const cg = profile?.cgpa != null ? Number(profile.cgpa) : NaN;
  const scale = profile?.cgpa_scale != null ? Number(profile.cgpa_scale) : NaN;
  if (uni && Number.isFinite(cg) && Number.isFinite(scale) && scale > 0) {
    const ratio = cg / scale;
    const band =
      uni.ranking_band === "top20"
        ? "top-20"
        : uni.ranking_band === "top50"
          ? "top-50"
          : uni.ranking_band === "top100"
            ? "top-100"
            : "regional";
    lines.push(
      `With CGPA near ${(ratio * 100).toFixed(0)}% of your scale, ${uniLabel} (${uni.country}) maps to ${band}-tier programs in your Explore set — ${uni.notes}`
    );
  } else if (uni) {
    lines.push(`Strong match to explore: ${uniLabel} (${uni.country}) — ${uni.notes}`);
  }

  if (risk?.placement_prob_6m != null) {
    lines.push(
      `Your latest stored placement outlook (6-month horizon) is about ${Math.round(risk.placement_prob_6m * 100)}% — grounded in the same scorer inputs used for Funding and NBFC views.`
    );
  }

  const ready = engineReadiness(risk?.input_snapshot);
  if (ready?.strengths[0]) {
    lines.push(`Strength signal from the scorer: ${ready.strengths[0]}`);
  } else if (intel.career_direction !== "forming" && intel.career_direction !== "unknown") {
    lines.push(`Career direction read: ${intel.career_direction}.`);
  }

  if (ready?.improvement_areas[0]) {
    lines.push(`Focus next: ${ready.improvement_areas[0]}`);
  }

  if (!lines.length) {
    lines.push(
      intel.profile_summary.trim() ||
        "Complete onboarding and profile intelligence so this panel can tie costs, placement, and news to your real targets."
    );
  }

  return lines.slice(0, 5);
}
