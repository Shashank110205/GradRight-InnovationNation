import { z } from "zod";

/**
 * Typed accessors for environment variables. Prefer these over raw `process.env`
 * in application code so missing configuration fails in one place.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_PORTAL_MODE: z.string().optional(),
  NEXT_PUBLIC_STUDENT_ORIGIN: z.string().optional(),
  NEXT_PUBLIC_NBFC_ORIGIN: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cachedPublic: PublicEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PORTAL_MODE: process.env.NEXT_PUBLIC_PORTAL_MODE,
    NEXT_PUBLIC_STUDENT_ORIGIN: process.env.NEXT_PUBLIC_STUDENT_ORIGIN,
    NEXT_PUBLIC_NBFC_ORIGIN: process.env.NEXT_PUBLIC_NBFC_ORIGIN,
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(
      `Invalid public environment: ${JSON.stringify(msg, null, 2)}`
    );
  }
  cachedPublic = parsed.data;
  return parsed.data;
}

/** Run on server startup (see `instrumentation.ts`). */
export function validateServerEnv(): void {
  getPublicEnv();
}
