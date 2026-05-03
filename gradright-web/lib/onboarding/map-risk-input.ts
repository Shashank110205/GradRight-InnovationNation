import type { OnboardingAnswers } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

const COUNTRY_CODE_MAP: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "UK",
  Canada: "Canada",
  Germany: "Germany",
  Australia: "Australia",
  "India (Domestic)": "domestic",
};

const PROGRAM_TYPE_BY_BROAD_FIELD: Record<string, string> = {
  "Computer Science / IT": "CS",
  Engineering: "Engineering",
  "Business / Finance": "Business",
  "Life Sciences / Healthcare": "Life Sciences",
  "Arts / Design / Social Sciences": "Other",
  Other: "Other",
};

/** Pick one canonical country code for the rule engine from a stored target_country string. */
export function primaryCountryCodeFromTargetCountry(
  targetCountry: string | null | undefined
): string {
  const raw = targetCountry?.trim() ?? "";
  const countries = parseTargetCountries(raw);
  const codes = countries.map((c) => COUNTRY_CODE_MAP[c]).filter(Boolean);
  if (codes.includes("US")) return "US";
  if (codes.includes("UK")) return "UK";
  if (codes.length > 0) return codes[0]!;
  return COUNTRY_CODE_MAP[raw] ?? "US";
}

export function programTypeFromBroadField(
  broadField: string | null | undefined
): string {
  if (!broadField) return "Other";
  return PROGRAM_TYPE_BY_BROAD_FIELD[broadField] ?? "Other";
}

/** Pick one canonical country code for the rule engine from multi-destination answers. */
function primaryCountryCode(answers: OnboardingAnswers): string {
  return primaryCountryCodeFromTargetCountry(answers.target_country);
}

/** JSON body for POST RISK_ENGINE_URL/score (FEATURE_SPECS ScoreInput-style). */
export interface RiskEngineRequestBody {
  institute_tier: string;
  program_type: string;
  cgpa_normalized: number;
  internship_months: number;
  certification_count: number;
  target_country: string;
  target_sector: string;
  work_experience_years: number;
}

export function mapAnswersToRiskEngineBody(
  answers: OnboardingAnswers
): RiskEngineRequestBody {
  let work_experience_years = 0;
  if (answers.current_academic_level.includes("1-3")) {
    work_experience_years = 2;
  } else if (answers.current_academic_level.includes("3+")) {
    work_experience_years = 4;
  }

  const programType = programTypeFromBroadField(answers.broad_field);

  return {
    institute_tier: "Other",
    program_type: programType,
    cgpa_normalized: 0.72,
    internship_months: 0,
    certification_count: 0,
    target_country: primaryCountryCode(answers),
    target_sector: programType,
    work_experience_years,
  };
}
