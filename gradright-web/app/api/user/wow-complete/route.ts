import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID, setUserWowComplete } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser) {
    return NextResponse.json(apiError("User not found"), { status: 404 });
  }

  if (appUser.role === "nbfc_supervisor") {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  if (!appUser.onboarding_complete) {
    return NextResponse.json(
      apiError("Complete onboarding before finishing WOW"),
      { status: 400 }
    );
  }

  try {
    await setUserWowComplete(appUser.id);
    return NextResponse.json(apiSuccess({ ok: true }));
  } catch (e) {
    console.error("[POST /api/user/wow-complete]", e);
    return NextResponse.json(apiError("Failed to update"), { status: 500 });
  }
}
