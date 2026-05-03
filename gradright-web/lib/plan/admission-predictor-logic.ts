import { z } from "zod";

import type { GlobalUniversityTier } from "@/lib/ai/risk-engine/data/university-tiers";
import { globalTierForUniversityName } from "@/lib/ai/risk-engine/data/university-tiers";
import type { AdmissionPredictorPostBody } from "@/lib/validations/plan";

/** Python risk-service `AdmissionOutput`. */
export const riskEngineAdmissionOutputSchema = z.object({
  admission_prob: z.number(),
  admit_band: z.enum(["low", "medium", "high"]),
  safer_alternatives: z.array(z.string()),
  ambitious_alternatives: z.array(z.string()),
  key_factors: z.array(z.string()),
});

export type RiskEngineAdmissionOutput = z.infer<
  typeof riskEngineAdmissionOutputSchema
>;

export function primaryUniversityFromPayload(targetUniversity: string): string {
  const parts = targetUniversity
    .split(/\||;/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] ?? targetUniversity.trim();
}

/** 0–1 signal for fallback formula's test term. */
export function normaliseTestScore(
  testScores: AdmissionPredictorPostBody["testScores"]
): number {
  const parts: number[] = [];
  const { gre, gmat, ielts, toefl } = testScores;

  if (gre != null && gre >= 260 && gre <= 340) {
    parts.push((gre - 260) / 80);
  }
  if (gmat != null && gmat >= 200 && gmat <= 805) {
    parts.push((gmat - 200) / 605);
  }
  if (ielts != null && ielts >= 0 && ielts <= 9) {
    parts.push(ielts / 9);
  }
  if (toefl != null && toefl >= 0 && toefl <= 120) {
    parts.push(toefl / 120);
  }

  if (parts.length === 0) return 0.35;

  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  return Math.min(1, Math.max(0, avg));
}

/** 0–1 for fallback formula — higher when targets are less selective. */
export function tierMatchScore(country: string, universityLabel: string): number {
  const primary = primaryUniversityFromPayload(universityLabel);
  const tier = globalTierForUniversityName(primary);
  const base: Record<GlobalUniversityTier, number> = {
    Other: 1,
    Top100: 0.85,
    Top50: 0.67,
    Top10: 0.5,
  };
  let v = base[tier];
  if (country.includes("India") || country.toLowerCase().includes("domestic")) {
    v = Math.min(1, v + 0.04);
  }
  return Math.min(1, Math.max(0, v));
}

export function computeFallbackAdmissionProbability(
  body: AdmissionPredictorPostBody
): number {
  const test = normaliseTestScore(body.testScores);
  const tier = tierMatchScore(body.country, body.targetUniversity);
  const profileBoost =
    ((body.publications * 5 + body.extracurriculars * 5) * 20) / 100;

  let score = (body.cgpa / 10) * 35 + test * 25 + tier * 20 + profileBoost;

  score = Math.min(100, Math.max(0, score));
  return Math.round(score * 100) / 100;
}

export function gmatToGreScore(gmat: number): number {
  const g = Math.min(805, Math.max(200, gmat));
  return Math.round(260 + ((g - 200) / 605) * 80);
}

export function toeflToIeltsApprox(toefl: number): number {
  const t = Math.min(120, Math.max(31, toefl));
  const ielts = ((t - 31) / 89) * 9;
  return Math.round(ielts * 10) / 10;
}

export function buildRiskEngineAdmissionBody(body: AdmissionPredictorPostBody): {
  cgpa_normalized: number;
  gre_score: number | null;
  ielts_score: number | null;
  work_experience_years: number;
  target_program: string;
  target_university_tier: GlobalUniversityTier;
  target_country: string;
} {
  const primary = primaryUniversityFromPayload(body.targetUniversity);
  const tier = globalTierForUniversityName(primary);

  let gre: number | null = null;
  if (body.testScores.gre != null) {
    gre = Math.round(body.testScores.gre);
  } else if (body.testScores.gmat != null) {
    gre = gmatToGreScore(body.testScores.gmat);
  }

  let ielts: number | null = null;
  if (body.testScores.ielts != null) {
    ielts = Math.round(body.testScores.ielts * 10) / 10;
  } else if (body.testScores.toefl != null) {
    ielts = toeflToIeltsApprox(body.testScores.toefl);
  }

  return {
    cgpa_normalized: Math.min(1, Math.max(0, body.cgpa / 10)),
    gre_score: gre,
    ielts_score: ielts,
    work_experience_years: Math.round(body.workExperienceYears),
    target_program: body.targetCourse,
    target_university_tier: tier,
    target_country: body.country,
  };
}

function padToThree(
  primary: string[],
  fillers: [string, string, string]
): string[] {
  const out = primary.slice(0, 3);
  let i = 0;
  while (out.length < 3 && i < fillers.length) {
    if (!out.includes(fillers[i])) out.push(fillers[i]);
    i += 1;
  }
  return out.slice(0, 3);
}

export function matchSchoolTemplates(
  country: string,
  course: string
): [string, string, string] {
  return [
    `${country} universities where typical admits overlap your profile for ${course}`,
    `Programs one selectivity band below your reach target with strong ${course} outcomes`,
    `Rolling-admission targets that fit ${course} timelines in ${country}`,
  ];
}

export function safetyReachFillers(
  country: string,
  course: string,
  tier: GlobalUniversityTier
): { safety: [string, string, string]; reach: [string, string, string] } {
  return {
    safety: [
      `Accredited ${country} programs with documented ${course} placement below Top50 selectivity`,
      `Regional public universities with transparent median stats for ${course}`,
      `Partner institutions where your CGPA sits above the recent class median`,
    ],
    reach: [
      tier === "Top10"
        ? `Ultra-selective peers only after tests meet or exceed published medians`
        : `Stretch schools one tier above your modeled comfort band`,
      `Targets where ${course} cohorts favour stronger quant or research signals`,
      `Peer schools in ${country} with higher yield—plan backup deadlines accordingly`,
    ],
  };
}

export function deriveStrengthsWeaknesses(
  body: AdmissionPredictorPostBody,
  opts: {
    source: "engine" | "fallback";
    engine?: RiskEngineAdmissionOutput | null;
    admissionProbability: number;
  }
): { strengths: string[]; weaknesses: string[] } {
  const tier = globalTierForUniversityName(
    primaryUniversityFromPayload(body.targetUniversity)
  );

  let strengths: string[] = [];
  let weaknesses: string[] = [];

  if (opts.source === "engine" && opts.engine) {
    strengths = [...opts.engine.key_factors];
    if (body.workExperienceYears >= 2) {
      strengths.push(`${body.workExperienceYears} years of relevant experience`);
    }
    if (body.publications > 0) {
      strengths.push(`${body.publications} publication(s)`);
    }
    strengths = strengths.filter(Boolean).slice(0, 3);
    if (strengths.length === 0) {
      strengths = [
        `Academic and target context modeled for ${body.country}`,
        `${body.degree} pathway in ${body.targetCourse}`,
      ];
    }
  } else {
    if (body.cgpa >= 8.5) strengths.push(`Strong CGPA (${body.cgpa.toFixed(1)}/10)`);
    else if (body.cgpa >= 7.5) strengths.push(`Solid CGPA (${body.cgpa.toFixed(1)}/10)`);
    else strengths.push(`CGPA (${body.cgpa.toFixed(1)}/10) within modeled range`);

    if (body.workExperienceYears >= 2) {
      strengths.push(`${body.workExperienceYears} years of work experience`);
    }
    if (body.publications > 0) {
      strengths.push(`${body.publications} publication(s) signal research depth`);
    }
    if (body.extracurriculars > 0) {
      strengths.push(`${body.extracurriculars} extracurricular milestone(s)`);
    }
    const ts = normaliseTestScore(body.testScores);
    if (ts >= 0.65) strengths.push("Standardized tests fall in a competitive band");
    strengths = strengths.slice(0, 3);
  }

  if (opts.source === "engine" && opts.engine) {
    const band = opts.engine.admit_band;
    if (band === "low") {
      weaknesses.push("Modeled probability sits in the lower band for this target tier");
      weaknesses.push("Shortlist may be reach-heavy relative to current signals");
    } else if (band === "medium") {
      weaknesses.push("Outcomes sensitive to essays, deadlines, and cohort competition");
    } else {
      weaknesses.push("Even strong modeled odds are not an admit guarantee");
    }
    if (
      body.testScores.gre == null &&
      body.testScores.gmat == null &&
      body.testScores.ielts == null &&
      body.testScores.toefl == null
    ) {
      weaknesses.push(
        "No GRE/GMAT or English score included—estimate uses partial testing context"
      );
    }
  } else {
    if (tier === "Top10" && body.cgpa < 8.5) {
      weaknesses.push("CGPA below typical Top10 admit ranges in many programs");
    }
    if (!body.testScores.gre && !body.testScores.gmat) {
      weaknesses.push("Missing GRE/GMAT reduces comparability to published cohort stats");
    }
    if (!body.testScores.ielts && !body.testScores.toefl) {
      weaknesses.push("No English proficiency score provided for international competition context");
    }
    if (opts.admissionProbability < 45) {
      weaknesses.push("Overall modeled likelihood is modest—widen safety targets");
    }
  }

  weaknesses = weaknesses.slice(0, 3);
  if (weaknesses.length === 0) {
    weaknesses.push(
      "Admissions remain discretionary—use this estimate alongside official requirements"
    );
  }

  return { strengths: strengths.slice(0, 3), weaknesses };
}

export function mapEngineToLists(
  body: AdmissionPredictorPostBody,
  engine: RiskEngineAdmissionOutput
): {
  safetySchools: string[];
  matchSchools: string[];
  reachSchools: string[];
} {
  const tier = globalTierForUniversityName(
    primaryUniversityFromPayload(body.targetUniversity)
  );
  const fill = safetyReachFillers(body.country, body.targetCourse, tier);
  const matchTpl = matchSchoolTemplates(body.country, body.targetCourse);

  return {
    safetySchools: padToThree(engine.safer_alternatives, fill.safety),
    matchSchools: [...matchTpl],
    reachSchools: padToThree(engine.ambitious_alternatives, fill.reach),
  };
}

export function mapFallbackToLists(body: AdmissionPredictorPostBody): {
  safetySchools: string[];
  matchSchools: string[];
  reachSchools: string[];
} {
  const tier = globalTierForUniversityName(
    primaryUniversityFromPayload(body.targetUniversity)
  );
  const fill = safetyReachFillers(body.country, body.targetCourse, tier);
  const matchTpl = matchSchoolTemplates(body.country, body.targetCourse);

  return {
    safetySchools: padToThree([], fill.safety),
    matchSchools: [...matchTpl],
    reachSchools: padToThree([], fill.reach),
  };
}
