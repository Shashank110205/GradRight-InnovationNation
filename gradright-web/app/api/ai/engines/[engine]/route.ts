import { describeDashboardEngine } from "@/lib/ai/engines/dashboard-engine";
import { describeDataopsEngine } from "@/lib/ai/engines/dataops-engine";
import { describeExploreEngine } from "@/lib/ai/engines/explore-engine";
import { describeFundingEngine } from "@/lib/ai/engines/funding-engine";
import { describeProfileEngine } from "@/lib/ai/engines/profile-engine";
import { getGeminiEngineKeyPresence } from "@/lib/ai/env";
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

  const profile = await getStudentProfileByUserId(appUser.id);
  const keys = getGeminiEngineKeyPresence();

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

  return NextResponse.json(
    apiSuccess({
      engine,
      label: describe(engine),
      policy: engine === "profile" ? "writes_via_profile_enrich_only" : "read_only",
      gemini_key_configured: keys[engine],
      profile_snapshot: snapshot,
    })
  );
}
