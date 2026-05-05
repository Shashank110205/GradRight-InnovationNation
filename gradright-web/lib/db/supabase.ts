import {
  createBrowserClient,
  createServerClient as createSupabaseCookieClient,
} from "@supabase/ssr";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Trim + strip CR/BOM — CRLF `.env` on Windows often leaves `\r` on values and breaks URLs/JWTs. */
export function envStr(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined) return undefined;
  const t = v.trim().replace(/\r/g, "").replace(/\uFEFF/g, "");
  return t.length > 0 ? t : undefined;
}

/**
 * Browser / client-component Supabase client (anon key, public).
 * Uses `@supabase/ssr` for consistent auth behavior with the server client.
 */
export function createClient() {
  const url = envStr("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = envStr("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }

  return createBrowserClient(url, anonKey);
}

/**
 * Server Components, Server Actions, and Route Handlers: session-aware client
 * with cookie storage (anon key). Prefer this for RLS-scoped access as the
 * signed-in user.
 */
export async function createServerClient() {
  const url = envStr("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = envStr("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }

  const cookieStore = await cookies();

  return createSupabaseCookieClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — cookie mutation is not allowed; middleware refreshes session.
        }
      },
    },
  });
}

/**
 * Service-role client for trusted server-only operations (e.g. Storage admin,
 * bypassing RLS). **Never** import or call from client bundles.
 * Uses `@supabase/supabase-js` because the service role does not use cookie sessions.
 */
export function createServiceRoleSupabaseClient() {
  const url = envStr("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = envStr("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }

  return createServiceRoleClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
