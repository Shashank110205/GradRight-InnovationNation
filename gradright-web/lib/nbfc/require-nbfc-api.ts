import { createServerClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import type { User } from "@/lib/types";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

export type NbfcApiAuthOk = {
  authUser: SupabaseAuthUser;
  appUser: User;
};

export async function requireNbfcSupervisorApi(): Promise<
  NbfcApiAuthOk | { error: string; status: number }
> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return { error: "Unauthorized", status: 401 };
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role !== "nbfc_supervisor") {
    return { error: "NBFC supervisor access required", status: 403 };
  }

  return { authUser, appUser };
}
