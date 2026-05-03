-- NBFC / middleware: Supabase JS reads `public.users` via PostgREST with the end-user JWT.
-- Drizzle (DATABASE_URL) writes bypass RLS as the database owner, so rows + roles can exist
-- while `supabase.from("users").select("role")` still returns zero rows → middleware logs
-- `role=<missing>` and bounces to /sign-in.
--
-- Apply with: `pnpm db:push` (or `drizzle-kit migrate`) from `gradright-web`.

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON "public"."users";
CREATE POLICY "users_select_own"
  ON "public"."users"
  FOR SELECT
  TO authenticated
  USING ("supabase_uid" = (SELECT (auth.uid())::text));
