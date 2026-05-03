import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  destinationAfterSignIn,
  destinationForAuthenticatedStudentAppUser,
  hubGuardRedirectDestination,
  isNbfcSupervisorRole,
  isStudentJourneyPath,
  onboardingRouteRedirect,
} from "@/lib/auth/student-journey-destinations";
import type { StudentFlowSnapshot } from "@/lib/auth/student-journey-destinations";

function sameRedirect(
  request: NextRequest,
  pathWithSearch: string
): NextResponse {
  const dest = new URL(pathWithSearch, request.url);
  return NextResponse.redirect(dest);
}

function legacyAuthRedirect(pathname: string, search: string): string | null {
  if (pathname === "/login") return `/sign-in${search}`;
  if (pathname === "/signup") return `/sign-up${search}`;
  if (pathname === "/financing" || pathname.startsWith("/financing/")) {
    return `${pathname.replace(/^\/financing/, "/finance")}${search}`;
  }
  if (pathname === "/loan" || pathname.startsWith("/loan/")) {
    return `${pathname.replace(/^\/loan/, "/apply")}${search}`;
  }
  return null;
}

async function fetchStudentFlowSnapshot(
  supabase: ReturnType<typeof createServerClient>,
  supabaseUid: string
): Promise<StudentFlowSnapshot> {
  const { data } = await supabase
    .from("users")
    .select("role, onboarding_complete, wow_completed")
    .eq("supabase_uid", supabaseUid)
    .maybeSingle();

  return {
    role: data?.role ?? null,
    onboarding_complete: Boolean(data?.onboarding_complete),
    wow_completed: Boolean(data?.wow_completed),
  };
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const isNbfcPortal = process.env.NEXT_PUBLIC_PORTAL_MODE === "nbfc";

  let studentFlowMemo: StudentFlowSnapshot | undefined;

  async function loadStudentFlow(): Promise<StudentFlowSnapshot> {
    if (!user) {
      return {
        role: null,
        onboarding_complete: false,
        wow_completed: false,
      };
    }
    if (!studentFlowMemo) {
      studentFlowMemo = await fetchStudentFlowSnapshot(supabase, user.id);
    }
    return studentFlowMemo;
  }

  const legacy = legacyAuthRedirect(pathname, search);
  if (legacy) {
    return sameRedirect(request, legacy);
  }

  if (pathname === "/nbfc/login") {
    return sameRedirect(request, `/sign-in${search}`);
  }

  if (isNbfcPortal && isStudentJourneyPath(pathname)) {
    return sameRedirect(request, `/sign-in${search}`);
  }

  if (pathname === "/" && isNbfcPortal) {
    if (!user) {
      return sameRedirect(request, `/sign-in${search}`);
    }
    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("supabase_uid", user.id)
      .maybeSingle();
    const role = dbUser?.role;

    if (role === "nbfc_supervisor") {
      return sameRedirect(request, `/nbfc/applications${search}`);
    }
    return sameRedirect(request, `/sign-in${search}`);
  }

  if (pathname === "/" && !isNbfcPortal) {
    if (!user) {
      return supabaseResponse;
    }
    const flow = await loadStudentFlow();
    const dest = destinationForAuthenticatedStudentAppUser(flow);
    return sameRedirect(request, dest);
  }

  const isProtectedStudentRoute = isStudentJourneyPath(pathname);

  if (!isNbfcPortal && isProtectedStudentRoute && !user) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", `${pathname}${search === "?" ? "" : search}`);
    return sameRedirect(request, `${signIn.pathname}${signIn.search}`);
  }

  if (!isNbfcPortal && isProtectedStudentRoute && user) {
    const flow = await loadStudentFlow();
    if (isNbfcSupervisorRole(flow.role)) {
      return sameRedirect(request, `/sign-in${search}`);
    }

    const onb = onboardingRouteRedirect(pathname, search, flow);
    if (onb) {
      return sameRedirect(request, onb);
    }

    const hub = hubGuardRedirectDestination(pathname, flow);
    if (hub) {
      return sameRedirect(request, hub);
    }
  }

  if (["/sign-in", "/sign-up"].includes(pathname) && user) {
    if (isNbfcPortal) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("role")
        .eq("supabase_uid", user.id)
        .maybeSingle();
      const role = dbUser?.role;

      if (role === "nbfc_supervisor") {
        return sameRedirect(request, `/nbfc/applications${search}`);
      }
      return supabaseResponse;
    }

    const flow = await loadStudentFlow();
    if (isNbfcSupervisorRole(flow.role)) {
      return sameRedirect(request, `/nbfc${search}`);
    }

    if (pathname === "/sign-up") {
      return sameRedirect(request, "/onboarding");
    }

    const nextRaw = request.nextUrl.searchParams.get("next");
    const dest = destinationAfterSignIn(flow, nextRaw, "/dashboard");
    return sameRedirect(request, dest);
  }

  if (pathname.startsWith("/nbfc")) {
    if (!user) {
      const loginUrl = new URL("/sign-in", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return sameRedirect(request, `${loginUrl.pathname}${loginUrl.search}`);
    }

    const { data: dbUser, error: dbErr } = await supabase
      .from("users")
      .select("role")
      .eq("supabase_uid", user.id)
      .maybeSingle();

    if (dbErr) {
      console.warn(
        `[mw] /nbfc role lookup failed for ${user.id}: ${dbErr.message}`
      );
    }

    if (dbUser?.role !== "nbfc_supervisor") {
      console.warn(
        `[mw] /nbfc denied for ${user.email ?? user.id} (role=${
          dbUser?.role ?? "<missing>"
        }). If Drizzle shows nbfc_supervisor but this is <missing>, apply RLS migration 0001_users_rls_authenticated_read (pnpm db:push).`
      );
      return sameRedirect(request, `/sign-in${search}`);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
