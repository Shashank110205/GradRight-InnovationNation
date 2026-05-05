import { computeScoringFromUserMetadata } from "@/lib/decision/compute-scoring";
import { explainDecisionWithGemini } from "@/lib/decision/explain-decision";
import { aggregateGapsAndActions } from "@/lib/decision/aggregate-gaps";
import { buildProfileHubApiPayload } from "@/lib/profile/profile-hub-bundle";
import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";
import { ensureGroundedProfileContext } from "@/lib/profile/ensure-grounded-context";
import {
  mergeRequirementStrings,
  groupUniversitiesByCountry,
  aggregateTimelineHints,
  scholarshipHintsFromContext,
  parseProfileResumeSkills,
} from "@/lib/features/grounded-derive";
import {
  enrichCareerNarrativeFromProfile,
  enrichDiscoverInsightsWhenEmpty,
  enrichFinancialLiteracyNarrative,
  enrichScholarshipStrategyNarrative,
  explainGreEstimateWithGemini,
} from "@/lib/features/gemini-feature-explain";
import type { StudentFeatureContext } from "@/lib/features/student-auth";
import { exploreSignalsReady } from "@/lib/explore/explore-wow";
import { shimStudentProfileFromUserMetadata } from "@/lib/profile/hub-profile-shim";
import { buildStudentIntelligence } from "@/lib/profile/student-intelligence";

const FIN_LIT_CORE = [
  {
    id: "fx",
    title: "Exchange rate & living costs",
    body: "Model tuition in home currency, add a 6–8% buffer for living inflation, and keep a 3-month emergency fund before visa proof.",
  },
  {
    id: "loan",
    title: "Education loan structure",
    body: "Compare moratorium (study period) vs immediate repayment; ask for prepayment terms and how interest accrues during study.",
  },
  {
    id: "proof",
    title: "Funding proof for visas",
    body: "Some countries need liquid funds in specific account types—align your loan sanction letter with the consulate checklist early.",
  },
] as const;

const CHECKLIST_STATIC = [
  { id: "transcripts", label: "Academic transcripts & degree proof" },
  { id: "cv", label: "CV / resume aligned to program" },
  { id: "sop", label: "Statement of purpose (program-specific)" },
  { id: "lor", label: "Letters of recommendation (2–3)" },
  { id: "tests", label: "GRE / English tests per target program" },
  { id: "finance", label: "Funding plan & sponsor docs" },
] as const;

async function syncHubMeta(ctx: StudentFeatureContext): Promise<Record<string, unknown>> {
  const ensured = await ensureGroundedProfileContext(ctx.supabase, ctx.meta, {
    force: false,
  });
  return ensured.metadata;
}

export async function buildDiscoverFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const gc = bundle.profile_hub.grounded_context;
  const jm = gc?.job_market;
  const trends = [
    jm?.salary_range?.trim() ? `Salary context: ${jm.salary_range}` : null,
    jm?.roles?.length
      ? `In-demand role themes: ${jm.roles.slice(0, 6).join(", ")}`
      : null,
    jm?.skills?.length
      ? `Skills employers emphasize: ${jm.skills.slice(0, 8).join(", ")}`
      : null,
  ].filter((x): x is string => Boolean(x));

  let insights = [...(gc?.student_insights ?? [])];
  if (!insights.length) {
    const filled = await enrichDiscoverInsightsWhenEmpty(meta);
    if (filled?.length) insights = filled;
  }

  const shim = shimStudentProfileFromUserMetadata(meta, ctx.appUser.id);
  const student_intelligence = buildStudentIntelligence(shim);
  const signals_ready = exploreSignalsReady(shim);
  const profile_completeness = bundle.profile_hub.system.profile_completeness ?? null;

  let latest_trends = trends;
  if (!latest_trends.length) {
    const t = await enrichCareerNarrativeFromProfile(meta);
    if (t) latest_trends = [t];
  }
  if (!latest_trends.length) {
    latest_trends = [
      "Set target countries, field, and role in your profile hub, then refresh orientation to load labor-market and cost signals for your exact plan.",
    ];
  }

  return {
    profile_hub: bundle.profile_hub,
    student_intelligence,
    profile_completeness,
    signals_ready,
    insights,
    latest_trends,
    student_experiences: insights,
  };
}

export async function buildCareerFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const jm = bundle.profile_hub.grounded_context?.job_market ?? null;
  const shim = shimStudentProfileFromUserMetadata(meta, ctx.appUser.id);
  const student_intelligence = buildStudentIntelligence(shim);

  const hasMarket = Boolean(
    (jm?.roles && jm.roles.length > 0) || (jm?.salary_range && jm.salary_range.trim())
  );
  const aiNarrative = !hasMarket ? await enrichCareerNarrativeFromProfile(meta) : null;

  const demand_trends = jm?.roles?.length
    ? `Employers are hiring for: ${jm.roles.slice(0, 10).join("; ")}.`
    : aiNarrative ??
      "Add your target role in profile goals and run orientation refresh to see employer demand for your field and destinations.";

  const growth_trajectory = jm?.salary_range?.trim()
    ? `Salary / compensation context from orientation: ${jm.salary_range}`
    : aiNarrative ??
      "Salary bands and growth paths load from your orientation block after countries + field + role are set.";

  return {
    profile_hub: bundle.profile_hub,
    student_intelligence,
    goals: bundle.profile_hub.goals_snapshot,
    target_countries: shim?.target_country,
    career_interest: student_intelligence.career_direction,
    roles: jm?.roles ?? [],
    /** Alias for product copy */
    demand: jm?.roles ?? [],
    salary: jm?.salary_range ?? "",
    salary_range: jm?.salary_range ?? "",
    skills: jm?.skills ?? [],
    companies: jm?.companies ?? [],
    demand_trends,
    growth: growth_trajectory,
    growth_trajectory,
  };
}

export async function buildCountriesFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const unis = bundle.profile_hub.grounded_context?.universities ?? [];
  const byCountry = groupUniversitiesByCountry(unis);
  const country_data = Object.entries(byCountry).map(([country, pack]) => ({
    country,
    visa_and_environment_notes: pack.universities
      .map((u) => u.fit_reason?.trim())
      .filter(Boolean)
      .slice(0, 4),
    cost_overview: pack.universities.map((u) => ({
      university: u.name,
      fees: u.fees,
      tier: u.tier,
    })),
    requirements_preview: mergeRequirementStrings(bundle.profile_hub.grounded_context).slice(
      0,
      12
    ),
  }));

  return { profile_hub: bundle.profile_hub, country_data };
}

export async function buildUniversitiesFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const gc = getProfileHubFromUserMetadata(meta).grounded_context;
  const fitByName = new Map((gc?.universities ?? []).map((u) => [u.name.trim(), u]));

  const universities = scoring.universities.map((row) => {
    const g = fitByName.get(row.name.trim());
    return {
      ...row,
      fit_reason: g?.fit_reason?.trim() ?? "",
      grounded_timeline: g?.timeline?.trim() ?? null,
    };
  });

  return { profile_hub: bundle.profile_hub, universities, meta: scoring.meta };
}

export async function buildAdmissionGuideFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const reqs = mergeRequirementStrings(bundle.profile_hub.grounded_context);
  const timelines = aggregateTimelineHints(bundle.profile_hub.grounded_context);

  return {
    profile_hub: bundle.profile_hub,
    exams_required: reqs.filter((r) =>
      /\bgre\b|\bgmat\b|\btoefl\b|\bielts\b|\bdet\b|\bpte\b/i.test(r)
    ),
    documents_needed: reqs.filter((r) =>
      /\btranscript\b|\blor\b|\bsop\b|\bcv\b|\bportfolio\b|\bessay\b/i.test(r)
    ),
    other_requirements: reqs.filter(
      (r) =>
        !/\bgre\b|\bgmat\b|\btoefl\b|\bielts\b|\bdet\b|\bpte\b/i.test(r) &&
        !/\btranscript\b|\blor\b|\bsop\b|\bcv\b|\bportfolio\b|\bessay\b/i.test(r)
    ),
    process_flow: timelines.length
      ? timelines
      : [
          "Confirm intake window and standardized tests per program.",
          "Draft SOP + CV; align recommenders early.",
          "Submit portal applications before priority deadlines.",
        ],
  };
}

export async function buildScholarshipsFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const hints = scholarshipHintsFromContext(bundle.profile_hub.grounded_context);
  const deadlines = aggregateTimelineHints(bundle.profile_hub.grounded_context);
  const enriched = await enrichScholarshipStrategyNarrative({
    meta,
    hints,
    timelines: deadlines,
  });

  return {
    profile_hub: bundle.profile_hub,
    scholarships: enriched?.items ?? [],
    strategy: enriched?.strategy ?? "",
    eligibility: enriched?.items?.map((i) => i.eligibility).filter(Boolean) ?? hints,
    deadlines,
    eligibility_hints: hints,
  };
}

export async function buildRequirementsFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const standardized = mergeRequirementStrings(bundle.profile_hub.grounded_context);
  return {
    profile_hub: bundle.profile_hub,
    standardized_requirements: standardized,
    academic_expectations: bundle.profile_hub.grounded_context?.universities
      .map((u) => `${u.name}: ${u.admission_probability || "see program site"}`)
      .slice(0, 16),
  };
}

export async function buildFinancialLiteracyFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const jm = bundle.profile_hub.grounded_context?.job_market;
  const scoring = await computeScoringFromUserMetadata(meta);
  const feesDigest = (bundle.profile_hub.grounded_context?.universities ?? [])
    .map((u) => `${u.name} (${u.country}): ${u.fees}`)
    .join("\n");
  const roiHint = JSON.stringify(scoring.roi ?? {});
  const personalized = await enrichFinancialLiteracyNarrative({
    meta,
    feesDigest,
    roiHint,
  });

  const cost_breakdown = (bundle.profile_hub.grounded_context?.universities ?? []).slice(0, 8).map(
    (u) => ({
      university: u.name,
      country: u.country,
      fees: u.fees,
      tier: u.tier,
    })
  );

  const emi_explanation =
    personalized ??
    "EMI starts after moratorium for many education loans; confirm whether simple or reducing balance interest applies and whether you pay during study.";

  return {
    profile_hub: bundle.profile_hub,
    cost_breakdown,
    concepts: [...FIN_LIT_CORE],
    loan_basics:
      "Compare APR, moratorium, co-applicant rules, and collateral requirements before signing.",
    emi_explanation,
    roi_insights: [
      scoring.roi?.ratio != null ? `Salary vs fee index ratio: ${scoring.roi.ratio}` : null,
      jm?.salary_range ? `Salary context from orientation: ${jm.salary_range}` : null,
    ].filter((x): x is string => Boolean(x)),
    planning_tips: [
      jm?.salary_range ? `Salary context from orientation: ${jm.salary_range}` : null,
      scoring.roi?.ratio != null
        ? `ROI lens ratio (salary index vs fee index): ${scoring.roi.ratio}`
        : null,
      "Stress-test FX + 10% cost inflation for the first year abroad.",
    ].filter((x): x is string => Boolean(x)),
    personalized_finance_plan: personalized ?? "",
  };
}

export async function buildAdmissionPredictorFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const { explanation, source } = await explainDecisionWithGemini(scoring);

  return {
    profile_hub: bundle.profile_hub,
    grad_score: scoring.grad_score,
    admission_probabilities: scoring.admission_scores,
    best_universities: scoring.universities.slice(0, 8),
    explanation,
    explanation_source: source,
    meta: scoring.meta,
  };
}

export async function buildJobOutlookFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const jm = bundle.profile_hub.grounded_context?.job_market;
  const roles = jm?.roles ?? [];
  const salary = jm?.salary_range ?? "";

  return {
    profile_hub: bundle.profile_hub,
    short_term_3mo: roles.length
      ? `Near-term: recruiting focused on ${roles.slice(0, 4).join(", ")}.`
      : "Add grounded orientation to load role-specific hiring themes.",
    mid_term_6mo: salary
      ? `Six-month outlook ties to reported salary bands: ${salary}`
      : null,
    long_term_12mo: jm?.skills?.length
      ? `Twelve-month skill stack to emphasize: ${jm.skills.slice(0, 10).join(", ")}.`
      : null,
  };
}

export async function buildRoiFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  return {
    profile_hub: bundle.profile_hub,
    roi: scoring.roi,
    grad_score: scoring.grad_score,
    universities_preview: scoring.universities.slice(0, 6),
    insights: [
      scoring.roi?.ratio != null
        ? `Composite salary vs fee index ratio: ${scoring.roi.ratio}`
        : null,
      scoring.roi?.salary_mid_lpa != null
        ? `Salary mid-point (LPA heuristic): ${scoring.roi.salary_mid_lpa}`
        : null,
    ].filter((x): x is string => Boolean(x)),
  };
}

export async function buildTimelineFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const hints = aggregateTimelineHints(bundle.profile_hub.grounded_context);

  return {
    profile_hub: bundle.profile_hub,
    application_timeline: hints.length
      ? hints
      : [
          "T-12–8 months: tests + shortlist",
          "T-6–4 months: SOP/LOR drafts & portal accounts",
          "T-3–1 months: submissions + funding proofs",
        ],
    milestones: [
      "Finalize country/program shortlist",
      "Submit standardized tests",
      "Lock recommenders",
      "Submit applications before priority deadlines",
    ],
  };
}

export async function buildChecklistFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const hub = getProfileHubFromUserMetadata(meta);

  const tasks = CHECKLIST_STATIC.map((t) => ({
    id: t.id,
    label: t.label,
    done:
      (t.id === "transcripts" &&
        Boolean(
          parseProfileResumeSkills(meta).length ||
            hub.resume_snapshot ||
            hub.resume_gemini
        )) ||
      (t.id === "cv" && Boolean(hub.resume_snapshot || hub.resume_gemini)) ||
      (t.id === "tests" && scoring.grad_score > 0),
  }));

  return {
    profile_hub: bundle.profile_hub,
    tasks,
    gaps_from_decision_engine: [
      ...(scoring.readiness.improvement_areas ?? []),
    ].slice(0, 12),
  };
}

export async function buildSkillRoadmapFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const { gaps, actions } = aggregateGapsAndActions(scoring);
  const skills = parseProfileResumeSkills(meta);

  return {
    profile_hub: bundle.profile_hub,
    skills_to_build: [...new Set([...skills, ...gaps])].slice(0, 20),
    action_plan: actions.slice(0, 12),
  };
}

export async function buildCostPlannerFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const rows =
    bundle.profile_hub.grounded_context?.universities.map((u) => ({
      name: u.name,
      country: u.country,
      fees: u.fees,
      tier: u.tier,
    })) ?? [];

  return {
    profile_hub: bundle.profile_hub,
    tuition_breakdown: rows,
    total_cost_notes:
      "Sum program fees from orientation plus estimated living (see living-expenses feature). Fees strings are qualitative — verify on the official program page.",
  };
}

export async function buildLivingExpensesFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const byCountry = groupUniversitiesByCountry(
    bundle.profile_hub.grounded_context?.universities ?? []
  );

  return {
    profile_hub: bundle.profile_hub,
    monthly_expenses_notes: Object.entries(byCountry).map(([country]) => ({
      country,
      note: `Use orientation fee strings plus typical rent bands for ${country}; confirm with official student visa cost guides.`,
    })),
    city_comparison: [],
  };
}

export async function buildScholarshipStrategyFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const hints = scholarshipHintsFromContext(bundle.profile_hub.grounded_context);
  const deadlines = aggregateTimelineHints(bundle.profile_hub.grounded_context);
  const enriched = await enrichScholarshipStrategyNarrative({
    meta,
    hints,
    timelines: deadlines,
  });

  return {
    profile_hub: bundle.profile_hub,
    recommended_scholarships:
      enriched?.items?.map((i) => `${i.title}: ${i.eligibility}`) ?? hints,
    strategy_tips: [
      ...(enriched?.strategy ? [enriched.strategy] : []),
      ...(scoring.readiness.improvement_areas ?? []).slice(0, 5),
      "Front-load merit narratives tied to projects and measurable outcomes.",
    ],
    deadlines,
    scholarship_cards: enriched?.items ?? [],
  };
}

export async function buildFundingReadinessFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);

  return {
    profile_hub: bundle.profile_hub,
    readiness: scoring.readiness,
    grad_score: scoring.grad_score,
    suggestions: [
      ...(scoring.readiness.improvement_areas ?? []).slice(0, 8),
    ],
    meta: scoring.meta,
  };
}

export function buildCommunityFeatureData() {
  return {
    highlights: [
      "Students share timelines by destination — calm, specific, outcome-linked.",
      "Weekly wins and scholarship deadlines surface once your hub is filled.",
    ],
    note: "Live community feeds ship next; this panel is a structured preview only.",
  };
}

export function buildPeersFeatureData() {
  return {
    peer_groups_preview: [
      { lens: "City → destination", example: "Mumbai → Ireland · Fall 2026" },
      { lens: "Field + goal", example: "CS → US tech hiring track" },
      { lens: "Stage", example: "Test prep + SOP drafting cohort" },
    ],
    note: "Matching uses your profile hub signals once peer groups go live.",
  };
}

export async function buildNotificationsFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const deadlines = aggregateTimelineHints(bundle.profile_hub.grounded_context).slice(0, 6);

  const items: Array<{
    id: string;
    title: string;
    body: string;
    kind: "deadline" | "improvement";
    due: string | null;
  }> = [];

  deadlines.forEach((d, i) => {
    items.push({
      id: `tl-${i}`,
      title: "Application timing",
      body: d,
      kind: "deadline",
      due: null,
    });
  });
  for (const g of (scoring.readiness.improvement_areas ?? []).slice(0, 4)) {
    items.push({
      id: `imp-${items.length}`,
      title: "Profile improvement",
      body: g,
      kind: "improvement",
      due: null,
    });
  }

  return { profile_hub: bundle.profile_hub, notifications: items };
}

export async function buildProfileDeepeningResponse(_ctx: StudentFeatureContext) {
  return {
    score_upgrade_href: "/dashboard/score-upgrade",
    message:
      "Deepen your résumé and goals in the score-upgrade flow — data saves into profile_hub via the profile intelligence chat.",
  };
}

export async function buildGreFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const reqs = mergeRequirementStrings(bundle.profile_hub.grounded_context).join("\n");
  const gre = await explainGreEstimateWithGemini({
    meta,
    requirementsSummary: reqs,
  });

  return {
    profile_hub: bundle.profile_hub,
    suggested_score: gre.suggested_score,
    reasoning: gre.reasoning,
    source: gre.source,
  };
}
