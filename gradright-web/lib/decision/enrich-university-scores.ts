import type { GroundedContextV1 } from "@/lib/profile/grounded-context";

import { parseFeesCostIndex, parseSalaryMidLpa } from "./parse-roi";

export type UniversityDecisionRow = {
  name: string;
  country: string;
  tier: "safe" | "moderate" | "ambitious";
  base_score: number;
  final_score: number;
  acceptance_rate: string;
  requirements: string[];
  fees: string;
  gaps: string[];
  actions: string[];
  roi_proxy: number | null;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function acceptanceRatePenalty(rate: string): number {
  const s = rate.toLowerCase();
  if (
    /\b1\s*-\s*5|\bunder\s*5|<\s*5%|very\s*low|extremely\s*selective/i.test(s)
  ) {
    return -12;
  }
  if (/\b5\s*-\s*10|6\s*-\s*10|single.?digit/i.test(s)) {
    return -6;
  }
  if (/\bhigh\s*acceptance|>\s*50|60%|70%/i.test(s)) {
    return 4;
  }
  return 0;
}

/** Overlap between resume skills (lowercased) and job-market skills from context. */
function skillMatchBoost(
  resumeSkills: string[],
  jobSkills: string[]
): number {
  if (!resumeSkills.length || !jobSkills.length) return 0;
  const rs = new Set(resumeSkills.map((x) => x.toLowerCase().trim()).filter(Boolean));
  let hit = 0;
  for (const j of jobSkills) {
    const t = j.toLowerCase().trim();
    if (!t) continue;
    for (const r of rs) {
      if (r.includes(t) || t.includes(r)) {
        hit++;
        break;
      }
    }
  }
  return Math.min(10, hit * 2);
}

function feesVsSalaryPenalty(
  salaryMidLpa: number | null,
  feesIndex: number | null
): number {
  if (salaryMidLpa == null || feesIndex == null) return 0;
  const ratio = salaryMidLpa / (feesIndex + 0.5);
  if (ratio < 1.5) return -8;
  if (ratio < 2.5) return -4;
  if (ratio > 6) return 3;
  return 0;
}

export function enrichUniversities(input: {
  context: GroundedContextV1 | null | undefined;
  admissionProbByName: Map<string, number>;
  resumeSkills: string[];
}): {
  rows: UniversityDecisionRow[];
  roi_summary: {
    salary_mid_lpa: number | null;
    aggregate_fee_index: number | null;
    ratio: number | null;
  };
} {
  const ctx = input.context;
  const unis = ctx?.universities ?? [];
  const jobSkills = ctx?.job_market?.skills ?? [];
  const salaryMid = ctx?.job_market?.salary_range
    ? parseSalaryMidLpa(ctx.job_market.salary_range)
    : null;

  let feeSum = 0;
  let feeN = 0;

  const rows: UniversityDecisionRow[] = unis.map((u) => {
    const base =
      input.admissionProbByName.get(u.name.trim()) ??
      input.admissionProbByName.get(u.name.trim().toLowerCase()) ??
      0;

    let adjusted = base;
    adjusted += acceptanceRatePenalty(u.acceptance_rate);
    adjusted += skillMatchBoost(input.resumeSkills, jobSkills);
    const fi = parseFeesCostIndex(u.fees);
    if (fi != null) {
      feeSum += fi;
      feeN += 1;
    }
    adjusted += feesVsSalaryPenalty(salaryMid, fi);

    const gaps = [...(u.gaps ?? [])];
    const actions = [...(u.actions_to_improve ?? [])];

    return {
      name: u.name,
      country: u.country,
      tier: u.tier,
      base_score: Math.round(base * 10) / 10,
      final_score: Math.round(clamp(adjusted, 0, 100) * 10) / 10,
      acceptance_rate: u.acceptance_rate,
      requirements: u.requirements ?? [],
      fees: u.fees,
      gaps,
      actions,
      roi_proxy:
        salaryMid != null && fi != null
          ? Math.round((salaryMid / (fi + 0.1)) * 100) / 100
          : null,
    };
  });

  rows.sort((a, b) => b.final_score - a.final_score);

  const aggregateFee = feeN > 0 ? feeSum / feeN : null;
  const ratio =
    salaryMid != null && aggregateFee != null && aggregateFee > 0
      ? Math.round((salaryMid / aggregateFee) * 100) / 100
      : null;

  return {
    rows,
    roi_summary: {
      salary_mid_lpa: salaryMid,
      aggregate_fee_index: aggregateFee,
      ratio,
    },
  };
}
