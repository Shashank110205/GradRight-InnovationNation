import { cache } from "react";

import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";

export const getNbfcAuthContext = cache(async () => {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role !== "nbfc_supervisor") {
    return null;
  }

  return { authUser, appUser };
});
