import { computeScoringFromUserMetadata } from "@/lib/decision/compute-scoring";
import { explainDecisionWithGemini } from "@/lib/decision/explain-decision";
import { aggregateGapsAndActions } from "@/lib/decision/aggregate-gaps";
import { warnIfStudentProfileSchemaDrift } from "@/lib/dashboard/dashboard-profile-fallback";
import { getCachedDashboardNews } from "@/lib/dashboard/dashboard-news";
import {
  getCachedDashboardProfile,
  getCachedStudentIntelligence,
  getCachedUniversitiesForProfile,
} from "@/lib/dashboard/dashboard-server-cache";
import { buildDashboardPersonalizedLines } from "@/lib/dashboard/personalized-insights";
import { buildWeeklyTasks } from "@/lib/dashboard/weekly-tasks";
import { exploreSignalsReady } from "@/lib/explore/explore-wow";
import {
  formatDashboardDateHeader,
  formatDashboardEventTime,
} from "@/lib/format/dashboard-dates";
import type { DashboardNewsFeedItem, RankedNewsItem } from "@/lib/data";
import { getUserBadgesDistinct } from "@/lib/db/queries/gamification_badges";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import {
  getCompletedWeeklyTaskIds,
  getRecentUserEventsByUserId,
} from "@/lib/db/queries/user_events_list";
import { MAX_GROUNDED_SEARCHES_PER_USER } from "@/lib/profile/grounded-context";
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
  buildMentorProfileSummary,
  enrichCareerFeatureWithGemini,
  enrichFinancialLiteracyWithGemini,
  enrichScholarshipsWithGemini,
  explainHomeShortWithGemini,
  explainGreEstimateWithGemini,
} from "@/lib/features/gemini-feature-explain";
import type { FeatureModuleData } from "@/lib/features/module-contract";
import type { StudentFeatureContext } from "@/lib/features/student-auth";
import { buildWowTrustSnapshot } from "@/lib/trust-layer/wow-trust-snapshot";
import type { JourneyStage } from "@/lib/types";

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

function toNewsFeedItems(items: RankedNewsItem[]): DashboardNewsFeedItem[] {
  return items.slice(0, 5).map((n) => ({
    id: n.id,
    source: n.source,
    relevance_tag: n.relevance_tag,
    headline: n.headline,
    summary: n.summary,
    url: n.url,
  }));
}

/**
 * Full dashboard bundle for `GET /api/features/home` — server-side only (API + RSC may not import in UI).
 */
export async function buildHomeFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const scoring = await computeScoringFromUserMetadata(meta);
  const { actions, gaps } = aggregateGapsAndActions(scoring);
  const { text: short_explanation, source: explanation_source } =
    await explainHomeShortWithGemini(scoring);

  const userId = ctx.appUser.id;

  const [, profile] = await Promise.all([
    warnIfStudentProfileSchemaDrift(),
    getCachedDashboardProfile(userId),
  ]);

  const intelligence = getCachedStudentIntelligence(profile);

  const [risk, events, completedTaskIds, badges, newsItems] = await Promise.all([
    getLatestRiskScoreByUserId(userId),
    getRecentUserEventsByUserId(userId, 8),
    getCompletedWeeklyTaskIds(userId),
    getUserBadgesDistinct(userId),
    getCachedDashboardNews(profile),
  ]);

  const topUniversity = getCachedUniversitiesForProfile(profile, 1)[0] ?? null;
  const topUniversitiesForWow = exploreSignalsReady(profile)
    ? getCachedUniversitiesForProfile(profile, 2)
    : [];
  const wowTrustSnapshot = buildWowTrustSnapshot({
    profile,
    intelligence,
    risk,
    topUniversities: topUniversitiesForWow,
  });

  const tasks = buildWeeklyTasks(profile, ctx.appUser.journey_stage);

  const displayName =
    ctx.appUser.full_name?.trim() || ctx.authUser.email?.split("@")[0] || "Student";

  const todayLabel = formatDashboardDateHeader(new Date());
  const profileHubCompleteness = bundle.profile_hub.system.profile_completeness;

  const personalizedLines = buildDashboardPersonalizedLines(profile, risk, {
    intelligence,
    topUniversity,
    profileHubCompleteness,
  });
  const eventsSlim = events.slice(0, 5);
  const eventsWithLabels = eventsSlim.map((e) => ({
    ...e,
    createdAtLabel: e.created_at ? formatDashboardEventTime(e.created_at) : null,
  }));

  const newsFeedItems = toNewsFeedItems(newsItems ?? []);

  const reasonLines =
    gaps.slice(0, 6).length > 0
      ? gaps.slice(0, 6)
      : scoring.universities.slice(0, 4).map(
          (u) =>
            `${u.name} (${u.country}, ${u.tier}) — compare stated requirements with your CV signals.`
        );
  const presentation: FeatureModuleData = {
    summary:
      short_explanation.trim() ||
      `GradScore ${Math.round(scoring.grad_score)} — your dashboard updates as profile_hub fills in.`,
    insights: personalizedLines.slice(0, 12),
    reasons:
      reasonLines.length > 0
        ? reasonLines
        : [
            "Add target role + domain under Profile intelligence so labor-market orientation can anchor to you.",
          ],
    actions: actions.slice(0, 10),
    metrics: [
      { label: "GradScore", value: String(Math.round(scoring.grad_score)) },
      {
        label: "Profile completeness",
        value: `${Math.round(profileHubCompleteness ?? 0)}%`,
      },
      {
        label: "Grounded orientation",
        value: bundle.profile_hub.grounded_context?.last_updated
          ? new Date(bundle.profile_hub.grounded_context.last_updated).toLocaleDateString()
          : "Not refreshed yet",
      },
      {
        label: "Research passes left",
        value: String(
          Math.max(
            0,
            MAX_GROUNDED_SEARCHES_PER_USER -
              (typeof bundle.profile_hub.system.grounded_search_count === "number"
                ? bundle.profile_hub.system.grounded_search_count
                : 0)
          )
        ),
      },
    ],
  };

  return {
    ...presentation,
    profile_hub: bundle.profile_hub,
    grad_score: scoring.grad_score,
    profile_completeness: bundle.profile_hub.system.profile_completeness,
    top_universities: scoring.universities.slice(0, 3),
    key_actions: actions.slice(0, 5),
    short_explanation,
    explanation_source,
    scoring_meta: scoring.meta,
    displayName,
    navCacheUserId: userId,
    studentIntelligence: intelligence,
    profile,
    risk,
    journeyStage: ctx.appUser.journey_stage as JourneyStage,
    xpPoints: ctx.appUser.xp_points,
    streakDays: ctx.appUser.streak_days,
    badges,
    tasks,
    completedTaskIds,
    events: eventsWithLabels,
    newsItems: newsFeedItems,
    todayLabel,
    personalizedLines,
    wowTrustSnapshot,
    profileHubCompleteness,
  };
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

  const insights = gc?.student_insights ?? [];
  if (!trends.length && insights.length) {
    trends.push(
      ...insights.slice(0, 3).map((s) => `${s.title}: ${s.summary.slice(0, 140)}…`)
    );
  }
  if (!trends.length) {
    trends.push(
      `Refresh orientation from profile hub once targets + goals are set — ${buildMentorProfileSummary(meta).slice(0, 200)}`
    );
  }

  const insightBullets = insights
    .slice(0, 10)
    .map((s) => `${s.title}: ${s.summary.slice(0, 140)}`);
  const discoverPresentation: FeatureModuleData = {
    summary:
      trends[0]?.slice(0, 600) ??
      buildMentorProfileSummary(meta).slice(0, 600),
    insights: insightBullets.length ? insightBullets : trends.slice(0, 10),
    reasons: trends.slice(0, 8),
    actions: [
      "Align goals and destinations under Profile coach so labor-market signals stay specific.",
      "Re-open Discover after a hub refresh to pull the newest orientation.",
    ],
    metrics: [
      {
        label: "Orientation updated",
        value: gc?.last_updated
          ? new Date(gc.last_updated).toLocaleDateString()
          : "Not yet",
      },
      { label: "Student notes", value: String(insights.length) },
    ],
  };

  return {
    ...discoverPresentation,
    profile_hub: bundle.profile_hub,
    insights,
    latest_trends: trends,
    student_experiences: insights,
  };
}

export async function buildCareerFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const jm = bundle.profile_hub.grounded_context?.job_market ?? null;
  let roles = jm?.roles ?? [];
  let salary_range = jm?.salary_range ?? "";
  let skills = jm?.skills ?? [];
  let companies = jm?.companies ?? [];
  let demand_trends = jm?.roles?.length
    ? `Employers are hiring for: ${jm.roles.slice(0, 10).join("; ")}.`
    : "";
  let growth_trajectory = jm?.salary_range?.trim()
    ? `Salary bands reported in orientation: ${jm.salary_range}`
    : null;

  if (
    !roles.length ||
    !salary_range.trim() ||
    demand_trends.includes("Complete grounded")
  ) {
    const fill = await enrichCareerFeatureWithGemini({
      meta,
      summary: buildMentorProfileSummary(meta),
    });
    if (fill) {
      roles = fill.roles.length ? fill.roles : roles;
      salary_range = fill.salary_range || salary_range;
      demand_trends = fill.demand_trends || demand_trends;
      growth_trajectory = fill.growth_trajectory ?? growth_trajectory;
    }
  }

  if (!demand_trends.trim()) {
    demand_trends =
      "Ground your next step: finish onboarding targets + goals so we can refresh labor-market orientation.";
  }

  return {
    profile_hub: bundle.profile_hub,
    roles,
    salary_range,
    skills,
    companies,
    demand_trends,
    growth_trajectory,
    goals_line: buildMentorProfileSummary(meta),
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
  const structured = await enrichScholarshipsWithGemini({
    summary: buildMentorProfileSummary(meta),
    program_hints: [...hints, ...deadlines].join("\n"),
  });

  return {
    profile_hub: bundle.profile_hub,
    scholarships: structured ?? [],
    eligibility_hints: hints,
    deadlines,
    strategy:
      structured && structured.length
        ? "Prioritize awards where your stated field + destinations overlap; tailor essays to each rubric."
        : "Complete orientation + goals so scholarship tracks can be titled to your profile.",
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
  const fees_preview =
    bundle.profile_hub.grounded_context?.universities
      ?.slice(0, 10)
      .map((u) => `${u.name} (${u.country}): ${u.fees}`)
      .join("\n") ?? "";
  const roi_hint = [
    scoring.roi?.ratio != null ? `ROI ratio: ${scoring.roi.ratio}` : "",
    scoring.roi?.salary_mid_lpa != null ? `Salary mid LPA heuristic: ${scoring.roi.salary_mid_lpa}` : "",
    jm?.salary_range ? `Job market salary text: ${jm.salary_range}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const ai = await enrichFinancialLiteracyWithGemini({
    summary: buildMentorProfileSummary(meta),
    fees_preview,
    roi_hint,
  });

  return {
    profile_hub: bundle.profile_hub,
    concepts: [...FIN_LIT_CORE],
    loan_basics:
      ai?.emi_explainer ||
      "Compare APR, moratorium, co-applicant rules, and collateral requirements before signing.",
    planning_tips: [
      ai?.personalized_paragraph,
      jm?.salary_range ? `Salary context from orientation: ${jm.salary_range}` : null,
      scoring.roi?.ratio != null
        ? `ROI lens ratio (salary index vs fee index): ${scoring.roi.ratio}`
        : null,
      ai?.roi_takeaway,
      "Stress-test FX + 10% cost inflation for the first year abroad.",
    ].filter((x): x is string => Boolean(x)),
    cost_breakdown_preview: fees_preview || null,
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

  return {
    profile_hub: bundle.profile_hub,
    recommended_scholarships: hints,
    strategy_tips: [
      ...(scoring.readiness.improvement_areas ?? []).slice(0, 5),
      "Front-load merit narratives tied to projects and measurable outcomes.",
    ],
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

export async function buildCommunityFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const welcome = buildMentorProfileSummary(meta).split("\n")[0] ?? "Your journey";

  return {
    profile_hub: bundle.profile_hub,
    highlights: [
      `Built around ${welcome.replace(/^Target countries:\s*/i, "destinations: ")}`,
      "Share wins and deadlines with students targeting similar destinations — calm, specific, outcome-linked.",
    ],
    note: "Live feeds unlock next; today’s copy reflects your saved hub signals only.",
  };
}

export async function buildPeersFeatureData(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  const summary = buildMentorProfileSummary(meta);
  const fieldMatch =
    summary.match(/Field:\s*([^.]+)/i)?.[1]?.trim() || "your field";
  const countryMatch =
    summary.match(/Target countries:\s*([^.]+)/i)?.[1]?.trim() || "your destinations";

  return {
    profile_hub: bundle.profile_hub,
    peer_groups_preview: [
      {
        lens: "Destination match",
        example: `Students also aiming at ${countryMatch.split(",").slice(0, 2).join(", ")}`,
      },
      { lens: "Field + goal", example: `${fieldMatch} graduate hiring tracks` },
      {
        lens: "Stage",
        example: "Test prep + SOP drafting — aligned to your intake timing",
      },
    ],
    note: "Peer matching will use these hub signals first when groups go live.",
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

export async function buildProfileDeepeningResponse(ctx: StudentFeatureContext) {
  const meta = await syncHubMeta(ctx);
  const bundle = buildProfileHubApiPayload(meta);
  return {
    profile_hub: bundle.profile_hub,
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

