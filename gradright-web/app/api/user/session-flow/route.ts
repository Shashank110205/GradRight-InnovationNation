import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser) {
    return NextResponse.json({
      authenticated: true,
      role: null,
      onboarding_complete: false,
      wow_completed: false,
    });
  }

  return NextResponse.json({
    authenticated: true,
    role: appUser.role,
    onboarding_complete: appUser.onboarding_complete,
    wow_completed: appUser.wow_completed,
  });
}
