import { cache } from "react";

import { ensureUserFromAuth, getUserBySupabaseUID } from "@/lib/db/queries/users";
import { createServerClient } from "@/lib/db/supabase";

/** Per-request dedupe for layout + pages under the authenticated hub route group. */
export const getDashboardAuthContext = cache(async () => {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  let appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser && authUser.email) {
    try {
      appUser = await ensureUserFromAuth({
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata as { full_name?: string },
      });
    } catch (e) {
      console.error("[getDashboardAuthContext] ensureUserFromAuth failed", e);
      return null;
    }
  }
  if (!appUser) {
    return null;
  }

  return { authUser, appUser };
});
