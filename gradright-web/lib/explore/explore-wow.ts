import { DISCOVER_ARTICLES, type DiscoverArticle } from "@/lib/discover/articles";
import { getCosts, getJobs, getScholarships, getUniversities, getVisa } from "@/lib/data";
import type {
  CostRow,
  JobRow,
  ScholarshipRow,
  UniversityRow,
  VisaRow,
} from "@/lib/data/types";
import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import type { StudentIntelligence } from "@/lib/profile/student-intelligence";
import type { StudentProfile } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";
import { buildWowTrustSnapshot, type WowTrustSnapshot } from "@/lib/trust-layer/wow-trust-snapshot";

export type ItemExplanation = {
  reason_short: string;
  reason_detailed: string;
};

export type ExploreBadge = "best_fit" | "high_roi" | "safe_option";

export type ExploreUniversityCard = {
  university: UniversityRow;
  explanation: ItemExplanation;
  badges: ExploreBadge[];
  finance: {
    estimated_tuition_usd_year: number;
    estimated_living_year_usd: number;
    reference_salary_usd: number;
    loan_likely: boolean;
    scholarship_chance_label: string;
    roi_years_approx: number | null;
  };
  explainability: {
    why: string;
    risk: string;
    next: string;
  };
};

export type ExploreJobCard = {
  job: JobRow;
  explanation: ItemExplanation;
  recommended_degrees: string[];
  top_universities: Pick<UniversityRow, "id" | "name" | "country" | "ranking_band">[];
  placement_outlook_pct: number | null;
  explainability: { why: string; risk: string; next: string };
};

export type ExploreCountryCard = {
  country: string;
  visa: VisaRow | null;
  explanation: ItemExplanation;
  post_study_work_months: number | null;
  visa_difficulty_label: string;
  job_conversion_pct: number | null;
  explainability: { why: string; risk: string; next: string };
};

export type ExploreScholarshipCard = {
  scholarship: ScholarshipRow;
  explanation: ItemExplanation;
  explainability: { why: string; risk: string; next: string };
};

export type ExploreExperiencePayload = {
  profile: StudentProfile | null;
  studentIntelligence: StudentIntelligence;
  profileCompleteness: number;
  /** When true, dataset sections stay in "unlock" mode (no generic fallbacks). */
  signalsReady: boolean;
  universities: ExploreUniversityCard[];
  jobs: ExploreJobCard[];
  countries: ExploreCountryCard[];
  scholarships: ExploreScholarshipCard[];
  articles: DiscoverArticle[];
  exploreChatSeed: string;
  wowTrustSnapshot: WowTrustSnapshot;
};

function bandLabel(b: string): string {
  return b.replace(/_/g, " ");
}

function visaDifficulty(v: VisaRow): string {
  const m = v.typical_processing_months;
  if (m <= 3) return "Moderate paperwork load";
  if (m <= 5) return "Plan for moderate processing time";
  return "Higher documentation and timing sensitivity";
}

function jobConversionPct(visa: VisaRow | null, job: JobRow | null): number | null {
  if (!visa || !job) return null;
  const ps = Math.min(48, visa.post_study_work_months) / 48;
  const demand = job.demand_index / 100;
  return Math.round(Math.min(94, Math.max(38, (ps * 0.55 + demand * 0.45) * 100)));
}

function costForCountry(country: string, profile: StudentProfile | null): CostRow | null {
  const rows = getCosts(profile, 12);
  const hit =
    rows.find((c) => c.country.toLowerCase() === country.toLowerCase()) ?? rows[0] ?? null;
  return hit;
}

function refJobForCountry(profile: StudentProfile | null, country: string): JobRow | null {
  const ranked = getJobs(profile, 12);
  const local = ranked.find((j) => j.country.toLowerCase() === country.toLowerCase());
  return local ?? ranked[0] ?? null;
}

function explainUniversity(
  u: UniversityRow,
  profile: StudentProfile | null,
  intel: StudentIntelligence,
  cost: CostRow | null,
  refJob: JobRow | null
): ItemExplanation {
  const field = profile?.broad_field?.trim() || "your stated field";
  const cgpa = bandLabel(intel.cgpa_band);
  const risk = bandLabel(intel.risk_level);
  const short = `Aligned with your ${field} focus and ${cgpa} academic band in ${u.country}.`;
  const detail = `Based on your profile strength (${cgpa} CGPA band, ${risk} risk appetite, ${bandLabel(
    intel.financial_capacity
  )} financial capacity), the ${u.ranking_band} band is a strong fit for programs in ${u.fields.slice(0, 2).join(
    " / "
  )}. ${u.notes}`;
  return { reason_short: short, reason_detailed: detail };
}

function universityFinance(
  u: UniversityRow,
  profile: StudentProfile | null,
  intel: StudentIntelligence,
  cost: CostRow | null,
  refJob: JobRow | null
): ExploreUniversityCard["finance"] {
  const tuition = u.annual_tuition_usd > 0 ? u.annual_tuition_usd : (cost?.tuition_public_usd_year ?? 0);
  const living = (cost?.living_monthly_usd ?? 1200) * 12;
  const salary = refJob?.median_salary_usd ?? 72000;
  const allIn = tuition + living;
  const takeHome = salary * 0.42;
  const roiYears = takeHome > 0 ? Math.round((allIn / takeHome) * 10) / 10 : null;
  const loanLikely =
    profile?.loan_needed !== false &&
    (intel.financial_capacity === "constrained" ||
      intel.financial_capacity === "unspecified" ||
      intel.financial_capacity === "medium");
  let sch = "Moderate — stack merit + program-specific aid early.";
  if (intel.scholarship_need === "high") sch = "Higher intent match — prioritize stipend-bearing programs.";
  if (intel.scholarship_need === "medium") sch = "Balanced — mix reach merit awards with safer partial aid.";
  return {
    estimated_tuition_usd_year: Math.round(tuition),
    estimated_living_year_usd: Math.round(living),
    reference_salary_usd: Math.round(salary),
    loan_likely: loanLikely,
    scholarship_chance_label: sch,
    roi_years_approx: roiYears,
  };
}

function universityExplainability(
  u: UniversityRow,
  intel: StudentIntelligence,
  finance: ExploreUniversityCard["finance"]
): ExploreUniversityCard["explainability"] {
  return {
    why: `This pack scores well on ROI (${u.roi_index.toFixed(0)} index) and placement (${u.placement_index}) versus peers in the bundled reference set.`,
    risk: `If ${bandLabel(intel.financial_capacity)} funding is tight, sticker + living near $${(
      finance.estimated_tuition_usd_year + finance.estimated_living_year_usd
    ).toLocaleString()}/yr can stress cash flow before internships convert.`,
    next: finance.loan_likely
      ? "Model a conservative loan envelope in Funding, then compare two backup programs with lower living bands."
      : "Capture proof-of-funds narrative early and line up partial scholarship asks before deposit deadlines.",
  };
}

function universityBadges(u: UniversityRow, index: number): ExploreBadge[] {
  const badges = new Set<ExploreBadge>();
  if (index === 0) badges.add("best_fit");
  if (u.roi_index >= 88) badges.add("high_roi");
  if (u.ranking_band === "regional" || u.placement_index >= 82) badges.add("safe_option");
  return [...badges];
}

function explainJob(
  j: JobRow,
  profile: StudentProfile | null,
  intel: StudentIntelligence
): ItemExplanation {
  const deg = profile?.degree_type?.trim() || "your target graduate degree";
  const short = `Demand-weighted outlook for ${j.title} in ${j.country} — matches your ${deg} pathway.`;
  const detail = `Your intelligence layer shows ${bandLabel(intel.career_direction)} career direction, ${bandLabel(
    intel.cgpa_band
  )} academics, and ${bandLabel(intel.risk_level)} risk posture. This role cluster sits at ${j.demand_index}/100 demand in the bundled dataset with median pay around $${j.median_salary_usd.toLocaleString()}.`;
  return { reason_short: short, reason_detailed: detail };
}

function topUnisForJobField(profile: StudentProfile | null, job: JobRow, limit: number) {
  const pool = getUniversities(profile, 20).filter((u) =>
    u.fields.some((f) => f.toLowerCase().includes(job.field.toLowerCase()) || job.field.toLowerCase().includes(f.toLowerCase()))
  );
  const list = pool.length ? pool : getUniversities(profile, limit);
  return list.slice(0, limit).map((u) => ({
    id: u.id,
    name: u.name,
    country: u.country,
    ranking_band: u.ranking_band,
  }));
}

function jobPlacementOutlook(
  job: JobRow,
  risk: LatestRiskScoreSummary | null
): number | null {
  if (risk?.placement_prob_6m != null) {
    return Math.round(risk.placement_prob_6m * 100);
  }
  return Math.round(Math.min(88, Math.max(45, job.demand_index * 0.72 + job.median_salary_usd / 8000)));
}

function explainCountry(
  country: string,
  visa: VisaRow | null,
  profile: StudentProfile | null,
  intel: StudentIntelligence,
  refJob: JobRow | null
): ItemExplanation {
  const ps = visa ? `${visa.post_study_work_months} months post-study work` : "visa row pending";
  const short = `${country} fits your targets with ${ps} in the reference policy set.`;
  const detail = `Weighing ${bandLabel(intel.financial_capacity)} capacity and ${bandLabel(
    intel.risk_level
  )} risk appetite against ${country}: ${visa?.summary ?? "add visa targets in profile to unlock route-level notes."}`;
  return { reason_short: short, reason_detailed: detail };
}

function explainScholarship(
  s: ScholarshipRow,
  profile: StudentProfile | null,
  intel: StudentIntelligence
): ItemExplanation {
  const short = `${s.name} overlaps your ${profile?.broad_field ?? "field"} plan in ${s.host_country}.`;
  const detail = `Scholarship need reads ${bandLabel(intel.scholarship_need)} with competitiveness ${s.competitiveness}. Coverage ${s.coverage} — align essays to stated outcomes and budget proof.`;
  return { reason_short: short, reason_detailed: detail };
}

function fieldBucketMatches(a: DiscoverArticle, fieldLower: string): boolean {
  if (!fieldLower) return false;
  if (
    a.fieldTags.some(
      (t) => t.toLowerCase().includes(fieldLower) || fieldLower.includes(t.toLowerCase())
    )
  ) {
    return true;
  }
  const stemTech = /computer|software|data|engineer|electrical|mechanical|ai|ml|cyber|info/i.test(
    fieldLower
  );
  if (
    stemTech &&
    a.fieldTags.some((t) =>
      ["Admissions", "Applications", "Requirements", "Planning"].includes(t)
    )
  ) {
    return true;
  }
  if (
    /business|finance|economics/i.test(fieldLower) &&
    a.fieldTags.some((t) => ["Admissions", "Funding", "Planning"].includes(t))
  ) {
    return true;
  }
  return false;
}

function articleMatchesProfile(
  a: DiscoverArticle,
  countries: string[],
  fieldLower: string,
  intel: StudentIntelligence
): number {
  let score = 0;
  const hasCountries = countries.length > 0;
  const countryHit =
    a.countryTags.some((t) => t === "Global") ||
    (!hasCountries
      ? false
      : countries.some((c) =>
          a.countryTags.some(
            (t) =>
              t.toLowerCase().includes(c.toLowerCase()) ||
              c.toLowerCase().includes(t.toLowerCase()) ||
              (t === "US" && (c.includes("United States") || c.includes("USA"))) ||
              (t === "EU" && (c.toLowerCase().includes("germany") || c.toLowerCase().includes("europe")))
          )
        ));
  if (countryHit) score += 3;
  if (hasCountries && a.countryTags.some((t) => t === "Global")) score += 1;

  const fieldHit = fieldBucketMatches(a, fieldLower);
  if (fieldHit) score += 2;
  if (!hasCountries && fieldLower && a.fieldTags.some((t) => t === "Planning")) score += 1;

  if (intel.scholarship_need === "high" && a.fieldTags.includes("Funding")) score += 2;
  if (intel.risk_level.includes("cautious") && a.slug.includes("scholar")) score += 1;
  if (intel.cgpa_band === "developing" && a.slug.includes("admission")) score += 1;
  return score;
}

export function filterDiscoverArticlesStrict(
  profile: StudentProfile | null,
  intel: StudentIntelligence
): DiscoverArticle[] {
  const countries = parseTargetCountries(profile?.target_country ?? "");
  const fieldLower = (profile?.broad_field ?? "").trim().toLowerCase();
  if (!profile || (!countries.length && !fieldLower)) {
    return [];
  }
  const minScore = countries.length && fieldLower ? 3 : 2;
  const scored = [...DISCOVER_ARTICLES]
    .map((a) => ({ a, s: articleMatchesProfile(a, countries, fieldLower, intel) }))
    .filter((x) => x.s >= minScore)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.a);
  return scored.length ? scored.slice(0, 6) : [];
}

export function exploreSignalsReady(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  const countries = parseTargetCountries(profile.target_country ?? "");
  const field = (profile.broad_field ?? "").trim();
  return countries.length > 0 && field.length > 0;
}

export function buildExploreChatSeed(
  profile: StudentProfile | null,
  intel: StudentIntelligence,
  u: ExploreUniversityCard | null,
  j: ExploreJobCard | null
): string {
  const base = `Student intelligence: ${intel.profile_summary.slice(0, 400)}`;
  const uLine = u
    ? `Focused university pack: ${u.university.name} (${u.university.country}) — ${u.explanation.reason_short}`
    : "";
  const jLine = j
    ? `Focused career outcome: ${j.job.title} in ${j.job.country} — ${j.explanation.reason_short}`
    : "";
  const p = profile
    ? `Targets: ${profile.target_country ?? "n/a"} | Field: ${profile.broad_field ?? "n/a"} | Degree: ${profile.degree_type ?? "n/a"}`
    : "";
  return [p, base, uLine, jLine].filter(Boolean).join("\n");
}

export function buildExploreExperiencePayload(
  profile: StudentProfile | null,
  intel: StudentIntelligence,
  risk: LatestRiskScoreSummary | null,
  profileHubCompleteness: number | null = null
): ExploreExperiencePayload {
  const ready = exploreSignalsReady(profile);
  const completeness =
    profileHubCompleteness ?? profile?.profile_completeness_score ?? 0;

  const uniRows = ready ? getUniversities(profile, 4) : [];
  const universities: ExploreUniversityCard[] = uniRows.map((u, i) => {
    const cost = costForCountry(u.country, profile);
    const refJob = refJobForCountry(profile, u.country);
    const explanation = explainUniversity(u, profile, intel, cost, refJob);
    const finance = universityFinance(u, profile, intel, cost, refJob);
    return {
      university: u,
      explanation,
      badges: universityBadges(u, i),
      finance,
      explainability: universityExplainability(u, intel, finance),
    };
  });

  const jobRows = ready ? getJobs(profile, 4) : [];
  const jobs: ExploreJobCard[] = jobRows.map((job) => ({
    job,
    explanation: explainJob(job, profile, intel),
    recommended_degrees: [
      profile?.degree_type?.trim() || "MS / MEng aligned to your field",
      "Graduate diploma leading to the same labor market",
    ].filter(Boolean),
    top_universities: topUnisForJobField(profile, job, 3),
    placement_outlook_pct: jobPlacementOutlook(job, risk),
    explainability: {
      why: `Demand index ${job.demand_index} with median comp $${job.median_salary_usd.toLocaleString()} anchors this outcome cluster.`,
      risk: `Visa and hiring cycles vary by intake — treat months-to-offer (${job.months_to_typical_offer} mo reference) as directional, not a guarantee.`,
      next: "Pair this outcome with two university packs above, then run a funding stress test for living + tuition.",
    },
  }));

  const countryList = ready ? parseTargetCountries(profile!.target_country ?? "") : [];
  const countries: ExploreCountryCard[] = countryList.map((country) => {
    const visaRows = getVisa(profile, 8);
    const visa =
      visaRows.find((v) => v.country.toLowerCase() === country.toLowerCase()) ?? null;
    const refJob = refJobForCountry(profile, country);
    return {
      country,
      visa,
      explanation: explainCountry(country, visa, profile, intel, refJob),
      post_study_work_months: visa?.post_study_work_months ?? null,
      visa_difficulty_label: visa ? visaDifficulty(visa) : "Add visa targets to refine difficulty read",
      job_conversion_pct: jobConversionPct(visa, refJob),
      explainability: {
        why: visa
          ? `${visa.route_name} is the closest bundled route for ${country}.`
          : "We need a visa row match — confirm spelling of your destination in profile intelligence.",
        risk: "Policy windows change — verify stipends, salary thresholds, and dependents rules on official portals.",
        next: "Export a one-page country brief: costs, visa route, and two backup destinations with lower living bands.",
      },
    };
  });

  const schRows = ready ? getScholarships(profile, 4) : [];
  const scholarships: ExploreScholarshipCard[] = schRows.map((s) => ({
    scholarship: s,
    explanation: explainScholarship(s, profile, intel),
    explainability: {
      why: `Field overlap (${s.field_focus.slice(0, 2).join(", ")}) and ${s.coverage} coverage match your funding posture.`,
      risk: `${s.competitiveness} competitiveness — timelines are tight if essays are reused without tailoring.`,
      next: "Draft a 150-word impact paragraph tied to outcomes, then match it to this award’s evaluation rubric.",
    },
  }));

  const articles = filterDiscoverArticlesStrict(profile, intel);
  const exploreChatSeed = buildExploreChatSeed(
    profile,
    intel,
    universities[0] ?? null,
    jobs[0] ?? null
  );

  const wowTrustSnapshot = buildWowTrustSnapshot({
    profile,
    intelligence: intel,
    risk,
    topUniversities: ready ? uniRows.slice(0, 2) : [],
  });

  return {
    profile,
    studentIntelligence: intel,
    profileCompleteness: completeness,
    signalsReady: ready,
    universities,
    jobs,
    countries,
    scholarships,
    articles,
    exploreChatSeed,
    wowTrustSnapshot,
  };
}
