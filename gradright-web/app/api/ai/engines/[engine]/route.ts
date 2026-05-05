import { describeDashboardEngine } from "@/lib/ai/engines/dashboard-engine";
import {
  describeDataopsEngine,
  simulateDataOpsSignals,
} from "@/lib/ai/engines/dataops-engine";
import { describeExploreEngine } from "@/lib/ai/engines/explore-engine";
import { describeFundingEngine } from "@/lib/ai/engines/funding-engine";
import { describeProfileEngine } from "@/lib/ai/engines/profile-engine";
import { getAiKeyPresence } from "@/lib/ai/env";
import { getCosts, getJobs, getNews, getScholarships, getUniversities, getVisa } from "@/lib/data";
import { getLatestRiskScoreByUserId } from "@/lib/db/queries/risk_scores";
import { ensureGroundedProfileContext } from "@/lib/profile/ensure-grounded-context";
import { buildProfileHubApiPayload } from "@/lib/profile/profile-hub-bundle";
import { buildStudentIntelligence } from "@/lib/profile/student-intelligence";
import { buildStudentMasterProfile } from "@/lib/profile/student-master-profile";
import { createServerClient } from "@/lib/db/supabase";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

const ENGINES = [
  "dashboard",
  "explore",
  "funding",
  "profile",
  "dataops",
] as const;

type EngineId = (typeof ENGINES)[number];

function isEngineId(v: string): v is EngineId {
  return (ENGINES as readonly string[]).includes(v);
}

function describe(id: EngineId): string {
  switch (id) {
    case "dashboard":
      return describeDashboardEngine();
    case "explore":
      return describeExploreEngine();
    case "funding":
      return describeFundingEngine();
    case "profile":
      return describeProfileEngine();
    case "dataops":
      return describeDataopsEngine();
    default: {
      const _e: never = id;
      return _e;
    }
  }
}

/** Read-only orchestration snapshot for clients / demos. Writes stay on `/api/user/profile-enrich`. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ engine: string }> }
): Promise<NextResponse> {
  const { engine: raw } = await ctx.params;
  const engine = raw?.toLowerCase?.() ?? "";
  if (!isEngineId(engine)) {
    return NextResponse.json(apiError("Unknown engine"), { status: 400 });
  }

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role !== "student") {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;

  const [profile, risk, grounded] = await Promise.all([
    getStudentProfileByUserId(appUser.id),
    getLatestRiskScoreByUserId(appUser.id),
    ensureGroundedProfileContext(supabase, meta, { force: false }),
  ]);
  const master = await buildStudentMasterProfile(appUser.id, { profile, risk });
  const student_intelligence = buildStudentIntelligence(profile);
  const datasets_preview = profile
    ? {
        universities: getUniversities(profile, 4).map((u) => ({
          id: u.id,
          name: u.name,
          country: u.country,
        })),
        jobs: getJobs(profile, 4).map((j) => ({ id: j.id, title: j.title, country: j.country })),
        scholarships: getScholarships(profile, 3).map((s) => ({
          id: s.id,
          name: s.name,
          host_country: s.host_country,
        })),
        visa: getVisa(profile, 3).map((v) => ({
          country: v.country,
          route_name: v.route_name,
          post_study_work_months: v.post_study_work_months,
        })),
        costs: getCosts(profile, 3).map((c) => ({
          country: c.country,
          living_monthly_usd: c.living_monthly_usd,
          tuition_public_usd_year: c.tuition_public_usd_year,
        })),
        news: getNews(profile, 3).map((n) => ({
          id: n.id,
          headline: n.headline,
          relevance_tag: n.relevance_tag,
        })),
      }
    : null;
  const keys = getAiKeyPresence();

  const snapshot = profile
    ? {
        target_country: profile.target_country,
        target_intake: profile.target_intake,
        degree_type: profile.degree_type,
        broad_field: profile.broad_field,
        budget_band_usd: profile.budget_band_usd,
        scholarship_priority: profile.scholarship_priority,
        profile_completeness_score: profile.profile_completeness_score,
        enrichment_status: profile.enrichment_status,
        loan_needed: profile.loan_needed,
      }
    : null;

  const master_digest = master
    ? {
        pathway: master.pathway,
        intelligence: master.intelligence,
        risk_label: master.risk?.risk_label ?? null,
        extracted_counts: {
          skills: master.extracted.skills.length,
          projects: master.extracted.projects.length,
          internships: master.extracted.internships.length,
        },
      }
    : null;

  const dataops_preview =
    engine === "dataops" && master ? simulateDataOpsSignals(master) : null;

  const profile_hub_payload = buildProfileHubApiPayload(grounded.metadata);

  const payload = apiSuccess({
    engine,
    label: describe(engine),
    policy: engine === "profile" ? "writes_via_profile_enrich_only" : "read_only",
    gemini_key_configured: keys.gemini,
    profile_snapshot: snapshot,
    master_digest,
    dataops_preview,
    student_intelligence,
    datasets_preview,
    profile_hub: profile_hub_payload.profile_hub,
    grounded_context_meta: {
      from_cache: grounded.fromCache,
      refreshed: grounded.refreshed,
      skip_reason: grounded.skip_reason,
    },
  });

  return NextResponse.json(payload, {
    headers: {
      /** User-scoped: private cache only (avoid public edge cache of personalized JSON). */
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
