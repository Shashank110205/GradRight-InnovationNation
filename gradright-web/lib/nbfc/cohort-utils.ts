/** Buckets for NBFC portfolio heatmap (FEATURE_SPECS). */
export const NBFC_PROGRAM_TYPES = [
  "CS",
  "Engineering",
  "Business",
  "Life Sciences",
  "Other",
] as const;

export type NBFCProgramType = (typeof NBFC_PROGRAM_TYPES)[number];

export const NBFC_INSTITUTE_TIERS = [
  "IIT/IIM",
  "NIT/Tier2",
  "Other",
] as const;

export type NBFCInstituteTier = (typeof NBFC_INSTITUTE_TIERS)[number];

const CS_RE =
  /computer|software|data science|machine learning|\bml\b|\bai\b|cyber|informatics|developer/i;
const ENG_RE =
  /mechanical|electrical|civil|chemical|aerospace|materials|robotics|automotive/i;
const BUS_RE =
  /business|mba|management|finance|marketing|economics|accounting/i;
const LIFE_RE =
  /biology|biotech|medicine|pharma|neuroscience|chemistry|biomedical|public health/i;

export function classifyProgramType(program: string | null | undefined): NBFCProgramType {
  const p = (program ?? "").trim();
  if (!p) return "Other";
  if (CS_RE.test(p)) return "CS";
  if (LIFE_RE.test(p)) return "Life Sciences";
  if (BUS_RE.test(p)) return "Business";
  if (ENG_RE.test(p)) return "Engineering";
  return "Other";
}

export function normalizeInstituteTier(
  profileTier: string | null | undefined,
  instituteName: string | null | undefined,
  loanInstitute: string | null | undefined
): NBFCInstituteTier {
  const blob = `${profileTier ?? ""} ${instituteName ?? ""} ${loanInstitute ?? ""}`.toLowerCase();
  if (/\biit\b|\biim\b/.test(blob)) return "IIT/IIM";
  if (/\bnit\b|tier[\s-]?2|tier2|tier ii/.test(blob)) return "NIT/Tier2";
  return "Other";
}

export function riskHeatColor(score: number): string {
  if (score >= 66) return "#22c55e";
  if (score >= 41) return "#f59e0b";
  return "#ef4444";
}

/** Map URL/query slug to a fixed program bucket for filters. */
export function parseNbfcProgramTypeParam(
  raw: string | null | undefined
): NBFCProgramType | undefined {
  if (!raw?.trim()) return undefined;
  const s = raw.trim().toLowerCase().replace(/-/g, "_");
  const map: Record<string, NBFCProgramType> = {
    cs: "CS",
    engineering: "Engineering",
    business: "Business",
    life_sciences: "Life Sciences",
    other: "Other",
  };
  if (map[s]) return map[s];
  return NBFC_PROGRAM_TYPES.find(
    (t) => t.toLowerCase() === raw.trim().toLowerCase()
  );
}
