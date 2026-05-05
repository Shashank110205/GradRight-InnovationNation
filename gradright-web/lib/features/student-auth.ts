import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError } from "@/lib/types";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { User } from "@/lib/types";

export type StudentFeatureContext = {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  authUser: SupabaseAuthUser;
  appUser: User;
  /** Latest signed-in user_metadata — profile_hub single source of truth. */
  meta: Record<string, unknown>;
};

export type StudentAuthResult =
  | { ok: true; ctx: StudentFeatureContext }
  | { ok: false; response: NextResponse };

type ResolveResult =
  | { kind: "ok"; ctx: StudentFeatureContext }
  | { kind: "unauthorized" }
  | { kind: "forbidden" };

async function resolveStudentFeatureContext(): Promise<ResolveResult> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return { kind: "unauthorized" };
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role === "nbfc_supervisor") {
    return { kind: "forbidden" };
  }

  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  return {
    kind: "ok",
    ctx: { supabase, authUser, appUser, meta },
  };
}

/** Server pages (RSC) — same metadata contract as `GET /api/features/*` without HTTP. */
export async function loadStudentFeatureContext(): Promise<StudentFeatureContext | null> {
  const r = await resolveStudentFeatureContext();
  return r.kind === "ok" ? r.ctx : null;
}

/**
 * Shared gate for `/api/features/*`: student session + app row + metadata blob.
 * No direct UI DB reads — callers use `meta` / profile_hub only.
 */
export async function requireStudentFeatureAuth(): Promise<StudentAuthResult> {
  const r = await resolveStudentFeatureContext();
  if (r.kind === "unauthorized") {
    return {
      ok: false,
      response: NextResponse.json(apiError("Unauthorized"), { status: 401 }),
    };
  }
  if (r.kind === "forbidden") {
    return {
      ok: false,
      response: NextResponse.json(apiError("Forbidden"), { status: 403 }),
    };
  }
  return { ok: true, ctx: r.ctx };
}
