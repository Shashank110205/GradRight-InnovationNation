/**
 * Database entrypoints for GradRight web (Drizzle + Supabase).
 * Prefer `@/lib/db/schema` for table/enum imports in migrations and relations.
 */
export { db } from "./client";
export * from "./schema";
export * from "./supabase";
