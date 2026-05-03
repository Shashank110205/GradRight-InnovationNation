import { config } from "dotenv";
import { resolve } from "path";

import { defineConfig } from "drizzle-kit";

// Next.js reads `.env.local`; Drizzle CLI only loaded `.env` by default.
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

/**
 * Drizzle Kit configuration (see PROJECT_SETUP.md Step 7).
 * Uses `dialect: "postgresql"` and `url` for drizzle-kit 0.21+ compatibility.
 */
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl!,
    // Match `lib/db/client.ts` — avoids SELF_SIGNED_CERT_IN_CHAIN with some Node/network setups.
    ...(databaseUrl && /supabase\.(com|co)/i.test(databaseUrl)
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  },
});
