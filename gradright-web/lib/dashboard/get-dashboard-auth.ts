import { cache } from "react";

import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";

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

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser) {
    return null;
  }

  return { authUser, appUser };
});
