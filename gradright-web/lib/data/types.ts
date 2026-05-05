/** Curated simulation datasets — deterministic, filterable by profile (no runtime fabrication). */

export type UniversityRow = {
  id: string;
  name: string;
  country: string;
  ranking_band: "top20" | "top50" | "top100" | "regional";
  annual_tuition_usd: number;
  placement_index: number;
  roi_index: number;
  fields: string[];
  notes: string;
};

export type JobRow = {
  id: string;
  title: string;
  field: string;
  country: string;
  median_salary_usd: number;
  demand_index: number;
  months_to_typical_offer: number;
};

export type ScholarshipRow = {
  id: string;
  name: string;
  host_country: string;
  field_focus: string[];
  coverage: "full" | "partial" | "stipend";
  competitiveness: "high" | "medium" | "selective";
  season: string;
};

export type VisaRow = {
  id: string;
  country: string;
  route_name: string;
  typical_processing_months: number;
  post_study_work_months: number;
  summary: string;
};

export type CostRow = {
  id: string;
  country: string;
  region_tier: "major_city" | "mid" | "affordable";
  living_monthly_usd: number;
  tuition_public_usd_year: number;
};

export type NewsRow = {
  id: string;
  source: string;
  headline: string;
  summary: string;
  url: string;
  countries: string[];
  fields: string[];
};
