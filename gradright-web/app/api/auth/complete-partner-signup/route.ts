import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "@/lib/db/supabase";
import {
  ensureUserFromAuth,
  getUserBySupabaseUID,
  promoteUserToNbfcSupervisor,
} from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Middleware and layouts use `supabase.from("users")` (PostgREST + JWT + RLS).
 * Drizzle writes can succeed while this still returns no row — treat as hard failure.
 */
async function assertNbfcRoleVisibleToPostgREST(
  supabase: SupabaseClient,
  supabaseUid: string,
  email: string | undefined
): Promise<{ ok: true } | { ok: false; detail: string }> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("supabase_uid", supabaseUid)
    .maybeSingle();

  if (error) {
    console.warn(
      `[complete-partner-signup] PostgREST users select error uid=${supabaseUid} email=${email ?? "?"}: ${error.message}`
    );
    return {
      ok: false,
      detail: `PostgREST users lookup failed: ${error.message}`,
    };
  }
  if (!data) {
    console.warn(
      `[complete-partner-signup] PostgREST returned no row uid=${supabaseUid} email=${email ?? "?"} (RLS blocks SELECT or supabase_uid mismatch).`
    );
    return {
      ok: false,
      detail:
        "Partner row exists in Postgres but is not readable via Supabase API for this session (almost always RLS on public.users). Apply migration `0001_users_rls_authenticated_read.sql` (`pnpm db:push` from gradright-web).",
    };
  }
  if (data.role !== "nbfc_supervisor") {
    console.warn(
      `[complete-partner-signup] PostgREST role=${String(data.role)} uid=${supabaseUid} email=${email ?? "?"}`
    );
    return {
      ok: false,
      detail: `public.users.role is ${String(data.role)}; NBFC console requires nbfc_supervisor.`,
    };
  }
  return { ok: true };
}

/**
 * Two modes:
 *   1. Signup-completion: body has organizationName + contactName (called from
 *      `partner-signup-form` right after `auth.signUp` returns a session).
 *   2. Ensure-mode: empty body (called from `partner-login-form` after a
 *      successful sign-in to backfill the `public.users` row + role for users
 *      whose project required email confirmation, since `auth.signUp` then
 *      returns `session = null` and this endpoint was never invoked).
 *
 * Idempotent. Returns the resolved role so the caller can decide what to do.
 * Promotion to `nbfc_supervisor` requires `ALLOW_NBFC_SELF_SIGNUP=true`.
 */
const bodySchema = z.object({
  organizationName: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(120).optional(),
});

type Body = z.infer<typeof bodySchema>;

function selfSignupAllowed(): boolean {
  return process.env.ALLOW_NBFC_SELF_SIGNUP === "true";
}

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown = {};
  if (request.headers.get("content-length") !== "0") {
    try {
      json = await request.json();
    } catch {
      json = {};
    }
  }

  const parsed = bodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(apiError("Invalid body"), { status: 400 });
  }
  const body: Body = parsed.data;

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const isCompletionMode = Boolean(
    body.organizationName?.trim() && body.contactName?.trim()
  );

  let appUser;
  try {
    appUser = await ensureUserFromAuth({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata as { full_name?: string },
    });
  } catch (e) {
    console.error("[complete-partner-signup] ensureUserFromAuth", e);
    return NextResponse.json(
      apiError("Could not initialize partner profile"),
      { status: 500 }
    );
  }

  if (appUser.role === "nbfc_supervisor") {
    const visible = await assertNbfcRoleVisibleToPostgREST(
      supabase,
      authUser.id,
      authUser.email ?? undefined
    );
    if (!visible.ok) {
      const drizzle = await getUserBySupabaseUID(authUser.id);
      console.warn(
        `[complete-partner-signup] Drizzle role=${drizzle?.role ?? "<none>"} PostgREST blocked: ${visible.detail}`
      );
      return NextResponse.json(apiError(visible.detail), { status: 503 });
    }
    return NextResponse.json(
      apiSuccess({ role: "nbfc_supervisor" as const, promoted: false })
    );
  }

  if (!selfSignupAllowed()) {
    if (isCompletionMode) {
      return NextResponse.json(
        apiError(
          "Partner self-signup is disabled. Set ALLOW_NBFC_SELF_SIGNUP=true for local/demo, or ask an admin to provision an NBFC supervisor account."
        ),
        { status: 403 }
      );
    }
    return NextResponse.json(
      apiSuccess({ role: appUser.role, promoted: false })
    );
  }

  const displayName = isCompletionMode
    ? `${body.contactName!.trim()} · ${body.organizationName!.trim()}`
    : appUser.full_name?.trim() ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "Supervisor";

  try {
    await promoteUserToNbfcSupervisor(authUser.id, displayName);
  } catch (e) {
    console.error("[complete-partner-signup] promote", e);
    return NextResponse.json(apiError("Could not activate partner access"), {
      status: 500,
    });
  }

  const visible = await assertNbfcRoleVisibleToPostgREST(
    supabase,
    authUser.id,
    authUser.email ?? undefined
  );
  if (!visible.ok) {
    const drizzle = await getUserBySupabaseUID(authUser.id);
    console.warn(
      `[complete-partner-signup] After promote Drizzle role=${drizzle?.role ?? "<none>"} PostgREST blocked: ${visible.detail}`
    );
    return NextResponse.json(apiError(visible.detail), { status: 503 });
  }

  return NextResponse.json(
    apiSuccess({ role: "nbfc_supervisor" as const, promoted: true })
  );
}
